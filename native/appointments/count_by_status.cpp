/**
 * Counts appointment rows by status (same rules as list_appointments filter).
 * Usage: count_by_status <db_path>
 * Output: {"total":N,"pending":N,"approved":N,"rejected":N}
 *
 * Build: c++ -std=c++17 -O2 -o native/appointments/count_by_status native/appointments/count_by_status.cpp
 */

#include <fstream>
#include <iostream>
#include <string>

namespace {

void classifyLine(const std::string& line, int& pending, int& approved, int& rejected) {
  if (line.find("\"status\":\"approved\"") != std::string::npos) {
    ++approved;
  } else if (line.find("\"status\":\"rejected\"") != std::string::npos) {
    ++rejected;
  } else {
    ++pending;
  }
}

} // namespace

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: count_by_status <db_path>" << std::endl;
    return 1;
  }

  std::ifstream in(argv[1]);
  if (!in) {
    std::cout << "{\"total\":0,\"pending\":0,\"approved\":0,\"rejected\":0}\n";
    return 0;
  }

  int total = 0;
  int pending = 0;
  int approved = 0;
  int rejected = 0;
  std::string line;

  while (std::getline(in, line)) {
    if (line.empty()) {
      continue;
    }
    ++total;
    classifyLine(line, pending, approved, rejected);
  }

  std::cout << "{\"total\":" << total << ",\"pending\":" << pending << ",\"approved\":" << approved
            << ",\"rejected\":" << rejected << "}\n";
  return 0;
}
