import { logout } from "@/app/actions/auth";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton({ iconOnly }: { iconOnly?: boolean } = {}) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={cn(
          "flex items-center justify-center gap-2 rounded-md border border-neutral-200 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
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
