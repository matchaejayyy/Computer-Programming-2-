/**
 * Reads status labels from stdin (pending | approved | rejected), one per line.
 * Writes 0-based indices of "approved" rows to stdout, space-separated.
 *
 * Build:
 *   c++ -std=c++17 -O2 -o native/filters/filter_accepted native/filters/filter_accepted.cpp
 */

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
