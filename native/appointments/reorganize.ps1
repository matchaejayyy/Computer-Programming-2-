# PowerShell script to reorganize appointments folder by feature
# Run from: native/ directory
# Usage: powershell -ExecutionPolicy Bypass -File reorganize.ps1

param(
    [string]$BasePath = "."
)

$appointmentsPath = Join-Path $BasePath "appointments"

if (!(Test-Path $appointmentsPath)) {
    Write-Error "appointments folder not found at: $appointmentsPath"
    exit 1
}

Push-Location $appointmentsPath

Write-Host "Starting appointments folder reorganization..." -ForegroundColor Cyan

# Create directories
Write-Host "Creating subdirectories..." -ForegroundColor Yellow
$dirs = @("core", "operations", "broadcasts", "schedule", "visitor_logs")
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Name $dir -Force > $null
        Write-Host "  ✓ Created: $dir"
    } else {
        Write-Host "  → Already exists: $dir"
    }
}

# Move core classes
Write-Host "`nMoving core classes..." -ForegroundColor Yellow
$coreFiles = @(
    "AppointmentDatabase.h",
    "AppointmentDatabase.cpp",
    "AppointmentManager.h",
    "AppointmentManager.cpp",
    "AppointmentRequest.h",
    "AppointmentRequest.cpp",
    "AppointmentLineFilter.h",
    "AppointmentLineFilter.cpp",
    "ClinicServiceRequest.h",
    "UrgentAppointmentRequest.h",
    "UrgentAppointmentRequest.cpp"
)
foreach ($file in $coreFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "core/" -Force
        Write-Host "  ✓ Moved: $file"
    }
}

# Move appointment operations
Write-Host "`nMoving appointment operations..." -ForegroundColor Yellow
$operationFiles = @(
    "save_request.cpp",
    "save_request",
    "list_appointments.cpp",
    "list_appointments",
    "search_appointments.cpp",
    "search_appointments",
    "update_appointment.cpp",
    "update_appointment",
    "count_by_date_time.cpp",
    "count_by_date_time",
    "count_by_status.cpp",
    "count_by_status"
)
foreach ($file in $operationFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "operations/" -Force
        Write-Host "  ✓ Moved: $file"
    }
}

# Move broadcasts
Write-Host "`nMoving broadcast notifications..." -ForegroundColor Yellow
$broadcastFiles = @(
    "save_broadcast_notification.cpp",
    "save_broadcast_notification",
    "list_broadcast_notifications.cpp",
    "list_broadcast_notifications",
    "update_broadcast_notification.cpp",
    "update_broadcast_notification",
    "delete_broadcast_notification.cpp",
    "delete_broadcast_notification"
)
foreach ($file in $broadcastFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "broadcasts/" -Force
        Write-Host "  ✓ Moved: $file"
    }
}

# Move schedule files
Write-Host "`nMoving schedule management..." -ForegroundColor Yellow
$scheduleFiles = @(
    "clinic_schedule_tool.cpp",
    "clinic_schedule_tool",
    "clinic_weekly_hours.json",
    "manage_appointments"
)
foreach ($file in $scheduleFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "schedule/" -Force
        Write-Host "  ✓ Moved: $file"
    }
}

# Move visitor logs
Write-Host "`nMoving visitor logs..." -ForegroundColor Yellow
$visitorFiles = @(
    "save_visitor_log.cpp",
    "save_visitor_log",
    "list_visitor_logs.cpp",
    "list_visitor_logs"
)
foreach ($file in $visitorFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "visitor_logs/" -Force
        Write-Host "  ✓ Moved: $file"
    }
}

Pop-Location

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "✓ Reorganization Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "New structure:" -ForegroundColor Cyan
Write-Host "  appointments/"
Write-Host "  ├── core/              (11 files - core classes)"
Write-Host "  ├── operations/        (6 files - appointment CRUD)"
Write-Host "  ├── broadcasts/        (4 files - notifications)"
Write-Host "  ├── schedule/          (3 files - clinic schedule)"
Write-Host "  ├── visitor_logs/      (2 files - visitor tracking)"
Write-Host "  └── main.cpp           (entry point)"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Update include paths in all files to reflect new locations:"
Write-Host "     OLD: #include ""AppointmentDatabase.h"""
Write-Host "     NEW: #include ""../core/AppointmentDatabase.h"""
Write-Host ""
Write-Host "  2. Update relative FileHandler includes:"
Write-Host "     OLD: #include ""../file_handler/file_handler.h"""
Write-Host "     NEW: #include ""../../file_handler/file_handler.h"""
Write-Host ""
Write-Host "  3. Update build scripts with new paths"
Write-Host "  4. Test all compiled binaries"
Write-Host ""
