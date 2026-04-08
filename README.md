# San Agustin Clinic — Student Portal

A full-stack school clinic management system built for San Agustin, enabling students to book clinic appointments, track BMI, and request medicine — while giving clinic admins tools to manage appointments, schedules, visitor logs, broadcast notifications, and reports.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Lucide Icons](https://lucide.dev) |
| Language | TypeScript 5 (strict) |
| Database | PostgreSQL via [Prisma 6](https://www.prisma.io) |
| Auth | [NextAuth v5](https://authjs.dev) (Credentials + Google OAuth), [Neon Auth](https://neon.tech) |
| State | [Zustand](https://zustand.docs.pmnd.rs) |
| Native | C++17 binaries invoked from Node via `child_process` |

## Features

### Student Portal

- **Appointment Booking** — reserve clinic visits with preferred date/time and reason
- **Request Tracking** — view, cancel, and monitor appointment status (pending, approved, rejected, etc.)
- **BMI Tracker** — log weight and height, see BMI history and category
- **Medicine Requests** — request medication from the clinic
- **Profile Management** — complete onboarding profile, change password
- **Clinic Schedule** — view available hours and time slots
- **Broadcast Notifications** — receive clinic-wide announcements

### Admin Dashboard

- **Appointment Management** — review, approve, reject, and manage incoming requests
- **Patient Finder** — search and view student profiles
- **Visitor Logs** — record and browse clinic visitors
- **Medicine Requests** — fulfill requests, browse medications, generate reports
- **Broadcast Notifications** — create, edit, and delete clinic announcements
- **Clinic Schedule Editor** — configure weekly hours, time slots, blocked dates, and capacity overrides
- **Reports** — generate clinic activity reports
- **Help Content** — manage customizable help/FAQ pages

### Native C++ Components

The project includes C++17 programs that handle filtering, searching, and data operations on synced file-based stores (derived from the Prisma/PostgreSQL database):

- **Filters** — filter appointments by status (pending, accepted, rejected, cancelled)
- **Appointments** — CRUD, search, count by status, schedule tools
- **Medicine** — save, list, update, delete, and count medicine requests
- **BMI** — BMI calculation tool
- **Auth** — password strength validator
- **Profile** — student registry tool

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (student)/          #   Student-facing pages
│   ├── admin/              #   Admin-facing pages
│   ├── api/                #   API routes (~39 endpoints)
│   ├── login/              #   Login page
│   └── forgot-password/    #   Password reset flow
├── components/             # React components
│   ├── admin/              #   Admin UI components
│   ├── clinic/             #   Clinic/student UI components
│   └── ui/                 #   Shared shadcn/ui primitives
├── lib/                    # Server/client helpers
│   ├── auth/               #   Neon auth integration
│   └── clinic/             #   Clinic domain logic & C++ bridges
├── native/                 # C++17 source code & binaries
│   ├── appointments/       #   Appointment tools
│   ├── auth/               #   Password validator
│   ├── bmi/                #   BMI calculator
│   ├── filters/            #   Status filters
│   ├── medicine/           #   Medicine request tools
│   └── profile/            #   Student registry
├── prisma/                 # Database schema & seed
├── types/                  # TypeScript type augmentations
├── auth.ts                 # NextAuth configuration
└── proxy.ts                # Route/API protection middleware
```

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** database (or a [Neon](https://neon.tech) hosted instance)
- **C++ compiler** with C++17 support (e.g. `g++` or `clang++`)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Computer-Programming-2-.git
cd Computer-Programming-2-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root with the following:

```env
DATABASE_URL="postgresql://..."

AUTH_SECRET="your-auth-secret"

# Optional — Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Optional — Neon Auth
NEON_AUTH_BASE_URL="..."
NEON_AUTH_COOKIE_SECRET="..."
```

### 4. Set up the database

```bash
npm run db:push     # Push the Prisma schema to your database
npm run db:seed     # Seed with demo data (optional)
```

### 5. Build native C++ binaries

```bash
npm run build:native-filter
npm run build:native-appointments
npm run build:native-medicine
npm run build:native-auth
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Generate Prisma client and build for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:seed` | Seed the database with demo data |
| `npm run build:native-filter` | Compile appointment status filter binaries |
| `npm run build:native-appointments` | Compile appointment management binaries |
| `npm run build:native-medicine` | Compile medicine request binaries |
| `npm run build:native-auth` | Compile password strength validator |

## Database Models

The PostgreSQL database (managed by Prisma) includes:

- **User** — students and admins with role-based access
- **StudentProfile** — extended student information
- **BmiRecord** — BMI tracking history
- **Appointment** — clinic appointment requests with status workflow
- **ClinicAppointmentSchedule** — configurable schedule with time slots, blocked dates, overrides, and capacity
- **VisitorLog** — clinic visitor records
- **MedicineRequest** — student medication requests
- **PasswordResetOtp** — OTP-based password reset tokens
- **ClinicWeeklyHours** — displayed weekly clinic hours

## Authentication

- **Credentials** — email/password login with bcrypt hashing
- **Google OAuth** — optional sign-in restricted to `@usa.edu.ph` student emails
- **Role-based routing** — students and admins are directed to separate dashboards; API routes enforce role permissions
- **Password reset** — OTP-based flow via email
