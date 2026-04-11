#include <iostream>
#include <memory>
#include <vector>

#include "AppointmentManager.h"
#include "AppointmentRequest.h"
#include "ClinicServiceRequest.h"
#include "UrgentAppointmentRequest.h"

int main() {
  auto standard = std::make_unique<AppointmentRequest>(
    "Jane Doe",
    "jane.doe@school.edu.ph",
    "123 Campus Avenue",
    "consultation",
    "",
    "2026-04-15",
    "9:00 AM"
  );

  // Polymorphic collection (Module 8): process different concrete request types uniformly.
  std::vector<std::unique_ptr<ClinicServiceRequest>> queue;
  queue.push_back(std::move(standard));
  queue.push_back(std::make_unique<UrgentAppointmentRequest>(
    "John Smith",
    "john.smith@school.edu.ph",
    "456 Health Hall",
    "injury",
    "",
    "2026-04-16",
    "10:30 AM"
  ));

  for (const auto& req : queue) {
    if (!req->isValid()) {
      std::cerr << "Appointment request is invalid." << std::endl;
      return 1;
    }
  }

  AppointmentManager manager;
  manager.addRequest(static_cast<const AppointmentRequest&>(*queue[0]));

  std::cout << "Polymorphic serialize() samples:" << std::endl;
  for (const auto& req : queue) {
    std::cout << req->serialize() << std::endl;
  }

  std::cout << "Manager summary: " << manager.pendingSummary() << std::endl;
  std::cout << manager.serializeAll() << std::endl;

  return 0;
}
