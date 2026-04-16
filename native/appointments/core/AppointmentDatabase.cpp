#include "AppointmentDatabase.h"

#include <fstream>
#include <string>

AppointmentDatabase::AppointmentDatabase(std::string path)
  : path_(std::move(path)), count_(0) {
  loadExistingCount();
}

void AppointmentDatabase::loadExistingCount() {
  std::ifstream file(path_);
  std::string line;
  while (std::getline(file, line)) {
    if (!line.empty()) {
      ++count_;
    }
  }
}

bool AppointmentDatabase::append(const AppointmentRequest& request) {
  std::ofstream file(path_, std::ios::app);
  if (!file) {
    return false;
  }

  file << request.serialize() << '\n';
  if (!file) {
    return false;
  }

  ++count_;
  return true;
}

std::size_t AppointmentDatabase::totalRequests() const {
  return count_;
}
