#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

namespace {

std::string trim(std::string s) {
  const auto is_ws = [](unsigned char c) { return std::isspace(c) != 0; };
  while (!s.empty() && is_ws(static_cast<unsigned char>(s.front()))) s.erase(s.begin());
  while (!s.empty() && is_ws(static_cast<unsigned char>(s.back()))) s.pop_back();
  return s;
}

std::string jsonEscape(const std::string& in) {
  std::ostringstream out;
  for (unsigned char c : in) {
    switch (c) {
      case '\"': out << "\\\""; break;
      case '\\': out << "\\\\"; break;
      case '\b': out << "\\b"; break;
      case '\f': out << "\\f"; break;
      case '\n': out << "\\n"; break;
      case '\r': out << "\\r"; break;
      case '\t': out << "\\t"; break;
      default:
        if (c < 0x20) {
          out << "\\u" << std::hex << std::setw(4) << std::setfill('0')
              << static_cast<int>(c) << std::dec;
        } else {
          out << static_cast<char>(c);
        }
    }
  }
  return out.str();
}

int countNonEmptyLines(const std::string& path) {
  std::ifstream in(path);
  if (!in) return 0;
  int count = 0;
  std::string line;
  while (std::getline(in, line)) {
    if (!trim(line).empty()) {
      ++count;
    }
  }
  return count;
}

std::string pad4(int n) {
  std::ostringstream out;
  out << std::setw(4) << std::setfill('0') << n;
  return out.str();
}

}  // namespace

int main(int argc, char* argv[]) {
  if (argc < 2) {
    std::cerr << "usage: save_broadcast_notification <db_path>" << std::endl;
    return 1;
  }

  const std::string dbPath = argv[1];
  std::vector<std::string> lines;
  std::string line;
  while (std::getline(std::cin, line)) {
    lines.push_back(line);
  }
  while (lines.size() < 3) lines.push_back("");

  const std::string title = trim(lines[0]);
  const std::string message = trim(lines[1]);
  const std::string createdAt = trim(lines[2]);

  if (title.empty() || message.empty() || createdAt.empty()) {
    std::cerr << "title, message, and createdAt are required." << std::endl;
    return 1;
  }

  try {
    std::filesystem::create_directories(std::filesystem::path(dbPath).parent_path());
  } catch (...) {
    std::cerr << "could not create output directory." << std::endl;
    return 1;
  }

  const int next = countNonEmptyLines(dbPath) + 1;
  const std::string id = "BCAST-" + pad4(next);

  std::ostringstream row;
  row << "{\"id\":\"" << jsonEscape(id) << "\","
      << "\"title\":\"" << jsonEscape(title) << "\","
      << "\"message\":\"" << jsonEscape(message) << "\","
      << "\"createdAt\":\"" << jsonEscape(createdAt) << "\"}";

  {
    std::ofstream out(dbPath, std::ios::app);
    if (!out) {
      std::cerr << "cannot open db file for append." << std::endl;
      return 1;
    }
    out << row.str() << '\n';
  }

  std::cout << row.str() << std::endl;
  return 0;
}
