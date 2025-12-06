import { UserRole, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: UserRole;
      status: UserStatus;
      displayName?: string | null;
      avatarUrl?: string | null;
      pronouns?: string | null;
      bio?: string | null;
      locale?: string | null;
      timeZone?: string | null;
      theme?: string | null;
      loginAlerts?: boolean;
      twoFactorEnabled?: boolean;
      emailVerified?: Date | null;
      sessionId?: string | null;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    status: UserStatus;
    displayName?: string | null;
    avatarUrl?: string | null;
    pronouns?: string | null;
    bio?: string | null;
    locale?: string | null;
    timeZone?: string | null;
    theme?: string | null;
    loginAlerts?: boolean;
    twoFactorEnabled?: boolean;
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    status?: UserStatus;
    displayName?: string | null;
    avatarUrl?: string | null;
    pronouns?: string | null;
    bio?: string | null;
    locale?: string | null;
    timeZone?: string | null;
    theme?: string | null;
    loginAlerts?: boolean;
    twoFactorEnabled?: boolean;
    emailVerified?: Date | null;
    sessionId?: string | null;
  }
}
