/**
 * Reads appointment status labels from stdin, one per line:
 *   pending | approved | rejected
 * Writes 0-based indices of rows with status "pending" to stdout,
 * space-separated, then a newline.
 *
 * Build (from repo root):
 *   c++ -std=c++17 -O2 -o native/filter_pending native/filter_pending.cpp
 */

#include <iostream>
#include <string>

int main() {
  std::string line;
  int index = 0;
  bool first_out = true;

  while (std::getline(std::cin, line)) {
    if (line == "pending") {
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
