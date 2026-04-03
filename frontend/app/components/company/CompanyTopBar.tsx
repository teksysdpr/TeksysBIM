"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { clearSession, getAccessToken } from "@/lib/storage";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CompanyTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    function syncAuth() {
      setLoggedIn(!!getAccessToken());
    }

    syncAuth();
    window.addEventListener("dpr-auth-changed", syncAuth);
    return () => window.removeEventListener("dpr-auth-changed", syncAuth);
  }, []);

  function handleLogout() {
    clearSession();
    setMobileOpen(false);
    router.push("/login");
  }

  const navLink = (active: boolean) =>
    cx(
      "inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition",
      active
        ? "bg-[#143d38] text-[#9ce6d7]"
        : "text-[#dbeee9] hover:bg-[#13332f] hover:text-white"
    );

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e4d47] bg-[#0b2320]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-[76px] items-center gap-3 px-4 sm:px-6">
          <Link href="/company/dashboard" className="flex items-center gap-3" aria-label="Go to TeksysBIM dashboard">
            <div className="flex h-[46px] items-center overflow-hidden">
              <img
                src="/images/BIM_logo.png"
                alt="TeksysBIM Logo"
                className="h-full w-auto object-contain object-left"
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7fd5c4]">
                TeksysBIM
              </p>
              <p className="text-xs text-[#b8dbd4]">Company Workspace</p>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center gap-2 lg:flex">
            <Link href="/company/dashboard" className={navLink(isActiveRoute(pathname, "/company/dashboard"))}>
              Dashboard
            </Link>
            <Link href="/company/bim-design" className={navLink(isActiveRoute(pathname, "/company/bim-design"))}>
              BIM Design
            </Link>
            <Link href="/company/cad2bim" className={navLink(isActiveRoute(pathname, "/company/cad2bim"))}>
              2D CAD2BIM
            </Link>
            <Link href="/company/costing" className={navLink(isActiveRoute(pathname, "/company/costing"))}>
              Project Costing
            </Link>
            {loggedIn && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-[#fda4a4] transition hover:bg-[#2a1010] hover:text-[#fecaca]"
              >
                Logout
              </button>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="ml-auto inline-flex items-center justify-center rounded-md border border-white/20 p-2 text-white lg:hidden"
            aria-label={mobileOpen ? "Close company navigation" : "Open company navigation"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-[#1e4d47] bg-[#0d2723] px-3 pb-3 pt-2 lg:hidden">
            <nav className="grid gap-2">
              <Link
                href="/company/dashboard"
                className={navLink(isActiveRoute(pathname, "/company/dashboard"))}
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/company/bim-design"
                className={navLink(isActiveRoute(pathname, "/company/bim-design"))}
                onClick={() => setMobileOpen(false)}
              >
                BIM Design
              </Link>
              <Link
                href="/company/cad2bim"
                className={navLink(isActiveRoute(pathname, "/company/cad2bim"))}
                onClick={() => setMobileOpen(false)}
              >
                2D CAD2BIM
              </Link>
              <Link
                href="/company/costing"
                className={navLink(isActiveRoute(pathname, "/company/costing"))}
                onClick={() => setMobileOpen(false)}
              >
                Project Costing
              </Link>
              {loggedIn && (
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#fda4a4] transition hover:bg-[#2a1010]"
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
