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

std::string buildRow(
    const std::string& id,
    const std::string& title,
    const std::string& message,
    const std::string& createdAt,
    const std::string& attachmentName,
    const std::string& attachmentPath,
    const std::string& attachmentMimeType) {
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
  return row.str();
}

}  // namespace

int main(int argc, char* argv[]) {
  if (argc < 2) {
    std::cerr << "usage: update_broadcast_notification <db_path>" << std::endl;
    return 1;
  }

  const std::string dbPath = argv[1];
  std::vector<std::string> lines;
  std::string line;
  while (std::getline(std::cin, line)) {
    lines.push_back(line);
  }
  while (lines.size() < 7) lines.push_back("");

  const std::string id = trim(lines[0]);
  const std::string title = trim(lines[1]);
  const std::string message = trim(lines[2]);
  const std::string attachmentNameInput = trim(lines[3]);
  const std::string attachmentPathInput = trim(lines[4]);
  const std::string attachmentMimeTypeInput = trim(lines[5]);
  const bool removeAttachment = trim(lines[6]) == "1";
  if (id.empty() || title.empty() || message.empty()) {
    std::cerr << "id, title, and message are required." << std::endl;
    return 1;
  }

  std::ifstream in(dbPath);
  if (!in) {
    std::cerr << "cannot open db file." << std::endl;
    return 1;
  }

  std::vector<std::string> rows;
  bool updated = false;
  std::string updatedRow;
  while (std::getline(in, line)) {
    const std::string raw = trim(line);
    if (raw.empty()) continue;

    const std::string rowId = extractJsonStringField(raw, "id");
    if (!updated && rowId == id) {
      const std::string createdAt = extractJsonStringField(raw, "createdAt");
      if (createdAt.empty()) {
        std::cerr << "invalid row format." << std::endl;
        return 1;
      }
      std::string attachmentName = extractJsonStringField(raw, "attachmentName");
      std::string attachmentPath = extractJsonStringField(raw, "attachmentPath");
      std::string attachmentMimeType = extractJsonStringField(raw, "attachmentMimeType");
      if (removeAttachment) {
        attachmentName.clear();
        attachmentPath.clear();
        attachmentMimeType.clear();
      } else if (!attachmentNameInput.empty() && !attachmentPathInput.empty() &&
                 !attachmentMimeTypeInput.empty()) {
        attachmentName = attachmentNameInput;
        attachmentPath = attachmentPathInput;
        attachmentMimeType = attachmentMimeTypeInput;
      }
      updatedRow = buildRow(
          id,
          title,
          message,
          createdAt,
          attachmentName,
          attachmentPath,
          attachmentMimeType);
      rows.push_back(updatedRow);
      updated = true;
      continue;
    }
    rows.push_back(raw);
  }
  in.close();

  if (!updated) {
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

  std::cout << updatedRow << std::endl;
  return 0;
}
