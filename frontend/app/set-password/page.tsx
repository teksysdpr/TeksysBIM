"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, KeyRound } from "lucide-react";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function SetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tokenReady, setTokenReady] = useState(false);

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qp = new URLSearchParams(window.location.search || "");
    setToken((qp.get("token") || "").trim());
    setTokenReady(true);
  }, []);

  useEffect(() => {
    if (!tokenReady) return;

    async function runValidation() {
      if (!token) {
        setValid(false);
        setValidating(false);
        setError("Invalid password setup link.");
        return;
      }

      try {
        setValidating(true);
        setError("");
        const res = await fetch("/api/proxy/auth/password/setup/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload?.detail || "Invalid or expired setup link");
        }

        setFullName(payload?.user?.full_name || "");
        setEmail(payload?.user?.email || "");
        setValid(true);
      } catch (err: unknown) {
        setValid(false);
        setError(getErrorMessage(err, "Invalid or expired setup link"));
      } finally {
        setValidating(false);
      }
    }

    runValidation();
  }, [token, tokenReady]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !valid) return;

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please fill both password fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Confirm password does not match.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/proxy/auth/password/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password: password,
          confirm_password: confirmPassword,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.detail || "Unable to set password");
      }

      setSuccess("Password created successfully. Redirecting to login...");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => router.push("/login"), 1400);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to set password"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="min-h-screen px-4 py-6 md:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at top, #1e3a8a 0%, #172554 26%, #0f172a 68%, #020617 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-xl">
        <section className="rounded-[30px] border border-[#e7d4c6] bg-white p-5 shadow-[0_20px_46px_rgba(23,10,4,0.32)] sm:p-6">
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e6d2c2] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#7a4a2c]">
              <KeyRound className="h-3.5 w-3.5" />
              Password Setup
            </div>
            <h1 className="mt-3 text-2xl font-black text-[#4a2d1f]">Create Your Password</h1>
            <p className="mt-1 text-sm text-slate-600">
              Complete this once to activate your user account.
            </p>
          </div>

          {validating ? (
            <div className="rounded-xl border border-[#eadccf] bg-white px-4 py-3 text-sm text-[#6f4a35]">
              Validating setup link...
            </div>
          ) : null}

          {!validating && !valid ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error || "Invalid or expired setup link."}
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Back to Login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}

          {!validating && valid ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="rounded-xl border border-[#eadccf] bg-[#fff3e8] px-4 py-3 text-xs leading-5 text-[#6f4a35]">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-[#4a2d1f]">
                  <CheckCircle2 className="h-4 w-4" />
                  Invite Verified
                </div>
                <div>{fullName || "User"}</div>
                <div>{email}</div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8-16 chars, uppercase, number, symbol"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Saving Password..." : "Set Password"}
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  );
}
