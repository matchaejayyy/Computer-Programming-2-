#include <iostream>
#include <string>
#include <unordered_map>

#include "AppointmentDatabase.h"
#include "AppointmentRequest.h"

static std::string trim(const std::string& value) {
  std::size_t start = 0;
  std::size_t end = value.size();

  while (start < end && (value[start] == ' ' || value[start] == '\t' || value[start] == '\r' || value[start] == '\n')) {
    ++start;
  }
  while (end > start && (value[end - 1] == ' ' || value[end - 1] == '\t' || value[end - 1] == '\r' || value[end - 1] == '\n')) {
    --end;
  }

  return value.substr(start, end - start);
}

static std::unordered_map<std::string, std::string> parseInput() {
  std::unordered_map<std::string, std::string> values;
  std::string line;
  while (std::getline(std::cin, line)) {
    const auto separator = line.find('=');
    if (separator == std::string::npos) {
      continue;
    }

    const std::string key = trim(line.substr(0, separator));
    const std::string value = trim(line.substr(separator + 1));
    if (!key.empty()) {
      values[key] = value;
    }
  }
  return values;
}

static std::string lookup(const std::unordered_map<std::string, std::string>& values, const std::string& key) {
  const auto it = values.find(key);
  if (it == values.end()) {
    return {};
  }
  return it->second;
}

int main() {
  const auto values = parseInput();

  AppointmentRequest request(
    lookup(values, "studentName"),
    lookup(values, "email"),
    lookup(values, "address"),
    lookup(values, "reason"),
    lookup(values, "otherReasonDetail"),
    lookup(values, "preferredDate"),
    lookup(values, "preferredTime")
  );

  if (!request.isValid()) {
    std::cerr << "Invalid appointment request." << std::endl;
    return 1;
  }

  AppointmentDatabase database("native/appointments/appointments.db");
  if (!database.append(request)) {
    std::cerr << "Unable to save appointment to the database." << std::endl;
    return 2;
  }

  std::cout << "Appointment saved. Total appointments: " << database.totalRequests() << std::endl;
  return 0;
}
