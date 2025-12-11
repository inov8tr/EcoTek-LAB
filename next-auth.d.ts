import { UserRole, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: UserRole;
      status: UserStatus;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    status: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    status?: UserStatus;
  }
}
