import NextAuth, { type AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
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
        totp: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email;
        const rawPassword = credentials?.password;
        const rawTotp = credentials?.totp;
        const email =
          typeof rawEmail === "string" ? rawEmail.toLowerCase() : "";
        const password = typeof rawPassword === "string" ? rawPassword : "";
        const totp = typeof rawTotp === "string" ? rawTotp : "";

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

        if (user.twoFactorEnabled) {
          const { authenticator } = await import("otplib");
          if (!user.twoFactorSecret) {
            throw new Error("2FA_MISCONFIGURED");
          }
          const ok = authenticator.verify({ token: totp, secret: user.twoFactorSecret });
          if (!ok) {
            throw new Error("INVALID_TOTP");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          pronouns: user.pronouns,
          bio: user.bio,
          locale: user.locale,
          timeZone: user.timeZone,
          theme: user.theme,
          loginAlerts: user.loginAlerts,
          twoFactorEnabled: user.twoFactorEnabled,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role;
        token.status = (user as { status?: UserStatus }).status;
        token.displayName = (user as any).displayName ?? null;
        token.avatarUrl = (user as any).avatarUrl ?? null;
        token.pronouns = (user as any).pronouns ?? null;
        token.bio = (user as any).bio ?? null;
        token.locale = (user as any).locale ?? null;
        token.timeZone = (user as any).timeZone ?? null;
        token.theme = (user as any).theme ?? "system";
        token.loginAlerts = (user as any).loginAlerts ?? false;
        token.twoFactorEnabled = (user as any).twoFactorEnabled ?? false;
        token.sessionId = token.sessionId ?? randomUUID();
        // Persist session for active user
        prisma.session
          .upsert({
            where: { jti: token.sessionId as string },
            create: { jti: token.sessionId as string, userId: (user as any).id },
            update: { lastSeenAt: new Date(), revoked: false },
          })
          .catch((err) => console.error("Session upsert failed", err));
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole) ?? UserRole.VIEWER;
        session.user.status = (token.status as UserStatus) ?? UserStatus.PENDING;
        session.user.displayName = (token as any).displayName ?? null;
        session.user.avatarUrl = (token as any).avatarUrl ?? null;
        session.user.pronouns = (token as any).pronouns ?? null;
        session.user.bio = (token as any).bio ?? null;
        session.user.locale = (token as any).locale ?? null;
        session.user.timeZone = (token as any).timeZone ?? null;
        session.user.theme = (token as any).theme ?? "system";
        session.user.loginAlerts = (token as any).loginAlerts ?? false;
        session.user.twoFactorEnabled = (token as any).twoFactorEnabled ?? false;
        (session.user as any).sessionId = (token as any).sessionId ?? null;
      }
      return session;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "development-secret"),
});

export type { AuthError };
