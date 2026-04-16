#ifndef APPOINTMENT_MANAGER_H
#define APPOINTMENT_MANAGER_H

#include <cstddef>
#include <string>
#include <vector>

#include "AppointmentRequest.h"

class AppointmentManager {
public:
  void addRequest(const AppointmentRequest& request);
  std::size_t totalRequests() const;
  std::string pendingSummary() const;
  std::string serializeAll() const;

private:
  std::vector<AppointmentRequest> requests_;
};

#endif // APPOINTMENT_MANAGER_H
