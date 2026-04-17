#ifndef APPOINTMENT_MANAGER_H
#define APPOINTMENT_MANAGER_H

#include <cstddef>
#include <memory>
#include <string>
#include <vector>

#include "ClinicServiceRequest.h"

class AppointmentManager {
public:
  void addRequest(std::unique_ptr<ClinicServiceRequest> request);
  std::size_t totalRequests() const;
  std::string pendingSummary() const;
  std::string serializeAll() const;

private:
  std::vector<std::unique_ptr<ClinicServiceRequest>> requests_;
};

#endif // APPOINTMENT_MANAGER_H
