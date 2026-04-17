#include "AppointmentManager.h"

#include <utility>
#include <sstream>

void AppointmentManager::addRequest(std::unique_ptr<ClinicServiceRequest> request) {
  requests_.push_back(std::move(request));
}

std::size_t AppointmentManager::totalRequests() const {
  return requests_.size();
}

std::string AppointmentManager::pendingSummary() const {
  std::ostringstream output;
  output << "Appointments stored: " << requests_.size();
  return output.str();
}

std::string AppointmentManager::serializeAll() const {
  std::ostringstream output;
  output << "[";
  for (std::size_t i = 0; i < requests_.size(); ++i) {
    output << requests_[i]->serialize();
    if (i + 1 < requests_.size()) {
      output << ", ";
    }
  }
  output << "]";
  return output.str();
}
