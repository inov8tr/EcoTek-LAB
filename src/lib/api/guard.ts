import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export type Role = "ADMIN" | "LAB" | "VIEWER" | "RESEARCHER";

export interface GuardOptions {
  roles?: Role[];
}

function normalizeRole(role?: Role | UserRole | null): Role {
  if (role === "RESEARCHER") return "LAB";
  return (role as Role) ?? "VIEWER";
}

/**
 * Basic guard: checks auth + role.
 * Returns { user, errorResponse } — caller returns errorResponse if present.
 */
export async function guardRequest(options: GuardOptions = {}) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (options.roles && options.roles.length > 0) {
    const userRole = normalizeRole(user.role as Role);
    const allowedRoles = options.roles.map((r) => normalizeRole(r));

    if (!allowedRoles.includes(userRole)) {
      return {
        user,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
  }

  return { user, errorResponse: null };
}

/**
 * Safe JSON body parser with basic error handling.
 */
export async function parseJsonBody<T = any>(
  req: Request
): Promise<{ body: T | null; errorResponse: Response | null }> {
  try {
    const body = (await req.json()) as T;
    return { body, errorResponse: null };
  } catch {
    return {
      body: null,
      errorResponse: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}
