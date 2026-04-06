/**
 * Lists 1-based line indices (non-empty trimmed lines) in appointments.db that match
 * a status filter and an optional search query (same rules as the admin UI).
 *
 * Usage:
 *   printf '%s' "query" | search_appointments <db_path> <all|pending|approved|rejected|cancelled|no_show>
 * stdout: {"lineNumbers":[1,3,5]}
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/appointments/search_appointments native/appointments/search_appointments.cpp
 */

#include <cctype>
#include <fstream>
#include <iostream>
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

bool matchesFilter(const std::string& line, const std::string& filter) {
  if (filter == "all") {
    return true;
  }

  const bool hasPending = line.find("\"status\":\"pending\"") != std::string::npos;
  const bool hasApproved = line.find("\"status\":\"approved\"") != std::string::npos;
  const bool hasRejected = line.find("\"status\":\"rejected\"") != std::string::npos;
  const bool hasCancelled = line.find("\"status\":\"cancelled\"") != std::string::npos;
  const bool hasNoShow = line.find("\"status\":\"no_show\"") != std::string::npos;
  const bool hasStatusKey = line.find("\"status\":") != std::string::npos;

  if (filter == "pending") {
    return !hasStatusKey || hasPending;
  }
  if (filter == "approved") {
    return hasApproved;
  }
  if (filter == "rejected") {
    return hasRejected;
  }
  if (filter == "cancelled") {
    return hasCancelled;
  }
  if (filter == "no_show") {
    return hasNoShow;
  }

  return true;
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

bool extractJsonStringField(const std::string& line, const std::string& key, std::string& out) {
  const std::string needle = "\"" + key + "\"";
  const auto pos = line.find(needle);
  if (pos == std::string::npos) {
    return false;
  }
  std::size_t p = pos + needle.size();
  while (p < line.size() && std::isspace(static_cast<unsigned char>(line[p]))) {
    ++p;
  }
  if (p >= line.size() || line[p] != ':') {
    return false;
  }
  ++p;
  while (p < line.size() && std::isspace(static_cast<unsigned char>(line[p]))) {
    ++p;
  }
  if (p >= line.size() || line[p] != '"') {
    return false;
  }
  ++p;
  std::string val;
  while (p < line.size()) {
    const char c = line[p++];
    if (c == '"') {
      break;
    }
    if (c == '\\' && p < line.size()) {
      val += line[p++];
    } else {
      val += c;
    }
  }
  out = val;
  return true;
}

std::string toLowerAscii(std::string s) {
  for (char& c : s) {
    if (c >= 'A' && c <= 'Z') {
      c = static_cast<char>(c - 'A' + 'a');
    }
  }
  return s;
}

std::string buildReqRef(int effId) {
  std::ostringstream o;
  o << "REQ-";
  const std::string n = std::to_string(effId);
  if (n.size() < 4) {
    o << std::string(4 - n.size(), '0');
  }
  o << n;
  return o.str();
}

std::string digitsOnly(const std::string& s) {
  std::string o;
  for (char c : s) {
    if (c >= '0' && c <= '9') {
      o += c;
    }
  }
  return o;
}

int effectiveId(const std::string& line, int lineIndex1) {
  int id = -1;
  if (parseJsonIntField(line, "id", id) && id > 0) {
    return id;
  }
  return lineIndex1;
}

bool matchesSearch(const std::string& line, int lineIndex1, const std::string& queryRaw) {
  const std::string q = trim(queryRaw);
  if (q.empty()) {
    return true;
  }

  const std::string qLower = toLowerAscii(q);

  const int eff = effectiveId(line, lineIndex1);
  const std::string ref = buildReqRef(eff);
  const std::string refLower = toLowerAscii(ref);

  if (refLower.find(qLower) != std::string::npos) {
    return true;
  }

  const std::string effStr = std::to_string(eff);
  const std::string effLower = toLowerAscii(effStr);
  if (effLower.find(qLower) != std::string::npos) {
    return true;
  }

  std::string studentName;
  if (extractJsonStringField(line, "studentName", studentName)) {
    if (toLowerAscii(studentName).find(qLower) != std::string::npos) {
      return true;
    }
  }

  std::string schoolId;
  if (extractJsonStringField(line, "schoolIdNumber", schoolId)) {
    const std::string sidTrim = trim(schoolId);
    if (!sidTrim.empty()) {
      if (toLowerAscii(sidTrim).find(qLower) != std::string::npos) {
        return true;
      }
    }
  }

  const std::string qDigits = digitsOnly(qLower);
  if (!qDigits.empty()) {
    const std::string refDigits = digitsOnly(ref);
    if (refDigits.find(qDigits) != std::string::npos) {
      return true;
    }
    if (extractJsonStringField(line, "schoolIdNumber", schoolId)) {
      const std::string sidDig = digitsOnly(trim(schoolId));
      if (sidDig.find(qDigits) != std::string::npos) {
        return true;
      }
    }
  }

  return false;
}

} // namespace

int main(int argc, char** argv) {
  if (argc < 3) {
    std::cerr << "usage: search_appointments <db_path> <all|pending|approved|rejected|cancelled|no_show>" << std::endl;
    return 1;
  }

  const std::string path = argv[1];
  const std::string filter = argv[2];

  std::string queryLine;
  std::getline(std::cin, queryLine);
  if (!queryLine.empty() && queryLine.back() == '\r') {
    queryLine.pop_back();
  }
  queryLine = trim(queryLine);

  std::ifstream in(path);
  std::vector<int> nums;
  if (!in) {
    std::cout << "{\"lineNumbers\":[]}\n";
    return 0;
  }

  std::string rawLine;
  int lineIndex1 = 0;
  while (std::getline(in, rawLine)) {
    if (!rawLine.empty() && rawLine.back() == '\r') {
      rawLine.pop_back();
    }
    const std::string line = trim(rawLine);
    if (line.empty()) {
      continue;
    }
    ++lineIndex1;
    if (!matchesFilter(line, filter)) {
      continue;
    }
    if (!matchesSearch(line, lineIndex1, queryLine)) {
      continue;
    }
    nums.push_back(lineIndex1);
  }

  std::cout << "{\"lineNumbers\":[";
  for (std::size_t i = 0; i < nums.size(); ++i) {
    if (i > 0) {
      std::cout << ',';
    }
    std::cout << nums[i];
  }
  std::cout << "]}\n";
  return 0;
}
