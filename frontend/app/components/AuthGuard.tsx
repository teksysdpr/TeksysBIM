"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getAccessToken } from "@/lib/storage";
import { evaluateSessionToken } from "@/lib/sessionPolicy";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const check = evaluateSessionToken(token);

    if (!check.valid) {
      clearSession();
      router.replace(`/login?next=${encodeURIComponent(pathname || "/projects")}`);
      return;
    }

    // Token exists → allow access
    setReady(true);
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="min-h-[calc(100vh-90px)] bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-sm">Checking session...</div>
      </div>
    );
  }

  return <>{children}</>;
}
