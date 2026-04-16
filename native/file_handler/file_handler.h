#ifndef FILE_HANDLER_H
#define FILE_HANDLER_H

#include <fstream>
#include <iostream>
#include <string>
#include <chrono>
#include <unordered_map>

/**
 * FileHandler - Centralized file I/O utility for safe and consistent file operations.
 * 
 * Features:
 * - Safe file opening with immediate error validation
 * - Timestamped error logging to logs/error.log
 * - Config file parsing from config/config.txt
 * - Binary file operations with proper type casting
 * - Guaranteed file closure with RAII pattern
 * - Try-catch wrapped operations
 */
class FileHandler {
public:
  /**
   * Initialize the FileHandler and load configuration from config/config.txt
   * Returns true if initialization successful, false if config load fails
   */
  static bool initialize(const std::string& configPath = "../config/config.txt");

  /**
   * Get a configuration value by key
   * Returns empty string if key not found
   */
  static std::string getConfig(const std::string& key);

  /**
   * Set a configuration value (used after initial load)
   */
  static void setConfig(const std::string& key, const std::string& value);

  /**
   * Safe read from file - opens with ifstream, validates, and logs errors
   * Returns true if successful, false on error (error logged to error.log)
   */
  static bool safeRead(const std::string& filePath, std::string& output);

  /**
   * Safe append to file - opens with ofstream and ios::app
   * Logs errors to error.log and returns false on failure
   */
  static bool safeAppend(const std::string& filePath, const std::string& content);

  /**
   * Safe write (overwrite) to file - opens with ofstream and ios::out (overwrites)
   * WARNING: Only use when intentional overwrite is required
   * Logs errors to error.log and returns false on failure
   */
  static bool safeWrite(const std::string& filePath, const std::string& content);

  /**
   * Read binary data from file
   * Uses ios::binary and reads with file.read()
   */
  template <typename T>
  static bool readBinary(const std::string& filePath, T& data) {
    try {
      std::ifstream file(filePath, std::ios::binary);
      if (!file) {
        logError("Failed to open file for binary read: " + filePath);
        return false;
      }
      file.read(reinterpret_cast<char*>(&data), sizeof(T));
      if (!file) {
        logError("Failed to read binary data from: " + filePath);
        file.close();
        return false;
      }
      file.close();
      return true;
    } catch (const std::exception& e) {
      logError("Exception in readBinary: " + std::string(e.what()) + " for file: " + filePath);
      return false;
    }
  }

  /**
   * Write binary data to file (overwrites)
   * Uses ios::binary and writes with file.write()
   */
  template <typename T>
  static bool writeBinary(const std::string& filePath, const T& data) {
    try {
      std::ofstream file(filePath, std::ios::binary | std::ios::out);
      if (!file) {
        logError("Failed to open file for binary write: " + filePath);
        return false;
      }
      file.write(reinterpret_cast<const char*>(&data), sizeof(T));
      if (!file) {
        logError("Failed to write binary data to: " + filePath);
        file.close();
        return false;
      }
      file.close();
      return true;
    } catch (const std::exception& e) {
      logError("Exception in writeBinary: " + std::string(e.what()) + " for file: " + filePath);
      return false;
    }
  }

  /**
   * Log to application log with timestamp
   * Uses ios::app so existing entries are never overwritten
   */
  static void logInfo(const std::string& message);

  /**
   * Log error with timestamp to logs/error.log
   * Uses ios::app so existing entries are never overwritten
   */
  static void logError(const std::string& message);

  /**
   * Get current timestamp in format: YYYY-MM-DD HH:MM:SS
   */
  static std::string getCurrentTimestamp();

private:
  static std::unordered_map<std::string, std::string> config_;
  static bool initialized_;
  static const std::string LOG_DIR;
  static const std::string ERROR_LOG;
  static const std::string APP_LOG;

  /**
   * Internal helper - opens file and validates, returns nullptr on error
   */
  static void logToFile(const std::string& filePath, const std::string& message);

  /**
   * Load configuration from file
   */
  static bool loadConfig(const std::string& configPath);
};

#endif // FILE_HANDLER_H
