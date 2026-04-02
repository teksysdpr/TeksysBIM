"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, X } from "lucide-react";

type ThemeVariant = "dpr" | "erp" | "bim";

type LaunchNoticeProps = {
  portalName: string;
  launchMonth: string;
  storageKey: string;
  themeVariant?: ThemeVariant;
  title?: string;
  message?: string;
};

const THEME_CLASS: Record<ThemeVariant, string> = {
  dpr: "border-[#f0cfac]/45 bg-gradient-to-br from-[#2f1d15]/96 via-[#5b3421]/94 to-[#8a5532]/96 text-[#fff4e8]",
  erp: "border-indigo-200/35 bg-gradient-to-br from-[#0B1120]/96 via-[#172554]/94 to-[#0F172A]/96 text-slate-100",
  bim: "border-[#5d4128]/70 bg-gradient-to-br from-[#1f140d]/96 via-[#1a110a]/95 to-[#120b07]/96 text-[#f6e5cd]",
};

export default function LaunchNotice({
  portalName,
  launchMonth,
  storageKey,
  themeVariant = "bim",
  title = "Development Update",
  message,
}: LaunchNoticeProps) {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  const body = useMemo(
    () =>
      message ||
      `${portalName} is currently in the development stage and is planned for formal customer launch in ${launchMonth}.`,
    [message, portalName, launchMonth]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(storageKey) === "dismissed";
    if (!dismissed) setVisible(true);
    setReady(true);
  }, [storageKey]);

  function dismiss() {
    setVisible(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, "dismissed");
    }
  }

  if (!ready || !visible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[70] w-[min(370px,calc(100vw-1.4rem))] max-sm:bottom-3 max-sm:left-1/2 max-sm:right-auto max-sm:w-[calc(100vw-1rem)] max-sm:-translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div
        className={`launch-notice-card rounded-2xl border shadow-[0_16px_38px_rgba(6,4,2,0.35)] backdrop-blur-md ${THEME_CLASS[themeVariant]}`}
      >
        <div className="flex items-start gap-3 p-4">
          <span className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/20 bg-white/10">
            <BellRing className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-wide">{title}</p>
            <p className="mt-1 text-xs leading-5 text-white/85">{body}</p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-md border border-white/20 bg-white/10 text-white/85 transition hover:bg-white/20"
            aria-label="Dismiss announcement"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .launch-notice-card {
          animation: launchNoticeIn 280ms ease-out;
        }

        @keyframes launchNoticeIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

