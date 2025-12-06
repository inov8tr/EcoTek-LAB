import { redirect } from "next/navigation";
import type { Route } from "next";

export default function NewBitumenTestPage() {
  redirect("/binder-tests/new" as Route);
}
