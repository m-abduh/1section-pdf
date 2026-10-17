import { env, appUrl } from "../config/env";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (env.EMAIL_PROVIDER === "log" || !env.RESEND_API_KEY) {
    console.log(
      `[email] (${env.EMAIL_PROVIDER}) -> ${input.to}: ${input.subject}\n${input.text}`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Email provider error (${response.status}): ${detail}`);
  }
}

export async function sendAccessLinkEmail(params: {
  to: string;
  orderNumber: string;
  token: string;
}): Promise<void> {
  const url = `${appUrl}/checkout/success?order=${encodeURIComponent(
    params.orderNumber,
  )}&access=${encodeURIComponent(params.token)}`;

  const text = [
    `Thanks for your purchase. Here is your access link for order ${params.orderNumber}.`,
    "",
    url,
    "",
    "Keep this email — you can use the link anytime to reach your downloads.",
    "If you did not make this purchase, you can ignore this email.",
    "",
    "1section — Practical learning for real-world problems.",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5">
      <h2>Thanks for your purchase</h2>
      <p>Use the secure link below to access your resources for order <strong>${params.orderNumber}</strong>.</p>
      <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none">Open my resources</a></p>
      <p style="color:#64748b;font-size:12px">Keep this email — you can use the link anytime to reach your downloads. If you did not make this purchase, you can ignore this email.</p>
      <p style="color:#94a3b8;font-size:12px">1section — Practical learning for real-world problems.</p>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject: `Your downloads — 1section (${params.orderNumber})`,
    html,
    text,
  });
}
