/**
 * Saves a medicine request to the JSONL database.
 * Reads key=value pairs from stdin (studentId, name, medication, quantity, requestedAt).
 * Appends one JSON line to the db file.
 *
 * Usage: save_medicine_request <db_path>
 * Stdin: key=value lines
 * Stdout: "saved id=<N>"
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/medicine/save_medicine_request native/medicine/save_medicine_request.cpp
 */

#include <cctype>
#include <ctime>
#include <fstream>
#include <iostream>
#include <string>
#include <unordered_map>

namespace {

std::string trim(const std::string& value) {
  std::size_t start = 0;
  std::size_t end = value.size();
  while (start < end && std::isspace(static_cast<unsigned char>(value[start]))) ++start;
  while (end > start && std::isspace(static_cast<unsigned char>(value[end - 1]))) --end;
  return value.substr(start, end - start);
}

std::unordered_map<std::string, std::string> parseInput() {
  std::unordered_map<std::string, std::string> values;
  std::string line;
  while (std::getline(std::cin, line)) {
    const auto sep = line.find('=');
    if (sep == std::string::npos) continue;
    const std::string key = trim(line.substr(0, sep));
    const std::string val = trim(line.substr(sep + 1));
    if (!key.empty()) values[key] = val;
  }
  return values;
}

std::string lookup(const std::unordered_map<std::string, std::string>& m, const std::string& key) {
  const auto it = m.find(key);
  return it == m.end() ? std::string{} : it->second;
}

int nextId(const std::string& path) {
  int maxId = 0;
  std::ifstream in(path);
  std::string line;
  while (std::getline(in, line)) {
    if (line.empty()) continue;
    const auto pos = line.find("\"id\":");
    if (pos == std::string::npos) continue;
    std::size_t i = pos + 5;
    while (i < line.size() && std::isspace(static_cast<unsigned char>(line[i]))) ++i;
    int id = 0;
    while (i < line.size() && std::isdigit(static_cast<unsigned char>(line[i]))) {
      id = id * 10 + (line[i] - '0');
      ++i;
    }
    if (id > maxId) maxId = id;
  }
  return maxId + 1;
}

std::string utcTimestamp() {
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

std::string escapeJson(const std::string& value) {
  std::string out;
  for (char ch : value) {
    switch (ch) {
      case '"':  out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n"; break;
      case '\r': out += "\\r"; break;
      case '\t': out += "\\t"; break;
      default:   out += ch; break;
    }
  }
  return out;
}

}  // namespace

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: save_medicine_request <db_path>" << std::endl;
    return 1;
  }

  const std::string dbPath = argv[1];
  const auto values = parseInput();

  const std::string studentId = lookup(values, "studentId");
  const std::string name = lookup(values, "name");
  const std::string medication = lookup(values, "medication");
  const std::string quantityStr = lookup(values, "quantity");
  std::string requestedAt = lookup(values, "requestedAt");

  if (studentId.empty() || name.empty() || medication.empty()) {
    std::cerr << "studentId, name, and medication are required." << std::endl;
    return 1;
  }

  int quantity = 1;
  if (!quantityStr.empty()) {
    try { quantity = std::stoi(quantityStr); } catch (...) { quantity = 1; }
    if (quantity < 1) quantity = 1;
  }

  if (requestedAt.empty()) requestedAt = utcTimestamp();

  const int id = nextId(dbPath);
  const std::string createdAt = utcTimestamp();

  std::string line = "{\"id\":" + std::to_string(id)
    + ",\"studentId\":\"" + escapeJson(studentId) + "\""
    + ",\"name\":\"" + escapeJson(name) + "\""
    + ",\"medication\":\"" + escapeJson(medication) + "\""
    + ",\"quantity\":" + std::to_string(quantity)
    + ",\"requestedAt\":\"" + escapeJson(requestedAt) + "\""
    + ",\"createdAt\":\"" + escapeJson(createdAt) + "\""
    + "}";

  std::ofstream file(dbPath, std::ios::app);
  if (!file) {
    std::cerr << "Unable to write to database." << std::endl;
    return 2;
  }

  file << line << '\n';
  if (!file) {
    std::cerr << "Unable to write to database." << std::endl;
    return 2;
  }

  std::cout << "{\"id\":" << id << "}" << std::endl;
  return 0;
}
