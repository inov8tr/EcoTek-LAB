import Link from "next/link";
import type { Route } from "next";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateUserStatus, deleteUser } from "./actions";
import RoleSelect from "./role-select";

const STATUS_FILTERS: (UserStatus | "ALL")[] = ["ALL", "PENDING", "ACTIVE", "SUSPENDED"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { status?: string; q?: string; role?: string };
}) {
  await requireRole([UserRole.ADMIN]);
  const statusParam = searchParams?.status?.toUpperCase() ?? "ALL";
  const activeFilter = STATUS_FILTERS.includes(statusParam as UserStatus | "ALL")
    ? statusParam
    : "ALL";
  const q = searchParams?.q?.toLowerCase().trim() ?? "";
  const roleParam = searchParams?.role?.toUpperCase() ?? "";
  const where =
    activeFilter === "ALL"
      ? {}
      : { status: activeFilter as UserStatus };

  const roleFilter = roleParam && Object.values(UserRole).includes(roleParam as UserRole) ? (roleParam as UserRole) : null;

  const users = await prisma.user.findMany({
    where: {
      ...where,
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-heading)]">User management</h1>
          <p className="text-[var(--color-text-muted)]">
            Approve pending accounts, assign roles, and suspend compromised access.
          </p>
        </div>
        <Link
          href={"/signup" as Route}
          className="text-sm font-semibold text-[var(--color-text-link)] underline-offset-4 hover:underline"
        >
          Copy signup link
        </Link>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filter by status">
        {STATUS_FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          const href =
            filter === "ALL"
              ? ("/admin/users" as Route)
              : ({
                  pathname: "/admin/users",
                  query: { status: filter.toLowerCase() },
                } as const);
          return (
            <Link
              key={filter}
              href={href}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                isActive
                  ? "border-[var(--color-accent-primary)] text-[var(--color-text-heading)]"
                  : "border-border text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]"
              )}
            >
              {filter === "ALL" ? "All users" : filter}
            </Link>
          );
        })}
      </div>

      <form className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm" method="get">
        <div className="flex items-center gap-2">
          <label htmlFor="q" className="text-sm font-semibold text-[var(--color-text-heading)]">Search</label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Name or email"
            className="w-56 rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="role" className="text-sm font-semibold text-[var(--color-text-heading)]">Role</label>
          <select
            id="role"
            name="role"
            defaultValue={roleFilter ?? ""}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Apply
        </Button>
        {(q || roleFilter) && (
          <Link href={"/admin/users" as Route} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]">
            Clear
          </Link>
        )}
        <div className="ml-auto">
          <Link
            href={{
              pathname: "/api/admin/users/export",
              query: {
                status: activeFilter !== "ALL" ? activeFilter.toLowerCase() : undefined,
                role: roleFilter ?? undefined,
                q: q || undefined,
              },
            }}
            className="text-sm font-semibold text-[var(--color-text-link)] underline-offset-4 hover:underline"
            aria-label="Export filtered users as CSV"
          >
            Export CSV
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full table-auto text-sm" aria-label="Users table">
          <thead className="text-left text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t border-border/60 bg-white text-[var(--color-text-main)]"
              >
                <td className="px-4 py-4 font-semibold text-[var(--color-text-heading)]">
                  {user.name}
                </td>
                <td className="px-4 py-4">{user.email}</td>
                <td className="px-4 py-4">
                  <RoleSelect userId={user.id} currentRole={user.role} />
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      user.status === "ACTIVE" && "bg-[var(--color-status-pass-bg)] text-[var(--color-status-pass-text)]",
                      user.status === "PENDING" && "bg-amber-100 text-amber-700",
                      user.status === "SUSPENDED" && "bg-[var(--color-status-fail-bg)] text-[var(--color-status-fail-text)]"
                    )}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {user.status !== "ACTIVE" && (
                      <form action={updateUserStatus}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="status" value="ACTIVE" />
                        <Button type="submit" variant="secondary" className="rounded-full px-3 py-1 text-xs">
                          Approve
                        </Button>
                      </form>
                    )}
                    {user.status !== "SUSPENDED" && (
                      <form action={updateUserStatus}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="status" value="SUSPENDED" />
                        <Button type="submit" variant="ghost" className="rounded-full px-3 py-1 text-xs text-[var(--color-status-fail-text)]">
                          Suspend
                        </Button>
                      </form>
                    )}
                    <form action={deleteUser}>
                      <input type="hidden" name="userId" value={user.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        className="rounded-full px-3 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)]"
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                  No users match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
