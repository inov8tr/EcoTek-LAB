import { useEffect, useRef } from "react";

export function useFocusTrap(active: boolean, refs: Array<React.RefObject<HTMLElement>>) {
  const lastActive = useRef<Element | null>(null);

  useEffect(() => {
    if (active) {
      lastActive.current = document.activeElement;
      const first = refs.find((r) => r.current)?.current;
      first?.focus();
    } else if (lastActive.current instanceof HTMLElement) {
      lastActive.current.focus();
    }
  }, [active, refs]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!active) return;
      if (e.key === "Escape") {
        e.preventDefault();
        refs.forEach((ref) => {
          const el = ref.current;
          if (el && typeof (el as any).click === "function" && el.getAttribute("data-close") === "true") {
            (el as any).click();
          }
        });
      }
      if (e.key === "Tab") {
        const focusables = refs.map((r) => r.current).filter(Boolean) as HTMLElement[];
        if (focusables.length < 2) return;
        const activeEl = document.activeElement;
        const currentIndex = focusables.findIndex((el) => el === activeEl);
        if (currentIndex === -1) return;
        e.preventDefault();
        if (e.shiftKey) {
          const prev = (currentIndex - 1 + focusables.length) % focusables.length;
          focusables[prev]?.focus();
        } else {
          const next = (currentIndex + 1) % focusables.length;
          focusables[next]?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [active, refs]);
}
