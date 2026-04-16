#ifndef CLINIC_SERVICE_REQUEST_H
#define CLINIC_SERVICE_REQUEST_H

#include <string>

/**
 * Abstract clinic booking payload (Module 8 — polymorphic base).
 * Concrete types (standard vs urgent) share validation rules but may serialize differently.
 */
class ClinicServiceRequest {
public:
  virtual ~ClinicServiceRequest() = default;
  virtual bool isValid() const = 0;
  virtual std::string serialize() const = 0;
};

#endif // CLINIC_SERVICE_REQUEST_H
