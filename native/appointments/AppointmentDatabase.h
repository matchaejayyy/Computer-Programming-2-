#ifndef APPOINTMENT_DATABASE_H
#define APPOINTMENT_DATABASE_H

#include <cstddef>
#include <string>

#include "AppointmentRequest.h"

class AppointmentDatabase {
public:
  explicit AppointmentDatabase(std::string path);

  bool append(const AppointmentRequest& request);
  std::size_t totalRequests() const;

private:
  void loadExistingCount();

  std::string path_;
  std::size_t count_;
};

#endif // APPOINTMENT_DATABASE_H
