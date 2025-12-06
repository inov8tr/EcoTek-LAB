import { redirect } from "next/navigation";
import type { Route } from "next";

export default function AdminBinderTestsDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/binder-tests/${params.id}` as Route);
}
