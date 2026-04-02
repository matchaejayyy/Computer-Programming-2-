#include <chrono>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

namespace {
struct BmiEntry {
  std::string studentId;
  long long timestamp;
  double weightKg;
  double heightM;
  double bmi;
  std::string category;
};

std::string trim(const std::string &value) {
  const char *spaces = " \t\r\n";
  const auto start = value.find_first_not_of(spaces);
  if (start == std::string::npos) {
    return "";
  }
  const auto end = value.find_last_not_of(spaces);
  return value.substr(start, end - start + 1);
}

double toDouble(const std::string &value, bool &ok) {
  std::istringstream stream(value);
  double number = 0.0;
  stream >> number;
  ok = !stream.fail() && stream.eof();
  return number;
}

std::string categoryFor(double bmi) {
  if (bmi < 18.5) {
    return "Underweight";
  }
  if (bmi < 25.0) {
    return "Normal";
  }
  return "Overweight";
}

std::string formatDouble(double value, int precision = 2) {
  std::ostringstream stream;
  stream << std::fixed << std::setprecision(precision) << value;
  return stream.str();
}

std::vector<BmiEntry> readEntries(const std::string &dbPath) {
  std::vector<BmiEntry> entries;
  std::ifstream file(dbPath);
  if (!file.is_open()) {
    return entries;
  }

  std::string line;
  while (std::getline(file, line)) {
    if (line.empty()) {
      continue;
    }
    std::istringstream stream(line);
    std::string studentId;
    std::string timestamp;
    std::string weightKg;
    std::string heightM;
    std::string bmi;
    std::string category;

    if (!std::getline(stream, studentId, '\t')) continue;
    if (!std::getline(stream, timestamp, '\t')) continue;
    if (!std::getline(stream, weightKg, '\t')) continue;
    if (!std::getline(stream, heightM, '\t')) continue;
    if (!std::getline(stream, bmi, '\t')) continue;
    if (!std::getline(stream, category)) continue;

    bool okTimestamp = false;
    bool okWeight = false;
    bool okHeight = false;
    bool okBmi = false;

    const long long parsedTimestamp =
        static_cast<long long>(toDouble(timestamp, okTimestamp));
    const double parsedWeight = toDouble(weightKg, okWeight);
    const double parsedHeight = toDouble(heightM, okHeight);
    const double parsedBmi = toDouble(bmi, okBmi);
    if (!okTimestamp || !okWeight || !okHeight || !okBmi) {
      continue;
    }

    entries.push_back(
        {studentId, parsedTimestamp, parsedWeight, parsedHeight, parsedBmi, category});
  }
  return entries;
}

void appendEntry(const std::string &dbPath, const BmiEntry &entry) {
  std::ofstream file(dbPath, std::ios::app);
  file << entry.studentId << "\t" << entry.timestamp << "\t"
       << formatDouble(entry.weightKg, 4) << "\t" << formatDouble(entry.heightM, 4) << "\t"
       << formatDouble(entry.bmi, 2) << "\t" << entry.category << "\n";
}

long long unixNow() {
  return std::chrono::duration_cast<std::chrono::seconds>(
             std::chrono::system_clock::now().time_since_epoch())
      .count();
}

BmiEntry latestFor(const std::vector<BmiEntry> &entries, const std::string &studentId) {
  BmiEntry latest{"", 0, 0, 0, 0, ""};
  for (const auto &entry : entries) {
    if (entry.studentId != studentId) continue;
    if (entry.timestamp >= latest.timestamp) {
      latest = entry;
    }
  }
  return latest;
}

}  // namespace

int main() {
  std::string action;
  std::string studentId;
  std::string weightRaw;
  std::string heightRaw;

  std::string line;
  while (std::getline(std::cin, line)) {
    const auto separator = line.find('=');
    if (separator == std::string::npos) continue;
    const std::string key = trim(line.substr(0, separator));
    const std::string value = trim(line.substr(separator + 1));

    if (key == "action") action = value;
    if (key == "studentId") studentId = value;
    if (key == "weightKg") weightRaw = value;
    if (key == "height") heightRaw = value;
  }

  const std::string dbPath = "native/bmi/bmi.db";
  const auto entries = readEntries(dbPath);
  const long long now = unixNow();

  if (action != "read" && action != "update") {
    std::cout << "status=error\nmessage=Invalid action\n";
    return 1;
  }
  if (studentId.empty()) {
    std::cout << "status=error\nmessage=Missing studentId\n";
    return 1;
  }

  const BmiEntry latest = latestFor(entries, studentId);

  if (action == "read") {
    std::cout << "status=success\n";
    if (latest.timestamp > 0) {
      std::cout << "bmi=" << formatDouble(latest.bmi, 2) << "\n";
      std::cout << "category=" << latest.category << "\n";
      std::cout << "weightKg=" << formatDouble(latest.weightKg, 2) << "\n";
      std::cout << "heightM=" << formatDouble(latest.heightM, 2) << "\n";
      std::cout << "updatedAt=" << latest.timestamp << "\n";
    }
    std::cout << "remainingAttempts=999\n";
    std::cout << "resetAt=0\n";
    return 0;
  }

  bool okWeight = false;
  bool okHeight = false;
  const double weightKg = toDouble(weightRaw, okWeight);
  double height = toDouble(heightRaw, okHeight);
  if (!okWeight || !okHeight || weightKg <= 0 || height <= 0) {
    std::cout << "status=error\nmessage=Weight and height must be positive numbers.\n";
    return 1;
  }

  if (height > 3.0) {
    height = height / 100.0;
  }

  const double bmi = weightKg / (height * height);
  const std::string category = categoryFor(bmi);
  appendEntry(dbPath, {studentId, now, weightKg, height, bmi, category});

  std::cout << "status=success\n";
  std::cout << "message=BMI updated.\n";
  std::cout << "bmi=" << formatDouble(bmi, 2) << "\n";
  std::cout << "category=" << category << "\n";
  std::cout << "weightKg=" << formatDouble(weightKg, 2) << "\n";
  std::cout << "heightM=" << formatDouble(height, 2) << "\n";
  std::cout << "updatedAt=" << now << "\n";
  std::cout << "remainingAttempts=999\n";
  std::cout << "resetAt=0\n";

  return 0;
}
