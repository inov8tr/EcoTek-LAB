import NextAuth, { type AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AUTH_SECRET } from "@/lib/auth-config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
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
            const codeRow = await prisma.recoveryCode.findFirst({
              where: { userId: user.id, code: recoveryCode, used: false },
            });
            if (codeRow) {
              passed2fa = true;
              await prisma.recoveryCode.update({
                where: { id: codeRow.id },
                data: { used: true, usedAt: new Date() },
              });
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
    async session({ session, user }) {
      if (session.user) {
        session.user = {
          id: (user as any)?.id ?? session.user.id ?? "",
          email: session.user.email ?? null,
          name: session.user.name ?? null,
          role: ((user as any)?.role as UserRole) ?? UserRole.VIEWER,
          status: ((user as any)?.status as UserStatus) ?? UserStatus.PENDING,
        } as typeof session.user & { role: UserRole; status: UserStatus };
      }
      return session;
    },
  },
  secret: AUTH_SECRET,
});

export type { AuthError };
