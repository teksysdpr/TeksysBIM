import AuthGuard from "../components/AuthGuard";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        body > header,
        body > footer {
          display: none !important;
        }
      `}</style>
      <AuthGuard>{children}</AuthGuard>
    </>
  );
}
