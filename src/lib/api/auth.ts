import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { CurrentUser } from "@/lib/auth-helpers";
import { UserRole, UserStatus } from "@prisma/client";

type GuardOptions = {
  roles?: UserRole[];
  requireActive?: boolean;
};

type GuardSuccess = { user: CurrentUser };
type GuardFailure = { response: NextResponse };

export async function guardApiUser(
  options: GuardOptions = {},
): Promise<GuardSuccess | GuardFailure> {
  const session = await auth();
  const user = session?.user as CurrentUser | undefined;

  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (options.requireActive && user.status !== UserStatus.ACTIVE) {
    return {
      response: NextResponse.json({ error: "Account not active" }, { status: 403 }),
    };
  }

  if (options.roles && !options.roles.includes(user.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}
