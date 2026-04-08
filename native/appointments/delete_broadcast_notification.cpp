#include <cctype>
#include <cstddef>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

namespace {

std::string trim(std::string s) {
  const auto is_ws = [](unsigned char c) { return std::isspace(c) != 0; };
  while (!s.empty() && is_ws(static_cast<unsigned char>(s.front()))) s.erase(s.begin());
  while (!s.empty() && is_ws(static_cast<unsigned char>(s.back()))) s.pop_back();
  return s;
}

std::string extractJsonStringField(const std::string& row, const std::string& key) {
  const std::string prefix = "\"" + key + "\":\"";
  const auto start = row.find(prefix);
  if (start == std::string::npos) return "";

  std::string out;
  bool escaping = false;
  for (std::size_t i = start + prefix.size(); i < row.size(); ++i) {
    const char ch = row[i];
    if (escaping) {
      switch (ch) {
        case 'n': out.push_back('\n'); break;
        case 'r': out.push_back('\r'); break;
        case 't': out.push_back('\t'); break;
        case 'b': out.push_back('\b'); break;
        case 'f': out.push_back('\f'); break;
        default: out.push_back(ch); break;
      }
      escaping = false;
      continue;
    }
    if (ch == '\\') {
      escaping = true;
      continue;
    }
    if (ch == '"') {
      return out;
    }
    out.push_back(ch);
  }
  return "";
}

}  // namespace

int main(int argc, char* argv[]) {
  if (argc < 2) {
    std::cerr << "usage: delete_broadcast_notification <db_path>" << std::endl;
    return 1;
  }

  const std::string dbPath = argv[1];
  std::string id;
  std::getline(std::cin, id);
  id = trim(id);
  if (id.empty()) {
    std::cerr << "id is required." << std::endl;
    return 1;
  }

  std::ifstream in(dbPath);
  if (!in) {
    std::cerr << "cannot open db file." << std::endl;
    return 1;
  }

  std::vector<std::string> rows;
  std::string line;
  bool removed = false;
  while (std::getline(in, line)) {
    const std::string raw = trim(line);
    if (raw.empty()) continue;
    if (!removed && extractJsonStringField(raw, "id") == id) {
      removed = true;
      continue;
    }
    rows.push_back(raw);
  }
  in.close();

  if (!removed) {
    std::cerr << "broadcast not found." << std::endl;
    return 1;
  }

  std::ofstream out(dbPath, std::ios::trunc);
  if (!out) {
    std::cerr << "cannot open db file for write." << std::endl;
    return 1;
  }
  for (const auto& row : rows) {
    out << row << '\n';
  }

  std::cout << "{\"success\":true}" << std::endl;
  return 0;
}
