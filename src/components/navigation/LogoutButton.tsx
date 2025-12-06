import { logout } from "@/app/actions/auth";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton({ iconOnly }: { iconOnly?: boolean } = {}) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={cn(
          "flex items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold text-[var(--color-text-heading)] transition hover:bg-[var(--color-bg-alt)]",
          iconOnly ? "h-10 w-10" : "px-4 py-2"
        )}
        aria-label="Logout"
      >
        <LogOut size={18} />
        {!iconOnly && <span>Logout</span>}
      </button>
    </form>
  );
}
