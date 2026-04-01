#include "AppointmentRequest.h"

#include <algorithm>
#include <cctype>
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

  const int hour = std::stoi(clock.substr(0, colon));
  const int minute = std::stoi(clock.substr(colon + 1));
  const std::string upperPeriod = period.substr(0, 2);

  int hour24 = hour;
  if (upperPeriod == "AM" || upperPeriod == "am") {
    if (hour == 12) {
      hour24 = 0;
    }
  } else if (upperPeriod == "PM" || upperPeriod == "pm") {
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
