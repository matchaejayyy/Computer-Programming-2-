/**
 * Updates status and optional admin note for one appointment row.
 * Usage: update_appointment <db_path>  (stdin: id line, status line, note line)
 *
 * id matches JSON "id" field when present; otherwise 1-based line number.
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/appointments/update_appointment \
 *     native/appointments/update_appointment.cpp
 */

#include <cctype>
#include <ctime>
#include <fstream>
#include <iostream>
#include <regex>
#include <sstream>
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

bool parseJsonIntField(const std::string& line, const std::string& key, int& out) {
  const std::string needle = "\"" + key + "\":";
  const auto pos = line.find(needle);
  if (pos == std::string::npos) {
    return false;
  }
  std::size_t i = pos + needle.size();
  while (i < line.size() && std::isspace(static_cast<unsigned char>(line[i]))) {
    ++i;
  }
  if (i >= line.size() || !std::isdigit(static_cast<unsigned char>(line[i]))) {
    return false;
  }
  out = 0;
  while (i < line.size() && std::isdigit(static_cast<unsigned char>(line[i]))) {
    out = out * 10 + (line[i] - '0');
    ++i;
  }
  return true;
}

int effectiveId(const std::string& line, int lineIndex1) {
  int id = -1;
  if (parseJsonIntField(line, "id", id) && id >= 0) {
    return id;
  }
  return lineIndex1;
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

std::string replaceStatus(const std::string& line, const std::string& status) {
  static const std::regex re(R"("status"\s*:\s*"[^"]*")");
  const std::string replacement = std::string("\"status\":\"") + escapeJson(status) + "\"";
  if (std::regex_search(line, re)) {
    return std::regex_replace(line, re, replacement);
  }
  const auto rb = line.rfind('}');
  if (rb == std::string::npos) {
    return line;
  }
  return line.substr(0, rb) + ",\"status\":\"" + escapeJson(status) + "\"" + line.substr(rb);
}

std::string replaceOrInsertStringField(const std::string& line, const std::string& key, const std::string& value) {
  const std::string esc = escapeJson(value);
  const std::string pattern = std::string("\"") + key + "\":\"";
  const auto pos = line.find(pattern);
  if (pos != std::string::npos) {
    const std::size_t start = pos + pattern.size();
    const auto end = line.find('"', start);
    if (end == std::string::npos) {
      return line;
    }
    return line.substr(0, start) + esc + line.substr(end);
  }
  const auto rb = line.rfind('}');
  if (rb == std::string::npos) {
    return line;
  }
  return line.substr(0, rb) + ",\"" + key + "\":\"" + esc + "\"" + line.substr(rb);
}

} // namespace

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: update_appointment <db_path>" << std::endl;
    return 1;
  }

  const std::string path = argv[1];
  std::string idLine;
  std::string statusLine;
  std::string noteLine;
  if (!std::getline(std::cin, idLine) || !std::getline(std::cin, statusLine)) {
    std::cerr << "Expected id and status lines on stdin." << std::endl;
    return 2;
  }
  std::getline(std::cin, noteLine);

  const int targetId = std::stoi(trim(idLine));
  const std::string status = trim(statusLine);
  if (
    status != "pending" &&
    status != "approved" &&
    status != "rejected" &&
    status != "cancelled"
    && status != "no_show"
  ) {
    std::cerr << "status must be pending, approved, rejected, cancelled, or no_show." << std::endl;
    return 3;
  }
  const std::string note = trim(noteLine);
  const std::string reviewedAt = utcTimestamp();

  std::ifstream in(path);
  if (!in) {
    std::cerr << "Cannot read database." << std::endl;
    return 4;
  }

  std::vector<std::string> lines;
  std::string row;
  while (std::getline(in, row)) {
    if (!row.empty()) {
      lines.push_back(row);
    }
  }

  bool found = false;
  for (std::size_t i = 0; i < lines.size(); ++i) {
    if (effectiveId(lines[i], static_cast<int>(i) + 1) != targetId) {
      continue;
    }
    std::string updated = replaceStatus(lines[i], status);
    updated = replaceOrInsertStringField(updated, "adminNote", note);
    updated = replaceOrInsertStringField(updated, "reviewedAt", reviewedAt);
    lines[i] = updated;
    found = true;
    break;
  }

  if (!found) {
    std::cerr << "No appointment with that id." << std::endl;
    return 5;
  }

  std::ofstream out(path, std::ios::trunc);
  if (!out) {
    std::cerr << "Cannot write database." << std::endl;
    return 6;
  }

  for (std::size_t i = 0; i < lines.size(); ++i) {
    out << lines[i] << '\n';
  }

  std::cout << "updated " << targetId << '\n';
  return 0;
}
