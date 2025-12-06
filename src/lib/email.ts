type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
};

// Lightweight placeholder to wire up email flows without a provider.
export async function sendEmail({ to, subject, body }: SendEmailInput) {
  console.info("[email stub]", { to, subject, body });
  return { ok: true };
}
