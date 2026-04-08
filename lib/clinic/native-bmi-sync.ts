import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

import { prisma } from "@/lib/prisma";

import { BMI_DB_PATH } from "@/lib/clinic/clinic-paths";

/** Writes all BMI rows to the tab-separated file consumed by native/bmi/bmi_tool.cpp */
export async function syncBmiNativeFileFromDb(): Promise<void> {
  if (process.env.VERCEL) return;
  const users = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      bmiRecords: { orderBy: { createdAt: "asc" } },
    },
  });
  mkdirSync(dirname(BMI_DB_PATH), { recursive: true });
  const lines: string[] = [];
  for (const u of users) {
    const sid = (u.studentId ?? u.email).trim();
    if (!sid) continue;
    for (const r of u.bmiRecords) {
      const ts = Math.floor(r.createdAt.getTime() / 1000);
      lines.push(
        [
          sid,
          String(ts),
          r.weightKg.toFixed(4),
          r.heightM.toFixed(4),
          r.bmi.toFixed(2),
          r.category,
        ].join("\t")
      );
    }
  }
  writeFileSync(BMI_DB_PATH, lines.length ? lines.join("\n") + "\n" : "", "utf8");
}
