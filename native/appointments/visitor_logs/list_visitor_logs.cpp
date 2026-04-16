/**
 * Lists visitor log records as JSON.
 * Usage:
 *   list_visitor_logs <db_path>
 *
 * Writes:
 *   {"logs":[ ...objects... ]}\n
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/appointments/list_visitor_logs \
 *     native/appointments/list_visitor_logs.cpp
 */

#include <cctype>
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

}  // namespace

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: list_visitor_logs <db_path>" << std::endl;
    return 1;
  }

  const std::string path = argv[1];
  std::ifstream in(path);
  if (!in) {
    std::cout << "{\"logs\":[]}\n";
    return 0;
  }

  std::vector<std::string> rows;
  std::string rawLine;
  while (std::getline(in, rawLine)) {
    if (!rawLine.empty() && rawLine.back() == '\r') {
      rawLine.pop_back();
    }
    const std::string line = trim(rawLine);
    if (line.empty()) {
      continue;
    }
    rows.push_back(line);
  }

  std::cout << "{\"logs\":[";
  for (std::size_t i = 0; i < rows.size(); ++i) {
    if (i > 0) {
      std::cout << ",";
    }
    std::cout << rows[i];
  }
  std::cout << "]}\n";
  return 0;
}
