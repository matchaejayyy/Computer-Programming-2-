/**
 * Lists medicine request records as JSON with optional date and search filtering.
 * Usage:
 *   list_medicine_requests <db_path> [date_filter]
 *   (stdin: optional search query on first line)
 *
 * date_filter: "all" or "YYYY-MM-DD" to filter by requestedAt date
 * search query from stdin matches against name or medication (case-insensitive)
 *
 * Output: {"requests":[ ...objects... ]}
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/medicine/list_medicine_requests native/medicine/list_medicine_requests.cpp
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
  while (start < end && std::isspace(static_cast<unsigned char>(value[start]))) ++start;
  while (end > start && std::isspace(static_cast<unsigned char>(value[end - 1]))) --end;
  return value.substr(start, end - start);
}

std::string toLowerAscii(std::string s) {
  for (char& c : s) {
    if (c >= 'A' && c <= 'Z') c = static_cast<char>(c - 'A' + 'a');
  }
  return s;
}

bool extractJsonStringField(const std::string& line, const std::string& key, std::string& out) {
  const std::string needle = "\"" + key + "\":\"";
  const auto pos = line.find(needle);
  if (pos == std::string::npos) return false;
  std::string val;
  bool escaping = false;
  for (std::size_t i = pos + needle.size(); i < line.size(); ++i) {
    const char ch = line[i];
    if (escaping) {
      switch (ch) {
        case 'n': val.push_back('\n'); break;
        case 'r': val.push_back('\r'); break;
        case 't': val.push_back('\t'); break;
        default: val.push_back(ch); break;
      }
      escaping = false;
      continue;
    }
    if (ch == '\\') { escaping = true; continue; }
    if (ch == '"') { out = val; return true; }
    val.push_back(ch);
  }
  return false;
}

bool matchesDate(const std::string& line, const std::string& dateFilter) {
  if (dateFilter.empty() || dateFilter == "all") return true;
  std::string requestedAt;
  if (!extractJsonStringField(line, "requestedAt", requestedAt)) return true;
  return requestedAt.substr(0, 10) == dateFilter;
}

bool matchesSearch(const std::string& line, const std::string& query) {
  if (query.empty()) return true;
  const std::string qLower = toLowerAscii(query);

  std::string name;
  if (extractJsonStringField(line, "name", name)) {
    if (toLowerAscii(name).find(qLower) != std::string::npos) return true;
  }
  std::string medication;
  if (extractJsonStringField(line, "medication", medication)) {
    if (toLowerAscii(medication).find(qLower) != std::string::npos) return true;
  }
  std::string studentId;
  if (extractJsonStringField(line, "studentId", studentId)) {
    if (toLowerAscii(studentId).find(qLower) != std::string::npos) return true;
  }
  return false;
}

}  // namespace

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: list_medicine_requests <db_path> [date_filter]" << std::endl;
    return 1;
  }

  const std::string path = argv[1];
  const std::string dateFilter = argc >= 3 ? argv[2] : "all";

  std::string searchQuery;
  if (!std::cin.eof()) {
    std::getline(std::cin, searchQuery);
    searchQuery = trim(searchQuery);
  }

  std::ifstream in(path);
  if (!in) {
    std::cout << "{\"requests\":[]}\n";
    return 0;
  }

  std::vector<std::string> rows;
  std::string rawLine;
  while (std::getline(in, rawLine)) {
    if (!rawLine.empty() && rawLine.back() == '\r') rawLine.pop_back();
    const std::string line = trim(rawLine);
    if (line.empty()) continue;
    if (!matchesDate(line, dateFilter)) continue;
    if (!matchesSearch(line, searchQuery)) continue;
    rows.push_back(line);
  }

  std::cout << "{\"requests\":[";
  for (std::size_t i = 0; i < rows.size(); ++i) {
    if (i > 0) std::cout << ',';
    std::cout << rows[i];
  }
  std::cout << "]}\n";
  return 0;
}
