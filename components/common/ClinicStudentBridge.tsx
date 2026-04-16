"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ClinicStudentContextValue = {
  studentId: string;
  appointmentRefreshKey: number;
  notifyAppointmentsChanged: () => void;
};

const ClinicStudentContext = createContext<ClinicStudentContextValue>({
  studentId: "",
  appointmentRefreshKey: 0,
  notifyAppointmentsChanged: () => {},
});

export function ClinicStudentBridge({
  studentId,
  children,
}: {
  studentId: string;
  children: React.ReactNode;
}) {
  const [appointmentRefreshKey, setAppointmentRefreshKey] = useState(0);
  const notifyAppointmentsChanged = useCallback(() => {
    setAppointmentRefreshKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({
      studentId,
      appointmentRefreshKey,
      notifyAppointmentsChanged,
    }),
    [studentId, appointmentRefreshKey, notifyAppointmentsChanged]
  );

  return (
    <ClinicStudentContext.Provider value={value}>
      {children}
    </ClinicStudentContext.Provider>
  );
}

export function useClinicStudentId() {
  return useContext(ClinicStudentContext).studentId;
}

/** Bumps when the student’s appointment data may have changed (sidebar stats, etc.). */
export function useAppointmentRefreshKey() {
  return useContext(ClinicStudentContext).appointmentRefreshKey;
}

export function useNotifyAppointmentsChanged() {
  return useContext(ClinicStudentContext).notifyAppointmentsChanged;
}
