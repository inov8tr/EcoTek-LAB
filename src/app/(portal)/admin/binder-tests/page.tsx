import { redirect } from "next/navigation";
import type { Route } from "next";

export default function AdminBinderTestsRedirect() {
  redirect("/binder-tests" as Route);
}
