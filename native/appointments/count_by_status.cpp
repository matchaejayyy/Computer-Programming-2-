/**
 * Counts appointment rows by status (same rules as list_appointments filter).
 * Usage: count_by_status <db_path>
 * Output: {"total":N,"pending":N,"approved":N,"rejected":N,"cancelled":N,"no_show":N,"completed":N}
 *
 * Build: c++ -std=c++17 -O2 -o native/appointments/count_by_status native/appointments/count_by_status.cpp
 */

#include <fstream>
#include <iostream>
#include <string>

namespace {

void classifyLine(
  const std::string& line,
  int& pending,
  int& approved,
  int& rejected,
  int& cancelled,
  int& no_show,
  int& completed
) {
  if (line.find("\"status\":\"completed\"") != std::string::npos) {
    ++completed;
  } else if (line.find("\"status\":\"approved\"") != std::string::npos) {
    ++approved;
  } else if (line.find("\"status\":\"no_show\"") != std::string::npos) {
    ++no_show;
  } else if (line.find("\"status\":\"cancelled\"") != std::string::npos) {
    ++cancelled;
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
    std::cout << "{\"total\":0,\"pending\":0,\"approved\":0,\"rejected\":0,\"cancelled\":0,\"no_show\":0,\"completed\":0}\n";
    return 0;
  }

  int total = 0;
  int pending = 0;
  int approved = 0;
  int rejected = 0;
  int cancelled = 0;
  int no_show = 0;
  int completed = 0;
  std::string line;

  while (std::getline(in, line)) {
    if (line.empty()) {
      continue;
    }
    ++total;
    classifyLine(line, pending, approved, rejected, cancelled, no_show, completed);
  }

  std::cout << "{\"total\":" << total << ",\"pending\":" << pending << ",\"approved\":" << approved
            << ",\"rejected\":" << rejected << ",\"cancelled\":" << cancelled
            << ",\"no_show\":" << no_show << ",\"completed\":" << completed << "}\n";
  return 0;
}
