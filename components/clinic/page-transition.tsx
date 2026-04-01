"use client";

import { usePathname } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export function PageTransition({ children }: Props) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="clinic-page-enter">
      {children}
    </div>
  );
}
