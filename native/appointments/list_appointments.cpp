/**
 * Lists appointment records as JSON. Usage:
 *   list_appointments <db_path> <all|pending|approved|rejected|cancelled|no_show|completed>
 * Writes: {"lineNumbers":[...],"appointments":[ ...objects... ]}\n
 * (lineNumbers are 1-based indices of non-empty trimmed lines, matching TypeScript readers.)
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/appointments/list_appointments native/appointments/list_appointments.cpp
 */

#include <fstream>
#include <iostream>
#include <string>
#include <vector>

namespace {

std::string trim(const std::string& value) {
  std::size_t start = 0;
  std::size_t end = value.size();
  while (start < end && std::isspace(static_cast<unsigned char>(value[start]))) {
    ++start;
  }
  while (end > start && std::isspace(static_cast<unsigned char>(value[end - 1]))) {
    --end;
  }
  return value.substr(start, end - start);
}

bool matchesFilter(const std::string& line, const std::string& filter) {
  if (filter == "all") {
    return true;
  }

  const bool hasPending = line.find("\"status\":\"pending\"") != std::string::npos;
  const bool hasApproved = line.find("\"status\":\"approved\"") != std::string::npos;
  const bool hasRejected = line.find("\"status\":\"rejected\"") != std::string::npos;
  const bool hasCancelled = line.find("\"status\":\"cancelled\"") != std::string::npos;
  const bool hasNoShow = line.find("\"status\":\"no_show\"") != std::string::npos;
  const bool hasCompleted = line.find("\"status\":\"completed\"") != std::string::npos;
  const bool hasStatusKey = line.find("\"status\":") != std::string::npos;

  if (filter == "pending") {
    return !hasStatusKey || hasPending;
  }
  if (filter == "approved") {
    return hasApproved;
  }
  if (filter == "rejected") {
    return hasRejected;
  }
  if (filter == "cancelled") {
    return hasCancelled;
  }
  if (filter == "no_show") {
    return hasNoShow;
  }
  if (filter == "completed") {
    return hasCompleted;
  }

  return true;
}

} // namespace

int main(int argc, char** argv) {
  if (argc < 3) {
    std::cerr << "usage: list_appointments <db_path> <all|pending|approved|rejected|cancelled|no_show|completed>" << std::endl;
    return 1;
  }

  const std::string path = argv[1];
  const std::string filter = argv[2];

  std::ifstream in(path);
  if (!in) {
    std::cout << "{\"lineNumbers\":[],\"appointments\":[]}\n";
    return 0;
  }

  std::vector<int> lineNums;
  std::vector<std::string> rows;

  std::string rawLine;
  int lineIndex1 = 0;
  while (std::getline(in, rawLine)) {
    if (!rawLine.empty() && rawLine.back() == '\r') {
      rawLine.pop_back();
    }
    const std::string line = trim(rawLine);
    if (line.empty()) {
      continue;
    }
    ++lineIndex1;
    if (!matchesFilter(line, filter)) {
      continue;
    }
    lineNums.push_back(lineIndex1);
    rows.push_back(line);
  }

  std::cout << "{\"lineNumbers\":[";
  for (std::size_t i = 0; i < lineNums.size(); ++i) {
    if (i > 0) {
      std::cout << ',';
    }
    std::cout << lineNums[i];
  }
  std::cout << "],\"appointments\":[";
  for (std::size_t i = 0; i < rows.size(); ++i) {
    if (i > 0) {
      std::cout << ',';
    }
    std::cout << rows[i];
  }
  std::cout << "]}\n";
  return 0;
}
