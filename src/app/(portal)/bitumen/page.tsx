import { redirect } from "next/navigation";
import type { Route } from "next";

export default function BitumenIndexPage() {
  // Simple redirect to origins list to satisfy the /bitumen route.
  redirect("/bitumen/origins" as Route);
}
