#include "file_handler.h"
#include <sstream>
#include <iomanip>
#include <filesystem>

// Static member initialization
std::unordered_map<std::string, std::string> FileHandler::config_;
bool FileHandler::initialized_ = false;
const std::string FileHandler::LOG_DIR = "../logs";
const std::string FileHandler::ERROR_LOG = "../logs/error.log";
const std::string FileHandler::APP_LOG = "../logs/app.log";

bool FileHandler::initialize(const std::string& configPath) {
  try {
    if (!loadConfig(configPath)) {
      logError("Failed to load configuration from: " + configPath);
      return false;
    }
    initialized_ = true;
    logInfo("FileHandler initialized successfully");
    return true;
  } catch (const std::exception& e) {
    logError("Exception during FileHandler initialization: " + std::string(e.what()));
    return false;
  }
}

std::string FileHandler::getConfig(const std::string& key) {
  const auto it = config_.find(key);
  return it != config_.end() ? it->second : std::string();
}

void FileHandler::setConfig(const std::string& key, const std::string& value) {
  config_[key] = value;
}

bool FileHandler::loadConfig(const std::string& configPath) {
  try {
    std::ifstream configFile(configPath);
    if (!configFile) {
      // Config file doesn't exist yet - create with defaults
      logInfo("Config file not found at: " + configPath + ", creating with defaults");
      
      // Set default values
      config_["DATA_DIR"] = "../data";
      config_["DATABASE_FILE"] = "../data/appointments.jsonl";
      config_["MEDICINE_DB"] = "../data/medicine_requests.jsonl";
      config_["PROFILE_DB"] = "../data/student_profiles.jsonl";
      config_["BMI_DB"] = "../data/bmi_records.jsonl";
      config_["NOTIFICATIONS_DB"] = "../data/broadcast_notifications.jsonl";
      config_["BROADCAST_IMAGES_DIR"] = "../data/broadcast_images";
      config_["TIMEZONE"] = "UTC";

      return true;
    }

    config_.clear();
    std::string line;
    int lineNum = 0;
    
    while (std::getline(configFile, line)) {
      ++lineNum;
      
      // Skip empty lines and comments
      if (line.empty() || line[0] == '#') continue;
      
      size_t delimPos = line.find('=');
      if (delimPos == std::string::npos) continue;
      
      std::string key = line.substr(0, delimPos);
      std::string value = line.substr(delimPos + 1);
      
      // Trim whitespace
      key.erase(0, key.find_first_not_of(" \t"));
      key.erase(key.find_last_not_of(" \t") + 1);
      value.erase(0, value.find_first_not_of(" \t"));
      value.erase(value.find_last_not_of(" \t") + 1);
      
      if (!key.empty()) {
        config_[key] = value;
      }
    }
    configFile.close();
    
    logInfo("Configuration loaded successfully from: " + configPath);
    return true;
  } catch (const std::exception& e) {
    logError("Exception loading config: " + std::string(e.what()));
    return false;
  }
}

bool FileHandler::safeRead(const std::string& filePath, std::string& output) {
  try {
    std::ifstream file(filePath);
    if (!file) {
      logError("Failed to open file for reading: " + filePath);
      return false;
    }

    std::stringstream buffer;
    buffer << file.rdbuf();
    if (!file) {
      logError("Failed to read from file: " + filePath);
      file.close();
      return false;
    }
    
    output = buffer.str();
    file.close();
    return true;
  } catch (const std::exception& e) {
    logError("Exception in safeRead: " + std::string(e.what()) + " for file: " + filePath);
    return false;
  }
}

bool FileHandler::safeAppend(const std::string& filePath, const std::string& content) {
  try {
    std::ofstream file(filePath, std::ios::app);
    if (!file) {
      logError("Failed to open file for appending: " + filePath);
      return false;
    }

    file << content;
    if (!file) {
      logError("Failed to write to file (append): " + filePath);
      file.close();
      return false;
    }

    file.close();
    return true;
  } catch (const std::exception& e) {
    logError("Exception in safeAppend: " + std::string(e.what()) + " for file: " + filePath);
    return false;
  }
}

bool FileHandler::safeWrite(const std::string& filePath, const std::string& content) {
  try {
    // Use ios::out flag which explicitly overwrites
    std::ofstream file(filePath, std::ios::out);
    if (!file) {
      logError("Failed to open file for writing (overwrite): " + filePath);
      return false;
    }

    file << content;
    if (!file) {
      logError("Failed to write to file (overwrite): " + filePath);
      file.close();
      return false;
    }

    file.close();
    return true;
  } catch (const std::exception& e) {
    logError("Exception in safeWrite: " + std::string(e.what()) + " for file: " + filePath);
    return false;
  }
}

std::string FileHandler::getCurrentTimestamp() {
  auto now = std::chrono::system_clock::now();
  auto time = std::chrono::system_clock::to_time_t(now);
  std::tm tm{};
  
#if defined(_WIN32)
  localtime_s(&tm, &time);
#else
  localtime_r(&time, &tm);
#endif

  std::ostringstream oss;
  oss << std::put_time(&tm, "%Y-%m-%d %H:%M:%S");
  return oss.str();
}

void FileHandler::logToFile(const std::string& filePath, const std::string& message) {
  try {
    std::ofstream logFile(filePath, std::ios::app);
    if (!logFile) {
      // Fallback to stderr if logging fails
      std::cerr << "[" << getCurrentTimestamp() << "] " << message << std::endl;
      return;
    }

    logFile << "[" << getCurrentTimestamp() << "] " << message << std::endl;
    if (!logFile) {
      std::cerr << "[" << getCurrentTimestamp() << "] Failed to write to log file: " << filePath << std::endl;
    }
    logFile.close();
  } catch (const std::exception& e) {
    std::cerr << "[" << getCurrentTimestamp() << "] Exception during logging: " << e.what() << std::endl;
  }
}

void FileHandler::logInfo(const std::string& message) {
  logToFile(APP_LOG, "[INFO] " + message);
}

void FileHandler::logError(const std::string& message) {
  logToFile(ERROR_LOG, "[ERROR] " + message);
  // Also print to stderr for visibility
  std::cerr << "[" << getCurrentTimestamp() << "] [ERROR] " << message << std::endl;
}
