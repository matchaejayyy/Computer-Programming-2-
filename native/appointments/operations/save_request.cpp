#include <cctype>
#include <ctime>
#include <fstream>
#include <iostream>
#include <string>
#include <unordered_map>

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

static int nextAppointmentId(const std::string& path) {
  int maxId = 0;
  std::ifstream in(path);
  std::string line;
  while (std::getline(in, line)) {
    if (line.empty()) {
      continue;
    }
    const auto pos = line.find("\"id\":");
    if (pos == std::string::npos) {
      continue;
    }
    std::size_t i = pos + 5;
    while (i < line.size() && std::isspace(static_cast<unsigned char>(line[i]))) {
      ++i;
    }
    int id = 0;
    while (i < line.size() && std::isdigit(static_cast<unsigned char>(line[i]))) {
      id = id * 10 + (line[i] - '0');
      ++i;
    }
    if (id > maxId) {
      maxId = id;
    }
  }
  return maxId + 1;
}

static std::string utcTimestamp() {
  std::time_t t = std::time(nullptr);
  std::tm tm{};
#if defined(_WIN32)
  gmtime_s(&tm, &t);
#else
  gmtime_r(&t, &tm);
#endif
  char buf[48];
  if (std::strftime(buf, sizeof buf, "%Y-%m-%dT%H:%M:%S.000Z", &tm) == 0) {
    return "1970-01-01T00:00:00.000Z";
  }
  return std::string(buf);
}

static std::string escapeJsonString(const std::string& value) {
  std::string out;
  for (char ch : value) {
    switch (ch) {
      case '"':
        out += "\\\"";
        break;
      case '\\':
        out += "\\\\";
        break;
      case '\n':
        out += "\\n";
        break;
      case '\r':
        out += "\\r";
        break;
      case '\t':
        out += "\\t";
        break;
      default:
        out += ch;
        break;
    }
  }
  return out;
}

static std::string appendSchoolIdField(const std::string& jsonLine, const std::string& schoolIdRaw) {
  const std::string schoolId = trim(schoolIdRaw);
  if (schoolId.empty()) {
    return jsonLine;
  }
  const auto pos = jsonLine.rfind('}');
  if (pos == std::string::npos) {
    return jsonLine;
  }
  return jsonLine.substr(0, pos) + ",\"schoolIdNumber\":\"" + escapeJsonString(schoolId) + "\"" + jsonLine.substr(pos);
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

  const std::string dbPath = "native/appointments/appointments.db";
  const int id = nextAppointmentId(dbPath);
  const std::string submittedAt = utcTimestamp();
  std::string line = request.serializeForDatabase(id, "pending", "", submittedAt, "");
  line = appendSchoolIdField(line, lookup(values, "schoolIdNumber"));

  std::ofstream file(dbPath, std::ios::app);
  if (!file) {
    std::cerr << "Unable to save appointment to the database." << std::endl;
    return 2;
  }

  file << line << '\n';
  if (!file) {
    std::cerr << "Unable to save appointment to the database." << std::endl;
    return 2;
  }

  std::cout << "Appointment saved. id=" << id << std::endl;
  return 0;
}
