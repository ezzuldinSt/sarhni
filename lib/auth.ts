import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login", // Points to the custom login page at app/(auth)/login/page.tsx
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ username: z.string(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { username, password } = parsedCredentials.data;
          
          // FIX: Normalize to lowercase to ensure case-insensitive login
          // (e.g. "Zhr" becomes "zhr" for the database lookup)
          const user = await prisma.user.findUnique({ 
            where: { username: username.toLowerCase() } 
          });
          
          if (!user || !user.password) return null;
          
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return user;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        
        // Fetch fresh user data on every session check
        // This ensures profile picture updates appear immediately
        const freshUser = await prisma.user.findUnique({ 
            where: { id: token.sub }
        });
        
        if(freshUser) {
            session.user.name = freshUser.username;
            session.user.image = freshUser.image;
        }
      }
      return session;
    },
  },
});

