"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStatus } from "@/lib/auth-helpers";
import { UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendMail, isEmailEnabled } from "@/lib/mailer";
import { recordEvent } from "@/lib/events";

function redirectWithMessage(type: "success" | "error", message: string) {
  const params = new URLSearchParams();
  params.set(type, message);
  redirect(`/resources/support?${params.toString()}`);
}

export async function submitSupportRequest(formData: FormData) {
  const user = await requireStatus(UserStatus.ACTIVE);
  const subject = (formData.get("subject") ?? "").toString().trim();
  const message = (formData.get("message") ?? "").toString().trim();
  const severity = (formData.get("severity") ?? "normal").toString();
  if (!subject || !message) {
    redirectWithMessage("error", "Subject and message are required.");
  }

  const record = await prisma.supportRequest.create({
    data: {
      userId: user.id,
      subject: severity === "urgent" ? `[URGENT] ${subject}` : subject,
      message,
      status: "open",
    },
  });

  await recordEvent({
    userId: user.id,
    eventType: "SUPPORT_REQUEST",
    detail: subject,
    category: "system",
    channel: isEmailEnabled() ? "email" : "in-app",
    link: `/resources/support`,
  });

  if (isEmailEnabled()) {
    const to = process.env.SUPPORT_EMAIL ?? process.env.SMTP_FROM ?? user.email ?? "";
    const body = `New support request from ${user.email ?? user.id}\n\nSubject: ${subject}\nSeverity: ${severity}\n\n${message}\n\nLink: ${process.env.APP_BASE_URL ?? ""}/resources/support`;
    await sendMail({
      to,
      subject: `Support: ${subject}`,
      text: body,
    }).catch((err) => console.error("Support email failed", err));
  }

  revalidatePath("/resources/support");
  redirectWithMessage("success", "Request submitted. We will get back to you soon.");
}
