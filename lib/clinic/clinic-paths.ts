import { join } from "path";

export const APPOINTMENTS_DB_PATH = join(
  process.cwd(),
  "native",
  "appointments",
  "appointments.db"
);

export const VISITOR_LOGS_DB_PATH = join(
  process.cwd(),
  "native",
  "appointments",
  "visitor_logs.db"
);

export const BROADCAST_NOTIFICATIONS_DB_PATH = join(
  process.cwd(),
  "native",
  "appointments",
  "broadcast_notifications.db"
);

export const STUDENT_PROFILES_JSON_PATH = join(
  process.cwd(),
  "native",
  "profile",
  "student-profiles.json"
);

export const BMI_DB_PATH = join(process.cwd(), "native", "bmi", "bmi.db");

export const CLINIC_WEEKLY_HOURS_PATH = join(
  process.cwd(),
  "native",
  "appointments",
  "clinic_weekly_hours.json"
);

export const HELP_CONTENT_PATH = join(
  process.cwd(),
  "native",
  "appointments",
  "help_content.json"
);

export const MEDICINE_REQUESTS_DB_PATH = join(
  process.cwd(),
  "native",
  "medicine",
  "medicine_requests.db"
);
