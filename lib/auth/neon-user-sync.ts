function getAppBaseUrl() {
  const raw =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

function randomSyncPassword() {
  return `Nsync#${crypto.randomUUID()}!Aa1`;
}

type NeonSignUpResponse = {
  error?: { message?: string } | string;
  message?: string;
};

export async function ensureNeonAuthUser(email: string, name: string) {
  const res = await fetch(`${getAppBaseUrl()}/api/neon-auth/sign-up/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: getAppBaseUrl(),
    },
    body: JSON.stringify({
      email,
      name,
      password: randomSyncPassword(),
    }),
    cache: "no-store",
  });

  if (res.ok) {
    return;
  }

  const body = (await res.json().catch(() => ({}))) as NeonSignUpResponse;
  const rawMessage =
    (typeof body?.error === "string" ? body.error : body?.error?.message) ||
    body?.message ||
    "";
  const message = rawMessage.toLowerCase();

  // If already exists in Neon auth users, treat as success.
  if (message.includes("already") || message.includes("exists")) {
    return;
  }
  // Neon may return 422 for duplicate/invalid state; don't hard-fail Google sign-in.
  if (res.status === 422 || res.status === 409) {
    return;
  }

  throw new Error(rawMessage || `Neon auth sync failed (${res.status}).`);
}
