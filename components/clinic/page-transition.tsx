type Props = {
  children: React.ReactNode;
};

export function PageTransition({ children }: Props) {
  return (
    <div className="clinic-page-enter">
      {children}
    </div>
  );
}
