/**
 * Sends temporary password for Google-created accounts.
 * Set RESEND_API_KEY (+ optional RESEND_FROM_EMAIL) in .env.local for production.
 * Without a key, dev logs the password to the server console.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendWelcomeEmailWithTempPassword(params: {
  to: string;
  name: string;
  tempPassword: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "onboarding@resend.dev";

  const subject = "Your San Agustin Clinic portal — temporary password";
  const text = [
    `Hello ${params.name},`,
    "",
    "An account was created for you when you signed in with Google.",
    "",
    `Your temporary password is: ${params.tempPassword}`,
    "",
    "Use it with your school email on the login page if you want to sign in without Google.",
    "You can change this password in Profile → Reset password.",
    "",
    "Complete your profile in the student portal for any fields still marked \"Not set\".",
    "",
    "— San Agustin Clinic (student portal)",
  ].join("\n");

  const html = `
    <p>Hello ${escapeHtml(params.name)},</p>
    <p>An account was created for you when you signed in with Google.</p>
    <p><strong>Temporary password:</strong> <code style="font-size:15px">${escapeHtml(params.tempPassword)}</code></p>
    <p>Use it with your school email on the login page if you want to sign in without Google.</p>
    <p>You can change this password under <strong>Profile → Reset password</strong>.</p>
    <p>Complete any profile fields still marked &quot;Not set&quot;. After values are saved, only clinic staff can change them.</p>
    <p>— San Agustin Clinic</p>
  `;

  if (!key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[welcome-email] RESEND_API_KEY not set — temporary password for",
        params.to,
        ":",
        params.tempPassword
      );
    }
    return;
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
