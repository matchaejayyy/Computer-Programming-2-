function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendPasswordResetOtpEmail(params: {
  to: string;
  name: string;
  otp: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "onboarding@resend.dev";
  const subject = "San Agustin Clinic password reset code";

  const text = [
    `Hello ${params.name},`,
    "",
    "You requested to reset your password.",
    `Your 6-digit OTP is: ${params.otp}`,
    "",
    "This code expires in 10 minutes.",
    "If you did not request this, you can ignore this email.",
    "",
    "— San Agustin Clinic",
  ].join("\n");

  const html = `
    <p>Hello ${escapeHtml(params.name)},</p>
    <p>You requested to reset your password.</p>
    <p><strong>Your 6-digit OTP:</strong> <code style="font-size:20px;letter-spacing:2px">${escapeHtml(params.otp)}</code></p>
    <p>This code expires in 10 minutes.</p>
    <p>If you did not request this, you can ignore this email.</p>
    <p>— San Agustin Clinic</p>
  `;

  if (!key) {
    throw new Error(
      "Email service is not configured (missing RESEND_API_KEY)."
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend error ${res.status}: ${errText}`);
  }
}
