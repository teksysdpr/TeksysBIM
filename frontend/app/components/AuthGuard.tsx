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
    if (!token) {
      clearSession();
      window.location.replace(`/login?next=${encodeURIComponent(pathname || "/projects")}`);
      return;
    }

    const check = evaluateSessionToken(token);

    if (!check.valid && check.reason !== "invalid_token") {
      clearSession();
      window.location.replace(`/login?next=${encodeURIComponent(pathname || "/projects")}`);
      return;
    }

    setReady(true);
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#133d39_0%,#0b2623_36%,#071614_72%,#04100f_100%)] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-[#215650] bg-[linear-gradient(180deg,rgba(7,29,27,0.96),rgba(7,21,19,0.98))] p-6 text-center shadow-[0_28px_80px_rgba(1,10,9,0.4)]">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#7fd5c4]">
            TeksysBIM
          </p>
          <h1 className="mt-3 text-2xl font-black text-white">Checking session</h1>
          <p className="mt-2 text-sm leading-6 text-[#b7ddd5]">
            Verifying access to the company workspace.
          </p>
          <div className="mx-auto mt-5 h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#38d39f]" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
