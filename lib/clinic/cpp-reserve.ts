import { appendFileSync, existsSync } from "fs";
import { spawn } from "child_process";
import { join } from "path";

export type ReserveAppointmentPayload = {
  studentName: string;
  email: string;
  address: string;
  reason: string;
  otherReasonDetail?: string;
  preferredDate: string;
  preferredTime: string;
};

const binaryName =
  process.platform === "win32" ? "save_request.exe" : "save_request";

function binaryPath(): string {
  return join(process.cwd(), "native", "appointments", binaryName);
}

function runCppTool(executable: string, stdin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.trim() || `C++ process exited with ${code}`));
      }
    });

    child.stdin.write(stdin, "utf8");
    child.stdin.end();
  });
}

export async function reserveAppointmentCpp(
  payload: ReserveAppointmentPayload
): Promise<string> {
  const executable = binaryPath();
  const input = [
    `studentName=${payload.studentName}`,
    `email=${payload.email}`,
    `address=${payload.address}`,
    `reason=${payload.reason}`,
    `otherReasonDetail=${payload.otherReasonDetail ?? ""}`,
    `preferredDate=${payload.preferredDate}`,
    `preferredTime=${payload.preferredTime}`,
  ].join("\n") + "\n";

  if (!existsSync(executable)) {
    return reserveAppointmentTypeScript(payload);
  }

  try {
    return await runCppTool(executable, input);
  } catch (error) {
    return reserveAppointmentTypeScript(payload);
  }
}

export function reserveAppointmentTypeScript(
  payload: ReserveAppointmentPayload
): string {
  const dbPath = join(process.cwd(), "native", "appointments", "appointments.db");
  const record = {
    studentName: payload.studentName,
    email: payload.email,
    address: payload.address,
    reason: payload.reason,
    otherReasonDetail: payload.otherReasonDetail ?? "",
    preferredDate: payload.preferredDate,
    preferredTime: payload.preferredTime,
    submittedAt: new Date().toISOString(),
  };

  appendFileSync(dbPath, JSON.stringify(record) + "\n", "utf8");
  return "Appointment stored in fallback database.";
}
