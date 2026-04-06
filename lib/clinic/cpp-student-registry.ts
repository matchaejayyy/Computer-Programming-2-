import { existsSync } from "fs";
import { spawnSync } from "child_process";
import { join } from "path";

import type { StudentProfile } from "@/lib/clinic/profile-store";
import { listStoredStudentProfiles } from "@/lib/clinic/profile-store";

export const STUDENT_PROFILES_JSON_PATH = join(
  process.cwd(),
  "native",
  "profile",
  "student-profiles.json"
);

const binaryName =
  process.platform === "win32" ? "student_registry_tool.exe" : "student_registry_tool";

function executablePath(): string {
  return join(process.cwd(), "native", "profile", binaryName);
}

export type RegistryListPatient = {
  studentId: string;
  name: string;
  email: string;
  schoolIdNumber: string;
};

function runTool(args: string[]): { ok: boolean; stdout: string } {
  const exe = executablePath();
  if (!existsSync(exe)) {
    return { ok: false, stdout: "" };
  }
  const result = spawnSync(exe, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || result.stdout == null) {
    return { ok: false, stdout: "" };
  }
  return { ok: true, stdout: result.stdout.trim() };
}

/**
 * Lists / searches students in student-profiles.json via C++ tool.
 * Returns null if the binary is missing or output is invalid (caller uses TS fallback).
 */
export function listStudentsViaCpp(query: string): RegistryListPatient[] | null {
  const q = query.trim();
  const { ok, stdout } = runTool([
    STUDENT_PROFILES_JSON_PATH,
    "list",
    ...(q.length > 0 ? [q] : []),
  ]);
  if (!ok) {
    return null;
  }
  try {
    const data = JSON.parse(stdout) as {
      success?: boolean;
      patients?: unknown;
    };
    if (!data.success || !Array.isArray(data.patients)) {
      return null;
    }
    const out: RegistryListPatient[] = [];
    for (const row of data.patients) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      out.push({
        studentId: String(r.studentId ?? ""),
        name: String(r.name ?? ""),
        email: String(r.email ?? ""),
        schoolIdNumber: String(r.schoolIdNumber ?? ""),
      });
    }
    return out;
  } catch {
    return null;
  }
}

export function listStudentsTypeScriptFallback(query: string): RegistryListPatient[] {
  const q = query.trim().toLowerCase();
  const profiles = listStoredStudentProfiles();
  const rows: RegistryListPatient[] = profiles.map((p) => ({
    studentId: p.studentId,
    name: p.name,
    email: p.email,
    schoolIdNumber: p.schoolIdNumber,
  }));
  if (!q) {
    rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return rows;
  }
  return rows
    .filter((row) => {
      const blob = [row.studentId, row.name, row.email, row.schoolIdNumber]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export type RegistryProfilePayload = Pick<
  StudentProfile,
  | "studentId"
  | "name"
  | "birthday"
  | "gender"
  | "symptomsOrCondition"
  | "contactNumber"
  | "email"
  | "schoolIdNumber"
  | "birthdayEdited"
  | "genderEdited"
>;

export function getStudentFromRegistryViaCpp(studentId: string): RegistryProfilePayload | null {
  const { ok, stdout } = runTool([STUDENT_PROFILES_JSON_PATH, "get", studentId]);
  if (!ok) {
    return null;
  }
  try {
    const data = JSON.parse(stdout) as {
      success?: boolean;
      found?: boolean;
      profile?: unknown;
    };
    if (!data.success || !data.found || !data.profile || typeof data.profile !== "object") {
      return null;
    }
    const p = data.profile as Record<string, unknown>;
    return {
      studentId: String(p.studentId ?? ""),
      name: String(p.name ?? ""),
      birthday: String(p.birthday ?? ""),
      gender: String(p.gender ?? ""),
      symptomsOrCondition: String(p.symptomsOrCondition ?? ""),
      contactNumber: String(p.contactNumber ?? ""),
      email: String(p.email ?? ""),
      schoolIdNumber: String(p.schoolIdNumber ?? ""),
      birthdayEdited: Boolean(p.birthdayEdited),
      genderEdited: Boolean(p.genderEdited),
    };
  } catch {
    return null;
  }
}

export function getStudentFromRegistryFallback(studentId: string): RegistryProfilePayload | null {
  const profiles = listStoredStudentProfiles();
  const hit = profiles.find((p) => p.studentId === studentId);
  return hit ?? null;
}
