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

}  // namespace

int main(int argc, char* argv[]) {
  if (argc < 2) {
    std::cerr << "usage: list_broadcast_notifications <db_path>" << std::endl;
    return 1;
  }

  const std::string dbPath = argv[1];
  std::ifstream in(dbPath);

  std::vector<std::string> rows;
  if (in) {
    std::string line;
    while (std::getline(in, line)) {
      line = trim(line);
      if (!line.empty()) {
        rows.push_back(line);
      }
    }
  }

  std::cout << "{\"notifications\":[";
  for (std::size_t i = 0; i < rows.size(); ++i) {
    if (i > 0) std::cout << ",";
    std::cout << rows[i];
  }
  std::cout << "]}" << std::endl;
  return 0;
}
