#include "UrgentAppointmentRequest.h"

std::string UrgentAppointmentRequest::serialize() const {
  const std::string base = AppointmentRequest::serialize();
  if (base.size() >= 2 && base.back() == '}') {
    return base.substr(0, base.size() - 1) + ",\"urgent\":true}";
  }
  return base;
}
