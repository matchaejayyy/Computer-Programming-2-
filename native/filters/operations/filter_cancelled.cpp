/**
 * Reads status labels from stdin (pending | approved | rejected | cancelled), one per line.
 * Writes 0-based indices of "cancelled" rows to stdout, space-separated.
 *
 * Build:
 *   c++ -std=c++17 -O2 -o native/filters/filter_cancelled native/filters/filter_cancelled.cpp
 */

#include <iostream>
#include <string>

int main() {
  std::string line;
  int index = 0;
  bool first_out = true;

  while (std::getline(std::cin, line)) {
    if (line == "cancelled") {
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
