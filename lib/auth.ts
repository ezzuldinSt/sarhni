import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Extend the built-in types to include 'role'
declare module "next-auth" {
  interface User {
    role?: string;
    isBanned?: boolean;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;      // <--- Added
      isBanned?: boolean; // <--- Added
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z.object({ username: z.string(), password: z.string() }).safeParse(credentials);
        if (parsed.success) {
          const user = await prisma.user.findUnique({ 
            where: { username: parsed.data.username.toLowerCase() } 
          });
          
          if (!user || !user.password) return null;
          
          // CHECK BAN STATUS
          if (user.isBanned) {
            throw new Error("This account has been banned.");
          }

          const match = await bcrypt.compare(parsed.data.password, user.password);
          if (match) return user;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.isBanned = user.isBanned;
        token.username = (user as any).username;
        token.image = user.image;
      }
      // Refresh user data from DB on explicit update trigger
      if (trigger === "update" && token.sub) {
        const freshUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (freshUser) {
          token.role = freshUser.role;
          token.isBanned = freshUser.isBanned;
          token.username = freshUser.username;
          token.image = freshUser.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.name = token.username as string;
        session.user.image = token.image as string | null;
        session.user.role = token.role as string;
        session.user.isBanned = token.isBanned as boolean;
      }
      return session;
    },
  },
});

