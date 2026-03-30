import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

import type { RequestStatus } from "@/lib/clinic/mock-requests";

const binaryName =
  process.platform === "win32" ? "filter_pending.exe" : "filter_pending";

function binaryPath(): string {
  return join(process.cwd(), "native", binaryName);
}

/** Same logic as native/filter_pending.cpp (used if the binary is missing). */
export function filterPendingIndicesTypeScript(statuses: RequestStatus[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < statuses.length; i++) {
    if (statuses[i] === "pending") {
      out.push(i);
    }
  }
  return out;
}

function runCppFilter(executable: string, stdin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [], {
      stdio: ["pipe", "pipe", "pipe"],
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
        resolve(stdout);
      } else {
        reject(new Error(stderr || `exit ${code}`));
      }
    });
    child.stdin.write(stdin, "utf8");
    child.stdin.end();
  });
}

/**
 * Runs the C++ filter (stdin: one status per line) and returns pending indices.
 * Falls back to TypeScript if native/filter_pending is not built.
 */
export async function filterPendingIndicesCpp(
  statuses: RequestStatus[]
): Promise<number[]> {
  const path = binaryPath();
  if (!existsSync(path)) {
    return filterPendingIndicesTypeScript(statuses);
  }

  const input = statuses.join("\n") + "\n";
  try {
    const stdout = await runCppFilter(path, input);
    const trimmed = stdout.trim();
    if (!trimmed) {
      return [];
    }
    return trimmed.split(/\s+/).map((s) => Number.parseInt(s, 10));
  } catch {
    return filterPendingIndicesTypeScript(statuses);
  }
}
