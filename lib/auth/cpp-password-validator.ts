import { existsSync } from "fs";
import { spawnSync } from "child_process";
import { join } from "path";

const binaryName =
  process.platform === "win32"
    ? "password_strength_validator.exe"
    : "password_strength_validator";

function executablePath() {
  return join(process.cwd(), "native", "auth", binaryName);
}

export function validatePasswordStrengthViaCpp(password: string): {
  ok: boolean;
  message?: string;
} {
  const exe = executablePath();
  if (!existsSync(exe)) {
    return { ok: false, message: "Password validator binary not found. Build native auth tools." };
  }

  const result = spawnSync(exe, [password], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  const output = (result.stdout || "").trim();
  if (result.status === 0 && output === "OK") {
    return { ok: true };
  }

  if (output.startsWith("INVALID:")) {
    return { ok: false, message: output.slice("INVALID:".length).trim() };
  }

  return { ok: false, message: "Password does not meet strength requirements." };
}
