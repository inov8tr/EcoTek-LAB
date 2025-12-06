import NextAuth, { type AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email;
        const rawPassword = credentials?.password;
        const email =
          typeof rawEmail === "string" ? rawEmail.toLowerCase() : "";
        const password = typeof rawPassword === "string" ? rawPassword : "";

        if (!email || !password) {
          throw new Error("INVALID_CREDENTIALS");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (user.status === UserStatus.PENDING) {
          throw new Error("PENDING");
        }

        if (user.status === UserStatus.SUSPENDED) {
          throw new Error("SUSPENDED");
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (user.status !== UserStatus.ACTIVE) {
          throw new Error("INACTIVE");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.status = (user as { status?: string }).status;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole) ?? UserRole.VIEWER;
        session.user.status = (token.status as UserStatus) ?? UserStatus.PENDING;
      }
      return session;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "development-secret"),
});

export type { AuthError };
