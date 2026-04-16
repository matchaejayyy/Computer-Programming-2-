#!/bin/bash
# Reorganize appointments folder by feature
# Run from: native/

cd appointments || exit 1

# Create directories (skip if already exist)
mkdir -p core operations broadcasts schedule visitor_logs

echo "✓ Directories created"

# Move core classes to core/
echo "Moving core classes..."
mv AppointmentDatabase.h core/ 2>/dev/null
mv AppointmentDatabase.cpp core/ 2>/dev/null
mv AppointmentManager.h core/ 2>/dev/null
mv AppointmentManager.cpp core/ 2>/dev/null
mv AppointmentRequest.h core/ 2>/dev/null
mv AppointmentRequest.cpp core/ 2>/dev/null
mv AppointmentLineFilter.h core/ 2>/dev/null
mv AppointmentLineFilter.cpp core/ 2>/dev/null
mv ClinicServiceRequest.h core/ 2>/dev/null
mv UrgentAppointmentRequest.h core/ 2>/dev/null
mv UrgentAppointmentRequest.cpp core/ 2>/dev/null
echo "✓ Core classes moved"

# Move appointment operations to operations/
echo "Moving appointment operations..."
mv save_request.cpp operations/ 2>/dev/null
mv save_request operations/ 2>/dev/null
mv list_appointments.cpp operations/ 2>/dev/null
mv list_appointments operations/ 2>/dev/null
mv search_appointments.cpp operations/ 2>/dev/null
mv search_appointments operations/ 2>/dev/null
mv update_appointment.cpp operations/ 2>/dev/null
mv update_appointment operations/ 2>/dev/null
mv count_by_date_time.cpp operations/ 2>/dev/null
mv count_by_date_time operations/ 2>/dev/null
mv count_by_status.cpp operations/ 2>/dev/null
mv count_by_status operations/ 2>/dev/null
echo "✓ Appointment operations moved"

# Move broadcasts to broadcasts/
echo "Moving broadcast notifications..."
mv save_broadcast_notification.cpp broadcasts/ 2>/dev/null
mv save_broadcast_notification broadcasts/ 2>/dev/null
mv list_broadcast_notifications.cpp broadcasts/ 2>/dev/null
mv list_broadcast_notifications broadcasts/ 2>/dev/null
mv update_broadcast_notification.cpp broadcasts/ 2>/dev/null
mv update_broadcast_notification broadcasts/ 2>/dev/null
mv delete_broadcast_notification.cpp broadcasts/ 2>/dev/null
mv delete_broadcast_notification broadcasts/ 2>/dev/null
echo "✓ Broadcast notifications moved"

# Move schedule to schedule/
echo "Moving schedule management..."
mv clinic_schedule_tool.cpp schedule/ 2>/dev/null
mv clinic_schedule_tool schedule/ 2>/dev/null
mv clinic_weekly_hours.json schedule/ 2>/dev/null
mv manage_appointments schedule/ 2>/dev/null
echo "✓ Schedule management moved"

# Move visitor logs to visitor_logs/
echo "Moving visitor logs..."
mv save_visitor_log.cpp visitor_logs/ 2>/dev/null
mv save_visitor_log visitor_logs/ 2>/dev/null
mv list_visitor_logs.cpp visitor_logs/ 2>/dev/null
mv list_visitor_logs visitor_logs/ 2>/dev/null
echo "✓ Visitor logs moved"

echo ""
echo "========================================="
echo "✓ Reorganization Complete!"
echo "========================================="
echo ""
echo "New structure:"
echo "  appointments/"
echo "  ├── core/              (11 files - core classes)"
echo "  ├── operations/        (6 files - appointment CRUD)"
echo "  ├── broadcasts/        (4 files - notifications)"
echo "  ├── schedule/          (3 files - clinic schedule)"
echo "  ├── visitor_logs/      (2 files - visitor tracking)"
echo "  └── main.cpp           (entry point)"
echo ""
echo "Next steps:"
echo "  1. Update include paths in all files to reflect new locations"
echo "  2. Update build scripts with new paths"
echo "  3. Test all compiled binaries"
echo ""
