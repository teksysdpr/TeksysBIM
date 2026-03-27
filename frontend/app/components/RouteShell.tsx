"use client";

import Header from "./Header";
import PortalFooter from "./PortalFooter";

export default function RouteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <PortalFooter />
    </>
  );
}
