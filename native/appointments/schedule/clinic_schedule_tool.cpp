/**
 * Reads or writes the public weekly clinic schedule JSON file.
 * Stdin line 1: LIST | SAVE
 * If SAVE, remainder of stdin is written to the file (UTF-8).
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/appointments/clinic_schedule_tool \
 *     native/appointments/clinic_schedule_tool.cpp
 */

#include <fstream>
#include <iostream>
#include <iterator>
#include <string>

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: clinic_schedule_tool <json_path>" << std::endl;
    return 1;
  }

  const std::string path = argv[1];
  std::string command;
  if (!std::getline(std::cin, command)) {
    std::cerr << "Missing command." << std::endl;
    return 2;
  }

  if (command == "LIST") {
    std::ifstream in(path);
    if (!in) {
      std::cerr << "Cannot read schedule file." << std::endl;
      return 3;
    }
    std::cout << in.rdbuf();
    return 0;
  }

  if (command == "SAVE") {
    std::string body((std::istreambuf_iterator<char>(std::cin)), std::istreambuf_iterator<char>());
    if (body.empty()) {
      std::cerr << "Empty body." << std::endl;
      return 4;
    }
    std::ofstream out(path, std::ios::trunc);
    if (!out) {
      std::cerr << "Cannot write schedule file." << std::endl;
      return 5;
    }
    out << body;
    if (!out) {
      std::cerr << "Write failed." << std::endl;
      return 6;
    }
    std::cout << "ok\n";
    return 0;
  }

  std::cerr << "Command must be LIST or SAVE." << std::endl;
  return 7;
}
