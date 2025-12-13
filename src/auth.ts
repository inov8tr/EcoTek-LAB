import NextAuth, { type AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { User, UserRole, UserStatus } from "@prisma/client";
import { AUTH_SECRET } from "@/lib/auth-config";
import { dbQuery } from "@/lib/db-proxy";

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
        recoveryCode: { label: "Recovery Code", type: "text" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email;
        const rawPassword = credentials?.password;
        const rawTotp = credentials?.totp;
        const rawRecovery = credentials?.recoveryCode;
        const email =
          typeof rawEmail === "string" ? rawEmail.toLowerCase() : "";
        const password = typeof rawPassword === "string" ? rawPassword : "";
        const totp = typeof rawTotp === "string" ? rawTotp : "";
        const recoveryCode = typeof rawRecovery === "string" ? rawRecovery.trim() : "";

        if (!email || !password) {
          throw new Error("INVALID_CREDENTIALS");
        }

        const [user] = await dbQuery<User>('SELECT * FROM "User" WHERE "email" = $1 LIMIT 1', [email]);
        if (!user) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (user.status === "PENDING") {
          throw new Error("PENDING");
        }

        if (user.status === "SUSPENDED") {
          throw new Error("SUSPENDED");
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (user.status !== "ACTIVE") {
          throw new Error("INACTIVE");
        }

        if (user.twoFactorEnabled) {
          let passed2fa = false;
          if (totp) {
            const { authenticator } = await import("otplib");
            if (!user.twoFactorSecret) {
              throw new Error("2FA_MISCONFIGURED");
            }
            const ok = authenticator.verify({ token: totp, secret: user.twoFactorSecret });
            if (ok) passed2fa = true;
          }
          if (!passed2fa && recoveryCode) {
            const [codeRow] = await dbQuery<{ id: string }>(
              'SELECT "id" FROM "RecoveryCode" WHERE "userId" = $1 AND "code" = $2 AND "used" = false ORDER BY "createdAt" ASC LIMIT 1',
              [user.id, recoveryCode],
            );
            if (codeRow) {
              passed2fa = true;
              await dbQuery(
                'UPDATE "RecoveryCode" SET "used" = true, "usedAt" = now() WHERE "id" = $1',
                [codeRow.id],
              );
            }
          }
          if (!passed2fa) {
            throw new Error("INVALID_TOTP");
          }
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
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role;
        token.status = (user as { status?: UserStatus }).status;
        token.sessionId = token.sessionId ?? generateSessionId();
        const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
        await dbQuery(
          'INSERT INTO "Session" ("userId", "sessionToken", "expires", "lastSeenAt", "revoked") VALUES ($1, $2, $3, now(), false) ON CONFLICT ("sessionToken") DO UPDATE SET "expires" = $3, "lastSeenAt" = now(), "revoked" = false',
          [(user as any).id, token.sessionId as string, expires.toISOString()],
        ).catch((err) => console.error("Session upsert failed", err));
      }
      return token;
    },
    async session({ session, token, user }) {
      if (session.user) {
        session.user = {
          id: (user as any)?.id ?? (token.sub as string | undefined) ?? session.user.id ?? "",
          email: session.user.email ?? null,
          name: session.user.name ?? null,
          role: ((user as any)?.role as UserRole) ?? ((token.role as UserRole) ?? ("VIEWER" as UserRole)),
          status: ((user as any)?.status as UserStatus) ?? ((token.status as UserStatus) ?? ("PENDING" as UserStatus)),
        } as typeof session.user & { role: UserRole; status: UserStatus };
      }
      return session;
    },
  },
  secret: AUTH_SECRET,
});

function generateSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export type { AuthError };
