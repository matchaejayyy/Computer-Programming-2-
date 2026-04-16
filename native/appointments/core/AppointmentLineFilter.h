#ifndef APPOINTMENT_LINE_FILTER_H
#define APPOINTMENT_LINE_FILTER_H

#include <memory>
#include <string>

/**
 * Polymorphic strategy for JSONL appointment lines (Module 8 — virtual dispatch).
 * Each status filter is a separate derived type selected at runtime by name.
 */
class AppointmentLineFilter {
public:
  virtual ~AppointmentLineFilter() = default;
  virtual bool matches(const std::string& line) const = 0;
};

/** Returns nullptr if name is not recognized. Caller may wrap in std::unique_ptr. */
AppointmentLineFilter* createAppointmentLineFilterRaw(const std::string& name);

inline std::unique_ptr<AppointmentLineFilter> createAppointmentLineFilter(const std::string& name) {
  return std::unique_ptr<AppointmentLineFilter>(createAppointmentLineFilterRaw(name));
}

#endif // APPOINTMENT_LINE_FILTER_H
