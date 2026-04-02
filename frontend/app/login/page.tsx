"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  MessageSquareQuote,
  Scale,
  FolderKanban,
} from "lucide-react";
import { getLandingPathFromAuthContext } from "@/lib/landing";
import { saveVerifiedSession } from "@/lib/storage";
import LaunchNotice from "./LaunchNotice";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/proxy";
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Invalid credentials");
      }

      saveVerifiedSession({
        accessToken: payload.accessToken,
        user: payload.user,
      });

      const roles = Array.isArray(payload?.user?.roles) ? payload.user.roles : [];
      const primaryRole = roles.length > 0 ? String(roles[0]) : String(payload?.user?.role || "");
      const landingPath = getLandingPathFromAuthContext({
        category:
          payload?.user?.category ||
          payload?.user?.user_category ||
          payload?.authCategory ||
          null,
        role: primaryRole,
        landingPath:
          payload?.user?.landing_path ||
          payload?.user?.landingPath ||
          payload?.landing_path ||
          payload?.landingPath ||
          null,
      });

      router.push(landingPath || "/company/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-88px)] bg-[#090603] px-4 py-10 text-[#f3dfbe] md:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 rounded-[28px] border border-[#3f2d1a] bg-[#120c07] p-6 shadow-[0_20px_54px_rgba(0,0,0,0.35)] md:grid-cols-[1.1fr_0.9fr] md:p-8">
        <section className="rounded-[24px] border border-[#4b3520] bg-gradient-to-br from-[#1b120b] via-[#1a110a] to-[#120c07] p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f0c27e]">Subscription & Quote Support</p>
          <h1 className="mt-4 text-3xl font-black text-[#fff3de] md:text-4xl">
            Get a tailored commercial proposal for your BIM scope
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#ceb693]">
            Contact our team to receive project-size-wise and number-of-projects-wise pricing.
            We provide structured proposals for one-time conversions, ongoing BIM coordination,
            and consultancy-led delivery support.
          </p>
          <div className="mt-7 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-[#5d4128] bg-[#130c08]/70 px-4 py-3 text-sm text-[#dec39d]">
              <Scale className="mt-0.5 h-4 w-4 text-[#f0c27e]" />
              <p>Detailed quote based on project size, complexity, and model depth requirements.</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-[#5d4128] bg-[#130c08]/70 px-4 py-3 text-sm text-[#dec39d]">
              <FolderKanban className="mt-0.5 h-4 w-4 text-[#f0c27e]" />
              <p>Portfolio pricing options for organizations handling multiple projects.</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-[#5d4128] bg-[#130c08]/70 px-4 py-3 text-sm text-[#dec39d]">
              <MessageSquareQuote className="mt-0.5 h-4 w-4 text-[#f0c27e]" />
              <p>
                Mail us at <span className="font-semibold text-[#f7d4a2]">contact@teksys.in</span> to schedule a
                scope discussion.
              </p>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[24px] border border-[#4b3520] bg-gradient-to-br from-[#1f140d]/95 via-[#1a110a]/95 to-[#120b07]/95 p-6 text-white shadow-[0_20px_54px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#f0c27e]/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-[#8a5a33]/12 blur-2xl" />

          <div className="relative z-10 mb-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#fde7c8]">
              <KeyRound className="h-3.5 w-3.5" />
              Secure Sign-In
            </div>
            <h2 className="mt-3 text-2xl font-black text-[#fff4df]">Welcome Back</h2>
            <p className="mt-1 text-sm text-[#e7d0ad]">
              Sign in to continue to your TeksysBIM workspace.
            </p>
          </div>

          <form className="relative z-10 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#f1d8b1]">Email ID</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6c5b4b]" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="Enter your registered email"
                  className="w-full rounded-xl border border-[#eadcc8] bg-white py-3 pl-10 pr-4 text-[#2a190d] outline-none transition placeholder:text-[#9a8b79] focus:border-[#d7a35d]"
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-[#f1d8b1]">Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold text-[#f7d5a4] hover:text-[#ffe6c2] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6c5b4b]" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-[#eadcc8] bg-white py-3 pl-10 pr-4 text-[#2a190d] outline-none transition placeholder:text-[#9a8b79] focus:border-[#d7a35d]"
                  required
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d7a35d] to-[#b47e3f] px-4 py-3 text-sm font-black text-[#2a190d] shadow-[0_14px_32px_rgba(181,127,63,0.35)] transition hover:brightness-105 disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="relative z-10 mt-4 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs leading-5 text-[#f2e1c4]">
            <div className="mb-1 flex items-center gap-2 text-sm font-bold text-[#fff1de]">
              <CheckCircle2 className="h-4 w-4" />
              Portal Access
            </div>
            Use credentials shared by your BIM Admin. New users can register and request activation.
          </div>

          <div className="relative z-10 mt-4 flex items-center justify-between text-sm text-[#e7d0ad]">
            <Link href="/register" className="font-semibold text-[#f7d5a4] hover:text-[#ffe6c2] hover:underline">
              New Registration
            </Link>
            <Link href="/" className="font-semibold text-[#f7d5a4] hover:text-[#ffe6c2] hover:underline">
              Back to Home
            </Link>
          </div>
        </section>
      </div>
      <LaunchNotice
        portalName="BIM Portal"
        launchMonth="May 2026"
        storageKey="bim_login_launch_notice_v2"
        themeVariant="bim"
      />
    </main>
  );
}
