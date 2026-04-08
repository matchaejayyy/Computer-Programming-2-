/**
 * Counts medicine request rows grouped by medication name.
 * Usage: count_by_medication <db_path>
 * Output: {"total":N,"medications":{"Paracetamol":5,"Ibuprofen":3,...}}
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/medicine/count_by_medication native/medicine/count_by_medication.cpp
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
  while (start < end && std::isspace(static_cast<unsigned char>(value[start]))) ++start;
  while (end > start && std::isspace(static_cast<unsigned char>(value[end - 1]))) --end;
  return value.substr(start, end - start);
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

}  // namespace

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: count_by_medication <db_path>" << std::endl;
    return 1;
  }

  std::ifstream in(argv[1]);
  if (!in) {
    std::cout << "{\"total\":0,\"medications\":{}}\n";
    return 0;
  }

  int total = 0;
  std::map<std::string, int> counts;
  std::string line;

  while (std::getline(in, line)) {
    const std::string trimmed = trim(line);
    if (trimmed.empty()) continue;
    ++total;
    std::string medication;
    if (extractJsonStringField(trimmed, "medication", medication) && !medication.empty()) {
      counts[medication]++;
    }
  }

  std::cout << "{\"total\":" << total << ",\"medications\":{";
  bool first = true;
  for (const auto& [med, count] : counts) {
    if (!first) std::cout << ',';
    std::cout << "\"" << escapeJson(med) << "\":" << count;
    first = false;
  }
  std::cout << "}}\n";
  return 0;
}
