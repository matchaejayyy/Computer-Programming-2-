/**
 * Counts active appointments (pending/approved) for a given date, grouped by preferredTime.
 * Usage:
 *   count_by_date_time <db_path> <YYYY-MM-DD>
 * Output:
 *   {"9:00 AM":2,"10:00 AM":1}
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/appointments/count_by_date_time native/appointments/count_by_date_time.cpp
 */

#include <cctype>
#include <fstream>
#include <iostream>
#include <map>
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

std::string extractJsonStringValue(const std::string& line, const std::string& key) {
  const std::string marker = "\"" + key + "\":\"";
  const std::size_t start = line.find(marker);
  if (start == std::string::npos) {
    return "";
  }
  const std::size_t valueStart = start + marker.size();
  std::size_t i = valueStart;
  bool escaped = false;
  while (i < line.size()) {
    const char ch = line[i];
    if (ch == '"' && !escaped) {
      return line.substr(valueStart, i - valueStart);
    }
    escaped = (ch == '\\' && !escaped);
    if (ch != '\\') {
      escaped = false;
    }
    ++i;
  }
  return "";
}

bool hasActiveStatus(const std::string& line) {
  const bool hasStatusKey = line.find("\"status\":") != std::string::npos;
  if (!hasStatusKey) {
    return true;
  }
  return line.find("\"status\":\"pending\"") != std::string::npos ||
         line.find("\"status\":\"approved\"") != std::string::npos;
}

std::string jsonEscape(const std::string& input) {
  std::string out;
  out.reserve(input.size() + 8);
  for (const char ch : input) {
    if (ch == '\\' || ch == '"') {
      out.push_back('\\');
    }
    out.push_back(ch);
  }
  return out;
}

}  // namespace

int main(int argc, char** argv) {
  if (argc < 3) {
    std::cerr << "usage: count_by_date_time <db_path> <YYYY-MM-DD>" << std::endl;
    return 1;
  }

  const std::string path = argv[1];
  const std::string targetDate = argv[2];

  std::ifstream in(path);
  if (!in) {
    std::cout << "{}\n";
    return 0;
  }

  std::map<std::string, int> counts;
  std::string rawLine;
  while (std::getline(in, rawLine)) {
    if (!rawLine.empty() && rawLine.back() == '\r') {
      rawLine.pop_back();
    }
    const std::string line = trim(rawLine);
    if (line.empty()) {
      continue;
    }
    if (!hasActiveStatus(line)) {
      continue;
    }
    const std::string preferredDate = extractJsonStringValue(line, "preferredDate");
    if (preferredDate != targetDate) {
      continue;
    }
    const std::string preferredTime = extractJsonStringValue(line, "preferredTime");
    if (preferredTime.empty()) {
      continue;
    }
    counts[preferredTime] += 1;
  }

  std::cout << "{";
  bool first = true;
  for (const auto& [time, count] : counts) {
    if (!first) {
      std::cout << ",";
    }
    first = false;
    std::cout << "\"" << jsonEscape(time) << "\":" << count;
  }
  std::cout << "}\n";
  return 0;
}
