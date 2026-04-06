

#include <cctype>
#include <fstream>
#include <iostream>
#include <sstream>
#include <utility>
#include <string>
#include <vector>

namespace {

std::string readFile(const std::string& path) {
  std::ifstream in(path, std::ios::in | std::ios::binary);
  if (!in) {
    return "";
  }
  std::ostringstream ss;
  ss << in.rdbuf();
  return ss.str();
}

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

std::string toLowerAscii(std::string s) {
  for (char& c : s) {
    if (static_cast<unsigned char>(c) <= 127) {
      c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
    }
  }
  return s;
}

// {true, value} if a JSON string was found; {false, ""} if missing or malformed.
std::pair<bool, std::string> jsonStringValue(const std::string& obj, const std::string& key) {
  const std::string needle = "\"" + key + "\"";
  std::size_t p = obj.find(needle);
  if (p == std::string::npos) {
    return {false, ""};
  }
  p = obj.find(':', p + needle.size());
  if (p == std::string::npos) {
    return {false, ""};
  }
  ++p;
  while (p < obj.size() && std::isspace(static_cast<unsigned char>(obj[p]))) {
    ++p;
  }
  if (p >= obj.size() || obj[p] != '"') {
    return {false, ""};
  }
  ++p;
  std::string out;
  while (p < obj.size()) {
    if (obj[p] == '\\') {
      ++p;
      if (p < obj.size()) {
        out += obj[p++];
      }
      continue;
    }
    if (obj[p] == '"') {
      break;
    }
    out += obj[p++];
  }
  return {true, out};
}

// {true, v} if key holds JSON true/false; {false, false} if missing or not a bool.
std::pair<bool, bool> jsonBoolValue(const std::string& obj, const std::string& key) {
  const std::string needle = "\"" + key + "\"";
  std::size_t p = obj.find(needle);
  if (p == std::string::npos) {
    return {false, false};
  }
  p = obj.find(':', p + needle.size());
  if (p == std::string::npos) {
    return {false, false};
  }
  ++p;
  while (p < obj.size() && std::isspace(static_cast<unsigned char>(obj[p]))) {
    ++p;
  }
  if (p + 4 <= obj.size() && obj.substr(p, 4) == "true") {
    return {true, true};
  }
  if (p + 5 <= obj.size() && obj.substr(p, 5) == "false") {
    return {true, false};
  }
  return {false, false};
}

std::string jsonEscape(const std::string& s) {
  std::string out;
  out.reserve(s.size() + 8);
  for (char c : s) {
    if (c == '\\' || c == '"') {
      out += '\\';
    }
    out += c;
  }
  return out;
}

std::vector<std::string> splitTopLevelObjects(const std::string& text) {
  std::vector<std::string> out;
  std::size_t pos = 0;
  while (pos < text.size()) {
    std::size_t ob = text.find('{', pos);
    if (ob == std::string::npos) {
      break;
    }
    int depth = 0;
    std::size_t j = ob;
    for (; j < text.size(); ++j) {
      if (text[j] == '{') {
        ++depth;
      } else if (text[j] == '}') {
        --depth;
        if (depth == 0) {
          out.push_back(text.substr(ob, j - ob + 1));
          pos = j + 1;
          break;
        }
      }
    }
    if (depth != 0) {
      break;
    }
  }
  return out;
}

bool containsQuery(
    const std::string& studentId,
    const std::string& name,
    const std::string& email,
    const std::string& schoolId,
    const std::string& qLower) {
  if (qLower.empty()) {
    return true;
  }
  const std::string hay = toLowerAscii(studentId + " " + name + " " + email + " " + schoolId);
  return hay.find(qLower) != std::string::npos;
}

void emitList(const std::string& path, const std::string& queryRaw) {
  const std::string raw = readFile(path);
  const std::string qLower = toLowerAscii(trim(queryRaw));

  if (trim(raw).empty()) {
    std::cout << "{\"success\":true,\"patients\":[],\"total\":0}\n";
    return;
  }

  const std::vector<std::string> objects = splitTopLevelObjects(raw);
  std::ostringstream patients;
  patients << '[';
  bool first = true;
  int total = 0;

  for (const std::string& obj : objects) {
    const auto sidR = jsonStringValue(obj, "studentId");
    const std::string sid = sidR.first ? sidR.second : "";
    const auto nameR = jsonStringValue(obj, "name");
    const std::string name = nameR.first ? nameR.second : "";
    const auto emailR = jsonStringValue(obj, "email");
    const std::string email = emailR.first ? emailR.second : "";
    const auto schoolR = jsonStringValue(obj, "schoolIdNumber");
    const std::string school = schoolR.first ? schoolR.second : "";
    if (!containsQuery(sid, name, email, school, qLower)) {
      continue;
    }
    ++total;
    if (!first) {
      patients << ',';
    }
    first = false;
    patients << '{'
             << "\"studentId\":\"" << jsonEscape(sid) << "\","
             << "\"name\":\"" << jsonEscape(name) << "\","
             << "\"email\":\"" << jsonEscape(email) << "\","
             << "\"schoolIdNumber\":\"" << jsonEscape(school) << "\""
             << '}';
  }

  patients << ']';
  std::cout << "{\"success\":true,\"patients\":" << patients.str() << ",\"total\":" << total
            << "}\n";
}

void emitGet(const std::string& path, const std::string& wantId) {
  const std::string raw = readFile(path);
  if (trim(raw).empty()) {
    std::cout << "{\"success\":true,\"found\":false}\n";
    return;
  }

  for (const std::string& obj : splitTopLevelObjects(raw)) {
    const auto sidR = jsonStringValue(obj, "studentId");
    if (!sidR.first || sidR.second != wantId) {
      continue;
    }

    const auto nameR = jsonStringValue(obj, "name");
    const std::string name = nameR.first ? nameR.second : "";
    const auto birthdayR = jsonStringValue(obj, "birthday");
    const std::string birthday = birthdayR.first ? birthdayR.second : "";
    const auto genderR = jsonStringValue(obj, "gender");
    const std::string gender = genderR.first ? genderR.second : "";
    const auto symptomsR = jsonStringValue(obj, "symptomsOrCondition");
    const std::string symptoms = symptomsR.first ? symptomsR.second : "";
    const auto contactR = jsonStringValue(obj, "contactNumber");
    const std::string contact = contactR.first ? contactR.second : "";
    const auto emailR = jsonStringValue(obj, "email");
    const std::string email = emailR.first ? emailR.second : "";
    const auto schoolR = jsonStringValue(obj, "schoolIdNumber");
    const std::string school = schoolR.first ? schoolR.second : "";
    const auto beR = jsonBoolValue(obj, "birthdayEdited");
    const bool be = beR.first ? beR.second : false;
    const auto geR = jsonBoolValue(obj, "genderEdited");
    const bool ge = geR.first ? geR.second : false;

    std::cout << "{\"success\":true,\"found\":true,\"profile\":{"
              << "\"studentId\":\"" << jsonEscape(sidR.second) << "\","
              << "\"name\":\"" << jsonEscape(name) << "\","
              << "\"birthday\":\"" << jsonEscape(birthday) << "\","
              << "\"gender\":\"" << jsonEscape(gender) << "\","
              << "\"symptomsOrCondition\":\"" << jsonEscape(symptoms) << "\","
              << "\"contactNumber\":\"" << jsonEscape(contact) << "\","
              << "\"email\":\"" << jsonEscape(email) << "\","
              << "\"schoolIdNumber\":\"" << jsonEscape(school) << "\","
              << "\"birthdayEdited\":" << (be ? "true" : "false") << ","
              << "\"genderEdited\":" << (ge ? "true" : "false")
              << "}}\n";
    return;
  }

  std::cout << "{\"success\":true,\"found\":false}\n";
}

} // namespace

int main(int argc, char** argv) {
  if (argc < 3) {
    std::cerr << "usage: student_registry_tool <json_path> list [query]\n"
                 "       student_registry_tool <json_path> get <studentId>\n";
    return 1;
  }

  const std::string path = argv[1];
  const std::string mode = argv[2];

  if (mode == "list") {
    const std::string query = argc >= 4 ? argv[3] : "";
    emitList(path, query);
    return 0;
  }

  if (mode == "get") {
    if (argc < 4) {
      std::cerr << "usage: student_registry_tool <json_path> get <studentId>\n";
      return 1;
    }
    emitGet(path, argv[3]);
    return 0;
  }

  std::cerr << "unknown mode: use list or get\n";
  return 1;
}
