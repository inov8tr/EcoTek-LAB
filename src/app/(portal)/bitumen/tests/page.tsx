import { redirect } from "next/navigation";
import type { Route } from "next";

export default function BitumenTestsPage() {
  // Consolidated under Binder Test Data.
  redirect("/binder-tests" as Route);
}
