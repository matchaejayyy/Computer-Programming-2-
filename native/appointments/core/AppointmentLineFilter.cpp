#include "AppointmentLineFilter.h"

namespace {

bool hasToken(const std::string& line, const char* token) {
  return line.find(token) != std::string::npos;
}

class AllLinesFilter : public AppointmentLineFilter {
public:
  bool matches(const std::string& /*line*/) const override {
    return true;
  }
};

class PendingLineFilter : public AppointmentLineFilter {
public:
  bool matches(const std::string& line) const override {
    const bool hasPending = hasToken(line, "\"status\":\"pending\"");
    const bool hasStatusKey = hasToken(line, "\"status\":");
    return !hasStatusKey || hasPending;
  }
};

class ApprovedLineFilter : public AppointmentLineFilter {
public:
  bool matches(const std::string& line) const override {
    return hasToken(line, "\"status\":\"approved\"");
  }
};

class RejectedLineFilter : public AppointmentLineFilter {
public:
  bool matches(const std::string& line) const override {
    return hasToken(line, "\"status\":\"rejected\"");
  }
};

class CancelledLineFilter : public AppointmentLineFilter {
public:
  bool matches(const std::string& line) const override {
    return hasToken(line, "\"status\":\"cancelled\"");
  }
};

class NoShowLineFilter : public AppointmentLineFilter {
public:
  bool matches(const std::string& line) const override {
    return hasToken(line, "\"status\":\"no_show\"");
  }
};

class CompletedLineFilter : public AppointmentLineFilter {
public:
  bool matches(const std::string& line) const override {
    return hasToken(line, "\"status\":\"completed\"");
  }
};

} // namespace

AppointmentLineFilter* createAppointmentLineFilterRaw(const std::string& name) {
  if (name == "all") {
    return new AllLinesFilter();
  }
  if (name == "pending") {
    return new PendingLineFilter();
  }
  if (name == "approved") {
    return new ApprovedLineFilter();
  }
  if (name == "rejected") {
    return new RejectedLineFilter();
  }
  if (name == "cancelled") {
    return new CancelledLineFilter();
  }
  if (name == "no_show") {
    return new NoShowLineFilter();
  }
  if (name == "completed") {
    return new CompletedLineFilter();
  }
  return nullptr;
}
