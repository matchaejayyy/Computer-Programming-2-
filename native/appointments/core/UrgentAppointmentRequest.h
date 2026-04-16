#ifndef URGENT_APPOINTMENT_REQUEST_H
#define URGENT_APPOINTMENT_REQUEST_H

#include "AppointmentRequest.h"

/**
 * Urgent walk-in style appointment (Module 8 — public inheritance + override).
 * Extends JSON with an explicit urgent flag for clinic triage / reporting demos.
 */
class UrgentAppointmentRequest : public AppointmentRequest {
public:
  using AppointmentRequest::AppointmentRequest;
  virtual std::string serialize() const override;
};

#endif // URGENT_APPOINTMENT_REQUEST_H
