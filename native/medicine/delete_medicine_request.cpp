/**
 * Deletes a medicine request row by numeric id.
 * Usage: delete_medicine_request <db_path>
 * Stdin: id (single line, numeric)
 *
 * Rewrites the db file without the matching line.
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/medicine/delete_medicine_request native/medicine/delete_medicine_request.cpp
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

bool parseJsonIntField(const std::string& line, const std::string& key, int& out) {
  const std::string needle = "\"" + key + "\":";
  const auto pos = line.find(needle);
  if (pos == std::string::npos) return false;
  std::size_t i = pos + needle.size();
  while (i < line.size() && std::isspace(static_cast<unsigned char>(line[i]))) ++i;
  if (i >= line.size() || !std::isdigit(static_cast<unsigned char>(line[i]))) return false;
  out = 0;
  while (i < line.size() && std::isdigit(static_cast<unsigned char>(line[i]))) {
    out = out * 10 + (line[i] - '0');
    ++i;
  }
  return true;
}

}  // namespace

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: delete_medicine_request <db_path>" << std::endl;
    return 1;
  }

  const std::string dbPath = argv[1];
  std::string idLine;
  std::getline(std::cin, idLine);
  idLine = trim(idLine);
  if (idLine.empty()) {
    std::cerr << "id is required." << std::endl;
    return 1;
  }

  int targetId = 0;
  try { targetId = std::stoi(idLine); } catch (...) {
    std::cerr << "invalid id." << std::endl;
    return 1;
  }

  std::ifstream in(dbPath);
  if (!in) {
    std::cerr << "Cannot read database." << std::endl;
    return 2;
  }

  std::vector<std::string> rows;
  std::string line;
  bool removed = false;
  while (std::getline(in, line)) {
    const std::string raw = trim(line);
    if (raw.empty()) continue;
    int rowId = 0;
    if (!removed && parseJsonIntField(raw, "id", rowId) && rowId == targetId) {
      removed = true;
      continue;
    }
    rows.push_back(raw);
  }
  in.close();

  if (!removed) {
    std::cerr << "No medicine request with id " << targetId << "." << std::endl;
    return 3;
  }

  std::ofstream out(dbPath, std::ios::trunc);
  if (!out) {
    std::cerr << "Cannot write database." << std::endl;
    return 4;
  }
  for (const auto& row : rows) out << row << '\n';

  std::cout << "{\"success\":true}" << std::endl;
  return 0;
}
