/**
 * Lists appointment records as JSON. Usage:
 *   list_appointments <db_path> <all|pending|approved|rejected|cancelled|no_show|completed>
 * Writes: {"lineNumbers":[...],"appointments":[ ...objects... ]}\n
 * (lineNumbers are 1-based indices of non-empty trimmed lines, matching TypeScript readers.)
 *
 * Uses polymorphic status filters (Module 8) and a manually managed int buffer (Module 6)
 * when emitting lineNumbers, then releases it with delete[].
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/appointments/list_appointments \\
 *       native/appointments/list_appointments.cpp native/appointments/AppointmentLineFilter.cpp
 */

#include <fstream>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

#include "AppointmentLineFilter.h"

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

} // namespace

int main(int argc, char** argv) {
  if (argc < 3) {
    std::cerr << "usage: list_appointments <db_path> <all|pending|approved|rejected|cancelled|no_show|completed>" << std::endl;
    return 1;
  }

  const std::string path = argv[1];
  const std::string filterName = argv[2];

  std::unique_ptr<AppointmentLineFilter> filter = createAppointmentLineFilter(filterName);
  if (!filter) {
    std::cerr << "unknown filter: " << filterName << std::endl;
    return 1;
  }

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
    if (!filter->matches(line)) {
      continue;
    }
    lineNums.push_back(lineIndex1);
    rows.push_back(line);
  }

  // Module 6 — explicit dynamic array for exported indices (paired with delete[] below).
  const std::size_t n = lineNums.size();
  int* exportLineNums = nullptr;
  if (n > 0) {
    exportLineNums = new int[n];
    for (std::size_t i = 0; i < n; ++i) {
      exportLineNums[i] = lineNums[i];
    }
  }

  std::cout << "{\"lineNumbers\":[";
  for (std::size_t i = 0; i < n; ++i) {
    if (i > 0) {
      std::cout << ',';
    }
    std::cout << exportLineNums[i];
  }
  std::cout << "],\"appointments\":[";
  for (std::size_t i = 0; i < rows.size(); ++i) {
    if (i > 0) {
      std::cout << ',';
    }
    std::cout << rows[i];
  }
  std::cout << "]}\n";

  delete[] exportLineNums;
  return 0;
}
