# CSIT 121A — Technical Requirements vs This Project (C++ Mapping)

**System:** San Agustin Clinic — Student Portal (full-stack app with integrated `native/` C++ tools)  
**Scope:** Code and course-module alignment (PDF Section 8.A and Module 1–8 table). Paths are relative to the repository root.

---

## PDF code requirements (Section 8.A)

| Requirement | How this project satisfies it | Primary C++ locations |
|-------------|------------------------------|------------------------|
| Compiles and runs (C++17) | Tools built with `c++ -std=c++17` via `npm run build:native-*` in `package.json`. | All `native/**/*.cpp` → compiled binaries under `native/appointments/`, `native/filters/`, `native/medicine/`, `native/bmi/`, `native/auth/`, `native/profile/`. |
| Classes and objects (OOP) | Domain data and services modeled as classes. | `native/appointments/AppointmentRequest.{h,cpp}`, `AppointmentManager.{h,cpp}`, `AppointmentDatabase.{h,cpp}`; `native/bmi/bmi_tool.cpp` (`BmiEntry` + operations). |
| Functions and modular design | One tool per `main()`, helpers in anonymous namespaces, separated parsing/serialization. | e.g. `save_request.cpp`, `search_appointments.cpp`, `clinic_schedule_tool.cpp`, each `medicine/*.cpp`, each `filters/*.cpp`. |
| Arrays / vectors and strings | `std::string` throughout; `std::vector` for collections and buffers. | `AppointmentManager.h`, `list_appointments.cpp`, `list_medicine_requests.cpp`, `bmi_tool.cpp`, etc. |
| Dynamic memory | Heap allocation with explicit `delete[]` and/or RAII (`std::unique_ptr`). | `list_appointments.cpp` (`new int[n]` / `delete[]`); `AppointmentLineFilter.{h,cpp}` (`new` derived filters, `std::unique_ptr` + virtual destructor). |
| Naming, structure, comments | Consistent identifiers; file headers document usage and build commands. | Top-of-file comments in `list_appointments.cpp`, `list_medicine_requests.cpp`, and similar. |

---

## Module 1 — Fundamentals (I/O)

| Functionality | C++ files |
|---------------|-----------|
| File and stream I/O; JSON or line-oriented output for integration with the app. | `save_request.cpp`, `list_appointments.cpp`, `list_visitor_logs.cpp`, `save_visitor_log.cpp`, `list_broadcast_notifications.cpp`, `save_broadcast_notification.cpp`, `update_broadcast_notification.cpp`, `delete_broadcast_notification.cpp`, `medicine/save_medicine_request.cpp`, `medicine/list_medicine_requests.cpp`, `medicine/update_medicine_request.cpp`, `medicine/delete_medicine_request.cpp`, `clinic_schedule_tool.cpp`, `bmi_tool.cpp`, `student_registry_tool.cpp`, `password_strength_validator.cpp` (argv); `filters/*.cpp` (stdin). |

---

## Module 2 — Data types

| Functionality | C++ files |
|---------------|-----------|
| `std::string`, `int`, `double`, `bool`, `std::size_t`, structured fields. | Present across all `native/**/*.cpp` (e.g. `AppointmentRequest.cpp`, `count_by_status.cpp`, `bmi_tool.cpp`). |

---

## Module 3 — Control structures

| Functionality | C++ files |
|---------------|-----------|
| Loops over lines/records; branches on status, filters, validation, BMI categories. | `list_appointments.cpp` (with `AppointmentLineFilter`), `search_appointments.cpp`, `count_by_status.cpp`, `count_by_date_time.cpp`, `update_appointment.cpp`, `filter_pending.cpp`, `filter_accepted.cpp`, `filter_rejected.cpp`, `filter_cancelled.cpp`, `bmi_tool.cpp`, `password_strength_validator.cpp`. |

---

## Module 4 — Functions

| Functionality | C++ files |
|---------------|-----------|
| Modular free/static helpers: trim, parsers, IDs, time/JSON helpers. | `save_request.cpp`, `AppointmentRequest.cpp` (`escapeJson`, `parseStandardTime`), `AppointmentLineFilter.cpp`, `search_appointments.cpp`, `student_registry_tool.cpp`, and others. |

---

## Module 5 — Arrays / vectors / strings

| Functionality | C++ files |
|---------------|-----------|
| In-memory sequences (`std::vector`), string processing. | `AppointmentManager.{h,cpp}`, `list_appointments.cpp`, `list_medicine_requests.cpp`, `bmi_tool.cpp`. |

---

## Module 6 — Memory management / dynamic allocation

| Functionality | C++ files |
|---------------|-----------|
| Explicit heap array for exported line indices; heap-allocated polymorphic filter objects with cleanup. | **`native/appointments/list_appointments.cpp`**, **`native/appointments/AppointmentLineFilter.{h,cpp}`**. |

---

## Module 7 — OOP (classes and objects)

| Functionality | C++ files |
|---------------|-----------|
| Encapsulated appointment model, manager, file-backed database helper. | **`native/appointments/AppointmentRequest.{h,cpp}`**, **`AppointmentManager.{h,cpp}`**, **`AppointmentDatabase.{h,cpp}`**; cohesive logic in `bmi_tool.cpp`, `native/medicine/*.cpp`. |

---

## Module 8 — Advanced OOP (inheritance / polymorphism)

| Functionality | C++ files |
|---------------|-----------|
| Abstract `ClinicServiceRequest`; concrete `AppointmentRequest`; `UrgentAppointmentRequest` overrides `serialize`; status filters inherit `AppointmentLineFilter`; demo uses `std::vector<std::unique_ptr<ClinicServiceRequest>>`. | **`ClinicServiceRequest.h`**, **`AppointmentRequest.h`**, **`UrgentAppointmentRequest.{h,cpp}`**, **`AppointmentLineFilter.{h,cpp}`**, **`main.cpp`** (binary: **`manage_appointments`**). |

---

## Clinic features implemented in C++ (by area)

| Area | Role | Files |
|------|------|--------|
| Appointments | Save, list (filtered), search, counts, update | `save_request.cpp`, `list_appointments.cpp`, `search_appointments.cpp`, `count_by_status.cpp`, `count_by_date_time.cpp`, `update_appointment.cpp` |
| Filters | Status filtering on JSONL (stdin tools) | `filter_pending.cpp`, `filter_accepted.cpp`, `filter_rejected.cpp`, `filter_cancelled.cpp` |
| Schedule | Weekly hours JSON | `clinic_schedule_tool.cpp` |
| Visitor logs | List / append | `list_visitor_logs.cpp`, `save_visitor_log.cpp` |
| Broadcasts | CRUD-style listing and writes | `list_broadcast_notifications.cpp`, `save_broadcast_notification.cpp`, `update_broadcast_notification.cpp`, `delete_broadcast_notification.cpp` |
| Medicine | Save, list, update, delete, count by medication | `save_medicine_request.cpp`, `list_medicine_requests.cpp`, `update_medicine_request.cpp`, `delete_medicine_request.cpp`, `count_by_medication.cpp` |
| BMI | History / category | `bmi_tool.cpp` |
| Auth | Password strength (argv) | `password_strength_validator.cpp` |
| Profile | Student registry JSONL | `student_registry_tool.cpp` |

**TypeScript integration:** server code under `lib/clinic/cpp-*.ts`, `lib/auth/cpp-password-validator.ts`, etc., invokes these binaries where configured.

---

*Generated for documentation and submission reference.*
