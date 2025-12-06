import { redirect } from "next/navigation";
import type { Route } from "next";

type PageProps = { params: { id: string } };

export default function BitumenTestDetail(_: PageProps) {
  redirect("/binder-tests" as Route);
}
