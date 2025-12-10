"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth, signIn, signOut, type AuthError } from "@/auth";
import { captureClientMetadata } from "@/lib/security-events";

type AuthState = {
  error?: string;
  success?: string;
};

const INVALID_MESSAGE = "Invalid email or password.";

function mapAuthError(error: AuthError): string {
  if (error.type === "CredentialsSignin") {
    const causeMessage =
      (error.cause as Error | undefined)?.message ?? error.message;
    if (causeMessage === "PENDING") {
      return "Your account is still pending admin approval.";
    }
    if (causeMessage === "SUSPENDED") {
      return "This account has been suspended. Contact an administrator.";
    }
    if (causeMessage === "INVALID_TOTP") {
      return "Invalid 2FA code.";
    }
    if (causeMessage === "2FA_MISCONFIGURED") {
      return "2FA is misconfigured for this account. Contact an administrator.";
    }
    return INVALID_MESSAGE;
  }

  return "Unable to sign in at the moment.";
}

export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const totp = String(formData.get("totp") ?? "");
  const recoveryCode = String(formData.get("recoveryCode") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  if (!email || !password) {
    return { error: INVALID_MESSAGE };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    return { error: INVALID_MESSAGE };
  }

  if (existing.status === UserStatus.PENDING) {
    return { error: "Your account is still pending admin approval." };
  }

  if (existing.status === UserStatus.SUSPENDED) {
    return { error: "This account has been suspended. Contact an administrator." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      totp,
      recoveryCode,
      redirectTo: redirectTo as Route,
    });
    const meta = await captureClientMetadata();
    await prisma.securityEvent.create({
      data: {
        userId: existing.id,
        eventType: "LOGIN_SUCCESS",
        detail: "Credentials login",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
  } catch (error) {
    if ((error as Error).name === "AuthError") {
      return { error: mapAuthError(error as AuthError) };
    }
    throw error;
  }

  return { error: INVALID_MESSAGE };
}

export async function registerUser(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Please complete all required fields." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: UserRole.VIEWER,
      status: UserStatus.PENDING,
    },
  });

  return {
    success: "Request received. Your account is pending admin approval.",
  };
}

export async function logout() {
  const meta = await captureClientMetadata();
  const user = await prisma.user.findUnique({
    where: { email: (await auth())?.user?.email ?? "" },
    select: { id: true },
  });
  if (user) {
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "LOGOUT",
        detail: "User signed out",
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
  }
  await signOut({ redirectTo: "/login" });
}

export async function requireAuthenticatedRedirect() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login" as Route);
  }
}
