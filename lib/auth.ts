import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Extend the built-in types to include 'role', 'username', and other custom fields
declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    role?: string;
    isBanned?: boolean;
    image?: string | null;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      isBanned?: boolean;
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
        try {
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
        } catch (error) {
          console.error("Auth authorize error:", error);
          // Re-throw ban errors, return null for database errors
          if (error instanceof Error && error.message.includes("banned")) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      try {
        if (user) {
          token.sub = user.id;
          token.role = user.role;
          token.isBanned = user.isBanned;
          token.username = user.username;
          token.image = user.image;
          token.lastChecked = Date.now();
        }
        // Refresh user data from DB on explicit update trigger
        if (trigger === "update" && token.sub) {
          const freshUser = await prisma.user.findUnique({ where: { id: token.sub } });
          if (freshUser) {
            token.role = freshUser.role;
            token.isBanned = freshUser.isBanned;
            token.username = freshUser.username;
            token.image = freshUser.image;
            token.lastChecked = Date.now();
          }
        }
        // OPTIMIZATION: Periodic refresh to catch bans and role changes
        // Extended from 5 minutes to 15 minutes to reduce database queries
        // Critical changes (bans/role changes) still refresh via "update" trigger
        const lastChecked = (token.lastChecked as number) || 0;
        const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes (was 5 minutes)

        if (token.sub && Date.now() - lastChecked > REFRESH_INTERVAL) {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true, isBanned: true, username: true, image: true },
          });
          if (freshUser) {
            token.role = freshUser.role;
            token.isBanned = freshUser.isBanned;
            token.username = freshUser.username;
            token.image = freshUser.image;
          }
          token.lastChecked = Date.now();
        }
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        // Return existing token to prevent session disruption
        return token;
      }
    },
    async session({ session, token }) {
      if (token.isBanned) {
        return { ...session, user: undefined } as any;
      }
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

