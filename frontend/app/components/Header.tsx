"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { getAccessToken, clearSession } from "@/lib/storage";

const PORTAL_LOGO = "/images/BIM_logo.png";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // Read auth state on mount and whenever it changes
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
        ? "bg-[#3a1f1f] text-[#f3c786]"
        : "text-[#ead8ba] hover:bg-[#281515] hover:text-[#f3c786]"
    );

  const staticLinks = [{ label: "Home", href: "/" }];

  return (
    <header className="sticky top-0 z-50 border-b border-[#3a2a1b] bg-[#120c07]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-[96px] items-center gap-3 px-4 sm:h-[104px] sm:px-6">
          <Link href="/" className="flex items-center gap-3 sm:gap-4" aria-label="Go to TeksysBIM home">
            <div className="flex h-[80px] max-w-[360px] items-center overflow-hidden sm:h-[89px] sm:max-w-[458px]">
              <img
                src={PORTAL_LOGO}
                alt="TeksysBIM Logo"
                className="h-[128%] w-auto object-contain object-left"
              />
            </div>
            <p className="hidden whitespace-nowrap text-xs text-[#d5be98] lg:block">
              BIM Intelligence for Design, Project Control, and Cost Clarity
            </p>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-auto hidden items-center gap-1.5 lg:flex">
            {staticLinks.map((item) => (
              <Link key={item.href} href={item.href} className={navLink(isActiveRoute(pathname, item.href))}>
                {item.label}
              </Link>
            ))}

            {loggedIn ? (
              <>
                <Link href="/company/dashboard" className={navLink(isActiveRoute(pathname, "/company"))}>
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-[#f87171] transition hover:bg-[#2a1010] hover:text-[#fca5a5]"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className={navLink(isActiveRoute(pathname, "/login"))}>
                Login
              </Link>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="ml-auto inline-flex items-center justify-center rounded-md border border-white/20 p-2 text-white lg:hidden"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen ? (
          <div className="border-t border-[#2f2115] bg-[#1a120b] px-3 pb-3 pt-2 lg:hidden">
            <nav className="grid gap-2">
              {staticLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLink(isActiveRoute(pathname, item.href))}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {loggedIn ? (
                <>
                  <Link
                    href="/company/dashboard"
                    className={navLink(isActiveRoute(pathname, "/company"))}
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#f87171] transition hover:bg-[#2a1010]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className={navLink(isActiveRoute(pathname, "/login"))}
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
