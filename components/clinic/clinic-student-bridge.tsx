"use client";

import { createContext, useContext } from "react";

const ClinicStudentContext = createContext<{ studentId: string }>({
  studentId: "",
});

export function ClinicStudentBridge({
  studentId,
  children,
}: {
  studentId: string;
  children: React.ReactNode;
}) {
  return (
    <ClinicStudentContext.Provider value={{ studentId }}>
      {children}
    </ClinicStudentContext.Provider>
  );
}

export function useClinicStudentId() {
  return useContext(ClinicStudentContext).studentId;
}
