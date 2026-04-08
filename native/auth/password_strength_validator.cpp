#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
  if (argc < 2) {
    std::cout << "INVALID:Missing password";
    return 1;
  }

  const std::string password = argv[1];
  bool hasUpper = false;
  bool hasLower = false;
  bool hasDigit = false;
  bool hasSpecial = false;

  for (unsigned char c : password) {
    if (c >= 'A' && c <= 'Z') hasUpper = true;
    else if (c >= 'a' && c <= 'z') hasLower = true;
    else if (c >= '0' && c <= '9') hasDigit = true;
    else hasSpecial = true;
  }

  if (password.size() < 8) {
    std::cout << "INVALID:At least 8 characters";
    return 1;
  }
  if (!hasUpper) {
    std::cout << "INVALID:One uppercase letter required";
    return 1;
  }
  if (!hasLower) {
    std::cout << "INVALID:One lowercase letter required";
    return 1;
  }
  if (!hasDigit) {
    std::cout << "INVALID:One number required";
    return 1;
  }
  if (!hasSpecial) {
    std::cout << "INVALID:One special character required";
    return 1;
  }

  std::cout << "OK";
  return 0;
}
