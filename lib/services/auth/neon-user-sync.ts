import { neonAuth } from "@/lib/services/auth/neon-server";

function randomSyncPassword() {
  return `Nsync#${crypto.randomUUID()}!Aa1`;
}

/**
 * Creates a user in Neon Auth using the SDK directly.
 * Uses a random password for Google OAuth users who authenticate
 * through Google and don't need a Neon Auth password.
 * Silently succeeds if the user already exists in Neon Auth.
 */
export async function ensureNeonAuthUser(email: string, name: string) {
  const result = await neonAuth.signUp.email({
    email,
    name,
    password: randomSyncPassword(),
  });

  if (!result.error) {
    return;
  }

  const message = (result.error.message || "").toLowerCase();

  if (message.includes("already") || message.includes("exists")) {
    return;
  }

  throw new Error(result.error.message || "Neon auth sync failed.");
}
