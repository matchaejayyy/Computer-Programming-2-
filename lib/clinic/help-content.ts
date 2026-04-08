import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";

import { HELP_CONTENT_PATH } from "@/lib/clinic/clinic-paths";

export type HelpContent = {
  intro: string;
  contactTitle: string;
  phone: string;
  email: string;
};

const DEFAULT_HELP_CONTENT: HelpContent = {
  intro:
    "Find answers about appointments, medical certification, and campus clinic services. Contact the clinic office for questions not listed here.",
  contactTitle: "USA Clinic Contact",
  phone: "+63 917 123 4567",
  email: "clinic@usa.edu.ph",
};

function sanitizeHelpContent(raw: unknown): HelpContent {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_HELP_CONTENT;
  }

  const source = raw as Record<string, unknown>;
  const intro =
    typeof source.intro === "string" && source.intro.trim().length > 0
      ? source.intro.trim()
      : DEFAULT_HELP_CONTENT.intro;
  const contactTitle =
    typeof source.contactTitle === "string" && source.contactTitle.trim().length > 0
      ? source.contactTitle.trim()
      : DEFAULT_HELP_CONTENT.contactTitle;
  const phone =
    typeof source.phone === "string" && source.phone.trim().length > 0
      ? source.phone.trim()
      : DEFAULT_HELP_CONTENT.phone;
  const email =
    typeof source.email === "string" && source.email.trim().length > 0
      ? source.email.trim()
      : DEFAULT_HELP_CONTENT.email;

  return { intro, contactTitle, phone, email };
}

export function getHelpContent(): HelpContent {
  if (!existsSync(HELP_CONTENT_PATH)) {
    return DEFAULT_HELP_CONTENT;
  }

  try {
    const raw = readFileSync(HELP_CONTENT_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeHelpContent(parsed);
  } catch {
    return DEFAULT_HELP_CONTENT;
  }
}

export function updateHelpContent(input: Partial<HelpContent>): HelpContent {
  const current = getHelpContent();
  const next = sanitizeHelpContent({ ...current, ...input });
  try {
    mkdirSync(dirname(HELP_CONTENT_PATH), { recursive: true });
    writeFileSync(HELP_CONTENT_PATH, JSON.stringify(next, null, 2), "utf8");
  } catch {
    // Read-only filesystem (e.g. Vercel) — skip disk write.
  }
  return next;
}
