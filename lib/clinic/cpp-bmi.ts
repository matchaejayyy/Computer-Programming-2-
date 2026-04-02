import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { spawn } from "child_process";
import { join } from "path";

export type BmiPayload = {
  studentId: string;
  weightKg: number;
  height: number;
};

export type BmiResult = {
  bmi?: number;
  category?: "Underweight" | "Normal" | "Overweight";
  weightKg?: number;
  heightM?: number;
  updatedAt?: number;
  remainingAttempts: number;
  resetAt?: number;
  message?: string;
};

type BmiEntry = {
  studentId: string;
  timestamp: number;
  weightKg: number;
  heightM: number;
  bmi: number;
  category: "Underweight" | "Normal" | "Overweight";
};

const binaryName = process.platform === "win32" ? "bmi_tool.exe" : "bmi_tool";

function binaryPath(): string {
  return join(process.cwd(), "native", "bmi", binaryName);
}

function dbPath(): string {
  return join(process.cwd(), "native", "bmi", "bmi.db");
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
        reject(new Error(stderr.trim() || stdout.trim() || `C++ process exited with ${code}`));
      }
    });

    child.stdin.write(stdin, "utf8");
    child.stdin.end();
  });
}

function parseOutput(output: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const line of output.split("\n")) {
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    parsed[key] = value;
  }
  return parsed;
}

function toCategory(value: string | undefined): BmiResult["category"] {
  if (value === "Underweight" || value === "Normal" || value === "Overweight") {
    return value;
  }
  return undefined;
}

function normalizeHeightToMeters(height: number): number {
  return height > 3 ? height / 100 : height;
}

function currentTimestampSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function readEntriesFromFile(): BmiEntry[] {
  const databasePath = dbPath();
  if (!existsSync(databasePath)) return [];

  const lines = readFileSync(databasePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const entries: BmiEntry[] = [];
  for (const line of lines) {
    const [studentId, timestamp, weightKg, heightM, bmi, category] = line.split("\t");
    const parsedCategory = toCategory(category);
    if (!parsedCategory) continue;

    const record = {
      studentId,
      timestamp: Number(timestamp),
      weightKg: Number(weightKg),
      heightM: Number(heightM),
      bmi: Number(bmi),
      category: parsedCategory,
    };

    if (
      !record.studentId ||
      Number.isNaN(record.timestamp) ||
      Number.isNaN(record.weightKg) ||
      Number.isNaN(record.heightM) ||
      Number.isNaN(record.bmi)
    ) {
      continue;
    }
    entries.push(record);
  }
  return entries;
}

function latestEntry(entries: BmiEntry[], studentId: string): BmiEntry | undefined {
  return entries
    .filter((entry) => entry.studentId === studentId)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
}

export async function getBmi(studentId: string): Promise<BmiResult> {
  const executable = binaryPath();
  if (existsSync(executable)) {
    try {
      const output = await runCppTool(executable, `action=read\nstudentId=${studentId}\n`);
      const parsed = parseOutput(output);
      return {
        bmi: parsed.bmi ? Number(parsed.bmi) : undefined,
        category: toCategory(parsed.category),
        weightKg: parsed.weightKg ? Number(parsed.weightKg) : undefined,
        heightM: parsed.heightM ? Number(parsed.heightM) : undefined,
        updatedAt: parsed.updatedAt ? Number(parsed.updatedAt) : undefined,
        remainingAttempts: 999,
        resetAt: undefined,
      };
    } catch {
      // Fall through to TypeScript fallback.
    }
  }

  return getBmiTypeScript(studentId);
}

export async function updateBmi(payload: BmiPayload): Promise<BmiResult> {
  const executable = binaryPath();
  if (existsSync(executable)) {
    try {
      const output = await runCppTool(
        executable,
        `action=update\nstudentId=${payload.studentId}\nweightKg=${payload.weightKg}\nheight=${payload.height}\n`
      );
      const parsed = parseOutput(output);
      return {
        bmi: parsed.bmi ? Number(parsed.bmi) : undefined,
        category: toCategory(parsed.category),
        weightKg: parsed.weightKg ? Number(parsed.weightKg) : undefined,
        heightM: parsed.heightM ? Number(parsed.heightM) : undefined,
        updatedAt: parsed.updatedAt ? Number(parsed.updatedAt) : undefined,
        remainingAttempts: 999,
        resetAt: undefined,
        message: parsed.message || "BMI updated.",
      };
    } catch {
      // Fall through to TypeScript fallback.
    }
  }

  return updateBmiTypeScript(payload);
}

function getBmiTypeScript(studentId: string): BmiResult {
  const entries = readEntriesFromFile();
  const latest = latestEntry(entries, studentId);
  return {
    bmi: latest?.bmi,
    category: latest?.category,
    weightKg: latest?.weightKg,
    heightM: latest?.heightM,
    updatedAt: latest?.timestamp,
    remainingAttempts: 999,
    resetAt: undefined,
  };
}

function updateBmiTypeScript(payload: BmiPayload): BmiResult {
  const now = currentTimestampSeconds();

  const normalizedHeight = normalizeHeightToMeters(payload.height);
  const bmi = payload.weightKg / (normalizedHeight * normalizedHeight);
  const category: BmiEntry["category"] =
    bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : "Overweight";

  mkdirSync(join(process.cwd(), "native", "bmi"), { recursive: true });
  appendFileSync(
    dbPath(),
    [
      payload.studentId,
      String(now),
      payload.weightKg.toFixed(4),
      normalizedHeight.toFixed(4),
      bmi.toFixed(2),
      category,
    ].join("\t") + "\n",
    "utf8"
  );

  return {
    bmi: Number(bmi.toFixed(2)),
    category,
    weightKg: payload.weightKg,
    heightM: Number(normalizedHeight.toFixed(2)),
    updatedAt: now,
    remainingAttempts: 999,
    resetAt: undefined,
    message: "BMI updated.",
  };
}
