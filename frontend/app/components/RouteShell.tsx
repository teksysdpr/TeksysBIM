"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import PortalFooter from "./PortalFooter";

export default function RouteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCompanyRoute = pathname === "/company" || pathname.startsWith("/company/");

  if (isCompanyRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <PortalFooter />
    </>
  );
}
