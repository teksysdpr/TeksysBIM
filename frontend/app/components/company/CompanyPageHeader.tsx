"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/storage";
import {
  buildVersionedLogoUrl,
  COMPANY_LOGO_CHANGED_EVENT,
  COMPANY_LOGO_VERSION_KEY,
  readCompanyLogoVersion,
} from "@/lib/companyLogoVersion";

type CompanyProfile = {
  company_name?: string;
  logo_url?: string | null;
  logo_style?: string | null;
};

function isRectangleLogoStyle(style?: string | null) {
  return style === "rectangle" || style === "rectangle_rounded";
}

function getLogoShapeClass(style?: string | null) {
  switch (style) {
    case "square":
      return "rounded-none";
    case "square_rounded":
      return "rounded-2xl";
    case "rectangle":
      return "rounded-none";
    case "rectangle_rounded":
      return "rounded-2xl";
    case "round":
    default:
      return "rounded-full";
  }
}

export default function CompanyPageHeader() {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [logoVersion, setLogoVersion] = useState<number>(() => readCompanyLogoVersion());

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    async function loadCompanyProfile() {
      try {
        const res = await fetch("/api/proxy/company/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await res.json();
        if (res.ok) setCompany(data);
      } catch {
        // silent
      }
    }

    loadCompanyProfile();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncLogoVersion = () => {
      setLogoVersion(readCompanyLogoVersion());
    };

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === COMPANY_LOGO_VERSION_KEY) {
        syncLogoVersion();
      }
    };

    syncLogoVersion();
    window.addEventListener("storage", onStorage);
    window.addEventListener(COMPANY_LOGO_CHANGED_EVENT, syncLogoVersion as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(COMPANY_LOGO_CHANGED_EVENT, syncLogoVersion as EventListener);
    };
  }, []);

  const displayName = company?.company_name || "Company Dashboard";
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || "C";
  const logoStyle = company?.logo_style || "round";
  const isRectangle = isRectangleLogoStyle(logoStyle);
  const displayLogoUrl = buildVersionedLogoUrl(company?.logo_url, logoVersion);
  const useRectangleContainer = isRectangle;
  const logoShapeClass = getLogoShapeClass(logoStyle);

  return (
    <section>
      <div className="flex items-center justify-center gap-3 text-white">
        <div>
          {displayLogoUrl ? (
            <div
              className={[
                "flex items-center justify-center overflow-hidden",
                useRectangleContainer ? "h-14 w-fit max-w-[220px]" : "h-16 w-16",
                logoShapeClass,
              ].join(" ")}
            >
              <img
                src={displayLogoUrl}
                alt={displayName}
                className="h-full w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div
              className={[
                "flex items-center justify-center border border-white/25 bg-white/10 text-xl font-bold shadow-lg",
                isRectangle ? "h-14 w-[120px]" : "h-16 w-16",
                getLogoShapeClass(logoStyle),
              ].join(" ")}
            >
              {displayInitial}
            </div>
          )}
        </div>

        <h1 className="text-2xl font-extrabold tracking-wide md:text-3xl">{displayName}</h1>
      </div>
    </section>
  );
}
