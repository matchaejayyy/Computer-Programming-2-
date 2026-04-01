#ifndef APPOINTMENT_REQUEST_H
#define APPOINTMENT_REQUEST_H

#include <string>

class AppointmentRequest {
public:
  AppointmentRequest(
    std::string studentName,
    std::string email,
    std::string address,
    std::string reason,
    std::string otherReasonDetail,
    std::string preferredDate,
    std::string preferredTime
  );

  const std::string& getStudentName() const;
  const std::string& getEmail() const;
  const std::string& getAddress() const;
  const std::string& getReason() const;
  const std::string& getOtherReasonDetail() const;
  const std::string& getPreferredDate() const;
  const std::string& getPreferredTime() const;

  bool isValid() const;
  std::string serialize() const;

  static bool isValidEmail(const std::string& email);
  static bool isWithinClinicHours(const std::string& time);

private:
  std::string studentName_;
  std::string email_;
  std::string address_;
  std::string reason_;
  std::string otherReasonDetail_;
  std::string preferredDate_;
  std::string preferredTime_;
};

#endif // APPOINTMENT_REQUEST_H
