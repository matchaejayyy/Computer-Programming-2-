#include <cctype>
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

int parseBroadcastNumber(const std::string& id) {
  constexpr char prefix[] = "BCAST-";
  if (id.rfind(prefix, 0) != 0) return -1;
  const std::string numeric = id.substr(sizeof(prefix) - 1);
  if (numeric.empty()) return -1;
  for (char ch : numeric) {
    if (!std::isdigit(static_cast<unsigned char>(ch))) return -1;
  }
  try {
    return std::stoi(numeric);
  } catch (...) {
    return -1;
  }
}

int getNextBroadcastNumber(const std::string& path) {
  std::ifstream in(path);
  if (!in) return 1;

  int maxId = 0;
  std::string line;
  while (std::getline(in, line)) {
    const std::string raw = trim(line);
    if (raw.empty()) continue;

    const int value = parseBroadcastNumber(extractJsonStringField(raw, "id"));
    if (value > maxId) maxId = value;
  }
  return maxId + 1;
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
  while (lines.size() < 6) lines.push_back("");

  const std::string title = trim(lines[0]);
  const std::string message = trim(lines[1]);
  const std::string createdAt = trim(lines[2]);
  const std::string attachmentName = trim(lines[3]);
  const std::string attachmentPath = trim(lines[4]);
  const std::string attachmentMimeType = trim(lines[5]);

  if (title.empty() || message.empty() || createdAt.empty()) {
    std::cerr << "title, message, and createdAt are required." << std::endl;
    return 1;
  }

  const int next = getNextBroadcastNumber(dbPath);
  const std::string id = "BCAST-" + pad4(next);

  std::ostringstream row;
  row << "{\"id\":\"" << jsonEscape(id) << "\","
      << "\"title\":\"" << jsonEscape(title) << "\","
      << "\"message\":\"" << jsonEscape(message) << "\","
      << "\"createdAt\":\"" << jsonEscape(createdAt) << "\"";
  if (!attachmentName.empty() && !attachmentPath.empty() && !attachmentMimeType.empty()) {
    row << ",\"attachmentName\":\"" << jsonEscape(attachmentName) << "\""
        << ",\"attachmentPath\":\"" << jsonEscape(attachmentPath) << "\""
        << ",\"attachmentMimeType\":\"" << jsonEscape(attachmentMimeType) << "\"";
  }
  row << "}";

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
