/**
 * Updates a medicine request row by id.
 * Usage: update_medicine_request <db_path>
 * Stdin: key=value lines (id is required; studentId, name, medication, quantity, requestedAt optional)
 *
 * Rewrites the db file with the updated line.
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/medicine/update_medicine_request native/medicine/update_medicine_request.cpp
 */

#include <cctype>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

namespace {

std::string trim(const std::string& value) {
  std::size_t start = 0;
  std::size_t end = value.size();
  while (start < end && std::isspace(static_cast<unsigned char>(value[start]))) ++start;
  while (end > start && std::isspace(static_cast<unsigned char>(value[end - 1]))) --end;
  return value.substr(start, end - start);
}

std::unordered_map<std::string, std::string> parseInput() {
  std::unordered_map<std::string, std::string> values;
  std::string line;
  while (std::getline(std::cin, line)) {
    const auto sep = line.find('=');
    if (sep == std::string::npos) continue;
    const std::string key = trim(line.substr(0, sep));
    const std::string val = trim(line.substr(sep + 1));
    if (!key.empty()) values[key] = val;
  }
  return values;
}

std::string lookup(const std::unordered_map<std::string, std::string>& m, const std::string& key) {
  const auto it = m.find(key);
  return it == m.end() ? std::string{} : it->second;
}

std::string escapeJson(const std::string& value) {
  std::string out;
  for (char ch : value) {
    switch (ch) {
      case '"':  out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n"; break;
      case '\r': out += "\\r"; break;
      case '\t': out += "\\t"; break;
      default:   out += ch; break;
    }
  }
  return out;
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

std::string replaceOrInsertStringField(const std::string& line, const std::string& key, const std::string& value) {
  const std::string esc = escapeJson(value);
  const std::string pattern = "\"" + key + "\":\"";
  const auto pos = line.find(pattern);
  if (pos != std::string::npos) {
    const std::size_t start = pos + pattern.size();
    bool escaping = false;
    std::size_t end = start;
    for (; end < line.size(); ++end) {
      if (escaping) { escaping = false; continue; }
      if (line[end] == '\\') { escaping = true; continue; }
      if (line[end] == '"') break;
    }
    return line.substr(0, start) + esc + line.substr(end);
  }
  const auto rb = line.rfind('}');
  if (rb == std::string::npos) return line;
  return line.substr(0, rb) + ",\"" + key + "\":\"" + esc + "\"" + line.substr(rb);
}

std::string replaceOrInsertIntField(const std::string& line, const std::string& key, int value) {
  const std::string needle = "\"" + key + "\":";
  const auto pos = line.find(needle);
  if (pos != std::string::npos) {
    std::size_t i = pos + needle.size();
    while (i < line.size() && std::isspace(static_cast<unsigned char>(line[i]))) ++i;
    std::size_t numStart = i;
    while (i < line.size() && std::isdigit(static_cast<unsigned char>(line[i]))) ++i;
    return line.substr(0, numStart) + std::to_string(value) + line.substr(i);
  }
  const auto rb = line.rfind('}');
  if (rb == std::string::npos) return line;
  return line.substr(0, rb) + ",\"" + key + "\":" + std::to_string(value) + line.substr(rb);
}

}  // namespace

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: update_medicine_request <db_path>" << std::endl;
    return 1;
  }

  const std::string dbPath = argv[1];
  const auto values = parseInput();

  const std::string idStr = lookup(values, "id");
  if (idStr.empty()) {
    std::cerr << "id is required." << std::endl;
    return 1;
  }

  int targetId = 0;
  try { targetId = std::stoi(idStr); } catch (...) {
    std::cerr << "invalid id." << std::endl;
    return 1;
  }

  std::ifstream in(dbPath);
  if (!in) {
    std::cerr << "Cannot read database." << std::endl;
    return 2;
  }

  std::vector<std::string> lines;
  std::string row;
  while (std::getline(in, row)) {
    const std::string trimmed = trim(row);
    if (!trimmed.empty()) lines.push_back(trimmed);
  }
  in.close();

  bool found = false;
  for (auto& line : lines) {
    int rowId = 0;
    if (!parseJsonIntField(line, "id", rowId) || rowId != targetId) continue;

    const std::string studentId = lookup(values, "studentId");
    const std::string name = lookup(values, "name");
    const std::string medication = lookup(values, "medication");
    const std::string quantityStr = lookup(values, "quantity");
    const std::string requestedAt = lookup(values, "requestedAt");

    if (!studentId.empty()) line = replaceOrInsertStringField(line, "studentId", studentId);
    if (!name.empty()) line = replaceOrInsertStringField(line, "name", name);
    if (!medication.empty()) line = replaceOrInsertStringField(line, "medication", medication);
    if (!quantityStr.empty()) {
      int q = 1;
      try { q = std::stoi(quantityStr); } catch (...) { q = 1; }
      if (q < 1) q = 1;
      line = replaceOrInsertIntField(line, "quantity", q);
    }
    if (!requestedAt.empty()) line = replaceOrInsertStringField(line, "requestedAt", requestedAt);

    found = true;
    break;
  }

  if (!found) {
    std::cerr << "No medicine request with id " << targetId << "." << std::endl;
    return 3;
  }

  std::ofstream out(dbPath, std::ios::trunc);
  if (!out) {
    std::cerr << "Cannot write database." << std::endl;
    return 4;
  }
  for (const auto& l : lines) out << l << '\n';

  std::cout << "{\"updated\":" << targetId << "}" << std::endl;
  return 0;
}
