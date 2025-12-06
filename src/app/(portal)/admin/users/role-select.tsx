"use client";

import { UserRole } from "@prisma/client";
import { useTransition } from "react";
import { updateUserRole } from "./actions";
import { cn } from "@/lib/utils";

export default function RoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: UserRole;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateUserRole(formData);
        });
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        className={cn(
          "rounded-xl border border-border bg-[var(--color-bg-alt)] px-2 py-1 text-xs font-semibold",
          pending && "opacity-60"
        )}
      >
        {Object.values(UserRole).map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className={cn(
          "rounded-full border border-border px-3 py-1 text-xs font-semibold text-[var(--color-text-heading)]",
          pending && "opacity-60"
        )}
      >
        Save
      </button>
    </form>
  );
}
