#include <iostream>
#include <string>

int main() {
  std::string line;
  int index = 0;
  bool first_out = true;

  while (std::getline(std::cin, line)) {
    if (line == "approved") {
      if (!first_out) {
        std::cout << ' ';
      }
      std::cout << index;
      first_out = false;
    }
    ++index;
  }

  std::cout << '\n';
  return 0;
}
