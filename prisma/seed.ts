import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STUDENT_PASSWORD = "StudentDemo123!";
const ADMIN_PASSWORD = "AdminClinic123!";

const firstNames = [
  "Maria",
  "Juan",
  "Ana",
  "Jose",
  "Carmen",
  "Luis",
  "Rosa",
  "Pedro",
  "Elena",
  "Miguel",
  "Isabel",
  "Carlos",
  "Lucia",
  "Antonio",
  "Patricia",
  "Francisco",
  "Dolores",
  "Manuel",
  "Teresa",
  "Rafael",
];

const lastNames = [
  "Santos",
  "Reyes",
  "Cruz",
  "Garcia",
  "Torres",
  "Flores",
  "Rivera",
  "Diaz",
  "Morales",
  "Ortiz",
  "Castro",
  "Ramos",
  "Mendoza",
  "Vargas",
  "Salazar",
  "Herrera",
  "Jimenez",
  "Ruiz",
  "Alvarez",
  "Navarro",
];

function padId(n: number) {
  return String(n).padStart(4, "0");
}

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.bmiRecord.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinicWeeklyHours.deleteMany();

  const studentHash = await bcrypt.hash(STUDENT_PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const students: { id: string; studentId: string; email: string; name: string }[] = [];

  for (let i = 0; i < 20; i++) {
    const n = i + 1;
    const studentId = `USA-2024-${padId(n)}`;
    const email = `student${padId(n)}@usa.edu.ph`;
    const name = `${firstNames[i]!} ${lastNames[i]!}`;
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: "STUDENT",
        studentId,
        passwordHash: studentHash,
        profile: {
          create: {
            birthday: `${2003 + (i % 5)}-${String((i % 12) + 1).padStart(2, "0")}-15`,
            gender: i % 2 === 0 ? "Female" : "Male",
            symptomsOrCondition:
              i % 4 === 0 ? "No current symptoms reported." : "Mild seasonal allergies.",
            contactNumber: `0917${padId(n)}${padId(n)}`,
            schoolIdNumber: `2024-${padId(n)}`,
            address: `${100 + i} General Luna St., Iloilo City`,
            birthdayEdited: false,
            genderEdited: false,
          },
        },
      },
    });
    students.push({ id: user.id, studentId, email, name });

    const weightKg = 48 + i * 1.2;
    const heightM = 1.55 + (i % 5) * 0.03;
    const bmi = weightKg / (heightM * heightM);
    const category =
      bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : "Overweight";
    await prisma.bmiRecord.create({
      data: {
        userId: user.id,
        weightKg,
        heightM,
        bmi: Number(bmi.toFixed(2)),
        category,
      },
    });
  }

  await prisma.user.create({
    data: {
      email: "admin@sanaugustin.clinic",
      name: "Clinic Administrator",
      role: "ADMIN",
      studentId: null,
      passwordHash: adminHash,
    },
  });

  const reasons = [
    "consultation",
    "medical",
    "follow-up",
    "consultation",
    "others",
    "medical",
    "consultation",
    "follow-up",
    "consultation",
    "medical",
    "consultation",
    "others",
  ] as const;

  const statuses: Array<"pending" | "approved" | "rejected"> = [
    "pending",
    "approved",
    "rejected",
    "pending",
    "approved",
    "pending",
    "approved",
    "rejected",
    "pending",
    "approved",
    "pending",
    "approved",
  ];

  for (let i = 0; i < 12; i++) {
    const st = students[i % students.length]!;
    const status = statuses[i] ?? "pending";
    const submittedAt = new Date(Date.UTC(2026, 2, 1 + i, 10 + i, 0, 0));
    const reviewedAt =
      status === "pending" ? null : new Date(submittedAt.getTime() + 86400000);
    await prisma.appointment.create({
      data: {
        studentName: st.name,
        email: st.email,
        address: "Iloilo City, Philippines",
        reason: reasons[i] ?? "consultation",
        otherReasonDetail: reasons[i] === "others" ? "Dental referral paperwork" : "",
        preferredDate: `Wednesday, April ${2 + (i % 7)}, 2026`,
        preferredTime: `${9 + (i % 6)}:00 AM`,
        schoolIdNumber: `2024-${padId((i % 20) + 1)}`,
        status,
        adminNote:
          status === "approved"
            ? "Approved. Bring school ID; arrive 10 minutes early."
            : status === "rejected"
              ? "Slot unavailable; please choose another week."
              : "",
        submittedAt,
        reviewedAt,
      },
    });
  }

  const defaultHours = [
    { label: "Monday", hours: "8:00 AM – 4:00 PM" },
    { label: "Tuesday", hours: "8:00 AM – 4:00 PM" },
    { label: "Wednesday", hours: "8:00 AM – 4:00 PM" },
    { label: "Thursday", hours: "8:00 AM – 4:00 PM" },
    { label: "Friday", hours: "8:00 AM – 3:00 PM" },
    { label: "Saturday", hours: "Closed" },
    { label: "Sunday", hours: "Closed" },
  ];

  const scheduleExtras = {
    rows: defaultHours,
    timeSlots: [
      "8:00 AM",
      "9:00 AM",
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "1:00 PM",
      "2:00 PM",
      "3:00 PM",
      "4:00 PM",
    ],
    blockedDates: ["2026-04-18", "2026-04-19", "2026-04-25", "2026-05-01"],
  };

  await prisma.clinicWeeklyHours.create({
    data: {
      id: 1,
      rowsJson: JSON.stringify(scheduleExtras),
    },
  });

  console.log("Seed complete: 20 students, 1 admin, 12 appointments, BMI + clinic hours.");
  console.log("Student login: student0001@usa.edu.ph … student0020@usa.edu.ph /", STUDENT_PASSWORD);
  console.log("Admin login: admin@sanaugustin.clinic /", ADMIN_PASSWORD);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
