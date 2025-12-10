import Link from "next/link";
import type { Route } from "next";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateUserStatus, deleteUser, createUser } from "./actions";
import RoleSelect from "./role-select";

const STATUS_FILTERS: (UserStatus | "ALL")[] = ["ALL", "PENDING", "ACTIVE", "SUSPENDED"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  await requireRole([UserRole.ADMIN]);
  const statusParam = searchParams?.status?.toUpperCase() ?? "ALL";
  const activeFilter = STATUS_FILTERS.includes(statusParam as UserStatus | "ALL")
    ? statusParam
    : "ALL";
  const where =
    activeFilter === "ALL" ? {} : { status: activeFilter as UserStatus };

  const users = await prisma.user.findMany({
    where,
    include: {
      sessions: {
        orderBy: { lastSeenAt: "desc" },
        take: 1,
      },
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

      <div className="rounded-2xl border border-[#E3E8EF] bg-[#FFFFFF] p-4 shadow-sm">
        <p className="text-sm font-semibold text-[var(--color-text-heading)] mb-3">Create user</p>
        <form action={createUser} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-[var(--color-text-heading)]">
            Name
            <input
              name="name"
              required
              className="mt-1 w-full rounded-md border border-[#E3E8EF] bg-[#FFFFFF] px-3 py-2 text-sm text-[var(--color-text-heading)] shadow-sm"
            />
          </label>
          <label className="text-sm text-[var(--color-text-heading)]">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-[#E3E8EF] bg-[#FFFFFF] px-3 py-2 text-sm text-[var(--color-text-heading)] shadow-sm"
            />
          </label>
          <label className="text-sm text-[var(--color-text-heading)]">
            Password
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-md border border-[#E3E8EF] bg-[#FFFFFF] px-3 py-2 text-sm text-[var(--color-text-heading)] shadow-sm"
            />
          </label>
          <div className="flex gap-2">
            <select
              name="role"
              defaultValue={UserRole.VIEWER}
              className="w-full rounded-md border border-[#E3E8EF] bg-[#FFFFFF] px-3 py-2 text-sm text-[var(--color-text-heading)] shadow-sm"
            >
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={UserStatus.ACTIVE}
              className="w-full rounded-md border border-[#E3E8EF] bg-[#FFFFFF] px-3 py-2 text-sm text-[var(--color-text-heading)] shadow-sm"
            >
              {Object.values(UserStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Button type="submit" className="whitespace-nowrap px-4">
              Create
            </Button>
          </div>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
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

      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full table-auto text-sm">
          <thead className="text-left text-[var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Last active</th>
              <th className="px-4 py-3 font-semibold">2FA</th>
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
                <td className="px-4 py-4 text-xs text-[var(--color-text-muted)]">
                  {user.sessions[0]?.lastSeenAt
                    ? new Intl.DateTimeFormat("en-CA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(user.sessions[0].lastSeenAt)
                    : "—"}
                </td>
                <td className="px-4 py-4 text-xs font-semibold">
                  {user.twoFactorEnabled ? (
                    <span className="text-[var(--color-status-pass-text)]">Enabled</span>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">Off</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {user.status !== "ACTIVE" && (
                      <form action={updateUserStatus}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="status" value="ACTIVE" />
                        <Button type="submit" variant="outline" className="rounded-full px-3 py-1 text-xs">
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
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
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
