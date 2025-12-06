import { redirect } from "next/navigation";
import type { Route } from "next";

export default function LegacyTestDetail() {
  redirect("/binder-tests" as Route);
}
