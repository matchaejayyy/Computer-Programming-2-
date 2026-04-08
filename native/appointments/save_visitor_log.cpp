/**
 * Saves one visitor log row as JSON line.
 * Usage:
 *   save_visitor_log <db_path>
 *
 * Reads 8 stdin lines in order:
 *   name
 *   email
 *   department
 *   course
 *   year
 *   time
 *   purpose
 *   createdAt
 *
 * Writes saved JSON row to stdout.
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/appointments/save_visitor_log \
 *     native/appointments/save_visitor_log.cpp
 */

#include <cctype>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>

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

std::string escapeJson(const std::string& value) {
  std::ostringstream output;
  for (char ch : value) {
    switch (ch) {
      case '"':
        output << "\\\"";
        break;
      case '\\':
        output << "\\\\";
        break;
      case '\n':
        output << "\\n";
        break;
      case '\r':
        output << "\\r";
        break;
      case '\t':
        output << "\\t";
        break;
      default:
        output << ch;
        break;
    }
  }
  return output.str();
}

std::size_t countNonemptyLines(const std::string& path) {
  std::ifstream in(path);
  if (!in) {
    return 0;
  }
  std::size_t count = 0;
  std::string line;
  while (std::getline(in, line)) {
    if (!trim(line).empty()) {
      ++count;
    }
  }
  return count;
}

std::string pad4(std::size_t value) {
  std::ostringstream out;
  out.fill('0');
  out.width(4);
  out << value;
  return out.str();
}

}  // namespace

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: save_visitor_log <db_path>" << std::endl;
    return 1;
  }

  const std::string path = argv[1];
  std::string name;
  std::string email;
  std::string department;
  std::string course;
  std::string year;
  std::string time;
  std::string purpose;
  std::string createdAt;

  if (!std::getline(std::cin, name) || !std::getline(std::cin, email) ||
      !std::getline(std::cin, department) || !std::getline(std::cin, course) ||
      !std::getline(std::cin, year) || !std::getline(std::cin, time) ||
      !std::getline(std::cin, purpose) || !std::getline(std::cin, createdAt)) {
    std::cerr << "Expected 8 lines on stdin." << std::endl;
    return 2;
  }

  name = trim(name);
  email = trim(email);
  department = trim(department);
  course = trim(course);
  year = trim(year);
  time = trim(time);
  purpose = trim(purpose);
  createdAt = trim(createdAt);

  if (name.empty() || email.empty() || department.empty() || course.empty() || year.empty() ||
      time.empty() || purpose.empty() || createdAt.empty()) {
    std::cerr << "All fields are required." << std::endl;
    return 3;
  }

  const std::size_t nextNumber = countNonemptyLines(path) + 1;
  const std::string id = std::string("VLOG-") + pad4(nextNumber);

  const std::string row = std::string("{") +
                          "\"id\":\"" + escapeJson(id) + "\"," +
                          "\"name\":\"" + escapeJson(name) + "\"," +
                          "\"email\":\"" + escapeJson(email) + "\"," +
                          "\"department\":\"" + escapeJson(department) + "\"," +
                          "\"course\":\"" + escapeJson(course) + "\"," +
                          "\"year\":\"" + escapeJson(year) + "\"," +
                          "\"time\":\"" + escapeJson(time) + "\"," +
                          "\"purpose\":\"" + escapeJson(purpose) + "\"," +
                          "\"createdAt\":\"" + escapeJson(createdAt) + "\"" +
                          "}";

  std::ofstream out(path, std::ios::app);
  if (!out) {
    std::cerr << "Cannot write database." << std::endl;
    return 4;
  }
  out << row << '\n';
  out.flush();
  if (!out) {
    std::cerr << "Write failed." << std::endl;
    return 5;
  }

  std::cout << row << '\n';
  return 0;
}
