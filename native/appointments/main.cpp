#include <iostream>

#include "AppointmentManager.h"
#include "AppointmentRequest.h"

int main() {
  AppointmentRequest request(
    "Jane Doe",
    "jane.doe@school.edu.ph",
    "123 Campus Avenue",
    "consultation",
    "",
    "2026-04-15",
    "9:00 AM"
  );

  if (!request.isValid()) {
    std::cerr << "Appointment request is invalid." << std::endl;
    return 1;
  }

  AppointmentManager manager;
  manager.addRequest(request);

  std::cout << "Request stored: " << manager.pendingSummary() << std::endl;
  std::cout << manager.serializeAll() << std::endl;

  return 0;
}
