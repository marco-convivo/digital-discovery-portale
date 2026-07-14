import "server-only";

// Invio email via Resend REST. Best-effort: se manca RESEND_API_KEY non lancia
// (il sistema resta usabile; gli alert restano comunque visibili nel CRM).
const FROM =
  process.env.EMAIL_FROM ?? "Digital Discovery <noreply@digital-discovery.it>";

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const { replyTo, ...rest } = input;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        ...rest,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
