import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

import { STUDENT_PROFILES_JSON_PATH } from "@/lib/clinic/clinic-paths";
import { listStoredStudentProfiles } from "@/lib/clinic/profile-store";

export async function syncStudentProfilesJsonFromDb(): Promise<void> {
  // Use canonical profile list so missing profiles are auto-created and
  // users without explicit studentId still appear via email-based login id.
  const arr = await listStoredStudentProfiles();
  mkdirSync(dirname(STUDENT_PROFILES_JSON_PATH), { recursive: true });
  writeFileSync(STUDENT_PROFILES_JSON_PATH, JSON.stringify(arr, null, 2), "utf8");
}
