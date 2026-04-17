#include "AppointmentRequest.h"

#include <algorithm>
#include <cctype>
#include <exception>
#include <sstream>

namespace {

std::string escapeJson(const std::string& value) {
  std::ostringstream output;
  for (char ch : value) {
    switch (ch) {
      case '"': output << "\\\""; break;
      case '\\': output << "\\\\"; break;
      case '\b': output << "\\b"; break;
      case '\f': output << "\\f"; break;
      case '\n': output << "\\n"; break;
      case '\r': output << "\\r"; break;
      case '\t': output << "\\t"; break;
      default:
        output << ch;
        break;
    }
  }
  return output.str();
}

int parseStandardTime(const std::string& time) {
  std::string normalized;
  for (char ch : time) {
    if (ch != '\r' && ch != '\n') {
      normalized.push_back(ch);
    }
  }

  const auto separator = normalized.find(' ');
  if (separator == std::string::npos) {
    return -1;
  }

  const std::string clock = normalized.substr(0, separator);
  const std::string period = normalized.substr(separator + 1);
  const auto colon = clock.find(':');
  if (colon == std::string::npos) {
    return -1;
  }

  int hour = -1;
  int minute = -1;
  try {
    hour = std::stoi(clock.substr(0, colon));
    minute = std::stoi(clock.substr(colon + 1));
  } catch (const std::exception&) {
    return -1;
  }

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59 || period.size() < 2) {
    return -1;
  }

  std::string upperPeriod = period.substr(0, 2);
  std::transform(upperPeriod.begin(), upperPeriod.end(), upperPeriod.begin(), [](unsigned char ch) {
    return static_cast<char>(std::toupper(ch));
  });

  int hour24 = hour;
  if (upperPeriod == "AM") {
    if (hour == 12) {
      hour24 = 0;
    }
  } else if (upperPeriod == "PM") {
    if (hour != 12) {
      hour24 += 12;
    }
  } else {
    return -1;
  }

  return hour24 * 60 + minute;
}

}

AppointmentRequest::AppointmentRequest(
  std::string studentName,
  std::string email,
  std::string address,
  std::string reason,
  std::string otherReasonDetail,
  std::string preferredDate,
  std::string preferredTime
) :
  studentName_(std::move(studentName)),
  email_(std::move(email)),
  address_(std::move(address)),
  reason_(std::move(reason)),
  otherReasonDetail_(std::move(otherReasonDetail)),
  preferredDate_(std::move(preferredDate)),
  preferredTime_(std::move(preferredTime))
{
}

const std::string& AppointmentRequest::getStudentName() const {
  return studentName_;
}

const std::string& AppointmentRequest::getEmail() const {
  return email_;
}

const std::string& AppointmentRequest::getAddress() const {
  return address_;
}

const std::string& AppointmentRequest::getReason() const {
  return reason_;
}

const std::string& AppointmentRequest::getOtherReasonDetail() const {
  return otherReasonDetail_;
}

const std::string& AppointmentRequest::getPreferredDate() const {
  return preferredDate_;
}

const std::string& AppointmentRequest::getPreferredTime() const {
  return preferredTime_;
}

bool AppointmentRequest::isValidEmail(const std::string& email) {
  const auto atPos = email.find('@');
  const auto dotPos = email.find('.', atPos == std::string::npos ? 0 : atPos + 1);
  return atPos != std::string::npos && dotPos != std::string::npos;
}

bool AppointmentRequest::isWithinClinicHours(const std::string& time) {
  const int minutes = parseStandardTime(time);
  if (minutes < 0) {
    return false;
  }
  const int earliest = 8 * 60;
  const int latest = 16 * 60;
  return minutes >= earliest && minutes <= latest;
}

bool AppointmentRequest::isValid() const {
  const bool hasAdditionalReason = reason_ != "others" || !otherReasonDetail_.empty();
  return !studentName_.empty()
    && isValidEmail(email_)
    && !address_.empty()
    && !reason_.empty()
    && hasAdditionalReason
    && !preferredDate_.empty()
    && isWithinClinicHours(preferredTime_);
}

std::string AppointmentRequest::serialize() const {
  return "{\"studentName\":\"" + escapeJson(studentName_) +
    "\",\"email\":\"" + escapeJson(email_) +
    "\",\"address\":\"" + escapeJson(address_) +
    "\",\"reason\":\"" + escapeJson(reason_) +
    "\",\"otherReasonDetail\":\"" + escapeJson(otherReasonDetail_) +
    "\",\"preferredDate\":\"" + escapeJson(preferredDate_) +
    "\",\"preferredTime\":\"" + escapeJson(preferredTime_) + "\"}";
}

std::string AppointmentRequest::serializeForDatabase(
  int id,
  const std::string& status,
  const std::string& adminNote,
  const std::string& submittedAt,
  const std::string& reviewedAt
) const {
  const std::string core = serialize();
  if (core.size() < 2) {
    return core;
  }
  return "{\"id\":" + std::to_string(id) +
    ",\"status\":\"" + escapeJson(status) +
    "\",\"adminNote\":\"" + escapeJson(adminNote) +
    "\",\"submittedAt\":\"" + escapeJson(submittedAt) +
    "\",\"reviewedAt\":\"" + escapeJson(reviewedAt) + "\"," +
    core.substr(1);
}
