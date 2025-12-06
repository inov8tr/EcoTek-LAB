"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { EllipsisVertical } from "lucide-react";

export function ActionsMenu({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-md border bg-white text-gray-600 transition hover:bg-gray-100"
      >
        <EllipsisVertical className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-lg ring-1 ring-black/5">
          <div className="py-1 text-sm text-gray-800">
            <MenuItem href={`/binder-tests/${id}/review` as Route} label="Review" onSelect={() => setOpen(false)} />
            <MenuItem href={`/binder-tests/${id}` as Route} label="View Data" onSelect={() => setOpen(false)} />
            <MenuItem href={`/binder-tests/${id}/documents` as Route} label="Documents" onSelect={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, label, onSelect }: { href: Route; label: string; onSelect: () => void }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 hover:bg-gray-100"
      onClick={onSelect}
    >
      {label}
    </Link>
  );
}
