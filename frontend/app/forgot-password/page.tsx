"use client";

import { useState } from "react";
import Link from "next/link";

function isValidPassword(p: string) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(p);
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);

  const [identifier, setIdentifier] = useState("");
  const [resetId, setResetId] = useState<number | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function requestOtp(email: string): Promise<{ reset_id: number; dev_otp?: string }> {
    const r = await fetch("/api/proxy/auth/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data?.ok) throw new Error(data?.detail || data?.error || "Failed to send OTP");
    return data;
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const email = identifier.trim();
    if (!email) return setMsg({ type: "error", text: "Enter your Email ID." });

    setSubmitting(true);
    try {
      const data = await requestOtp(email);
      setResetId(data.reset_id);
      setDevOtp(data.dev_otp ?? null);
      setStep(2);
      setMsg({ type: "success", text: "OTP generated. Enter it below to reset your password." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function resendOtp() {
    const email = identifier.trim();
    if (!email) return;
    setResending(true);
    setMsg(null);
    setOtp("");
    try {
      const data = await requestOtp(email);
      setResetId(data.reset_id);
      setDevOtp(data.dev_otp ?? null);
      setMsg({ type: "success", text: "New OTP generated." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to resend OTP." });
    } finally {
      setResending(false);
    }
  }

  async function verifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!resetId) return setMsg({ type: "error", text: "Reset session missing. Please resend OTP." });
    if (!/^\d{4}$/.test(otp.trim())) return setMsg({ type: "error", text: "Enter the 4-digit OTP." });
    if (!isValidPassword(newPass)) return setMsg({ type: "error", text: "Password must be 8–16 chars with 1 uppercase, 1 number and 1 symbol." });
    if (newPass !== confirmPass) return setMsg({ type: "error", text: "Passwords do not match." });

    setSubmitting(true);
    try {
      const r = await fetch("/api/proxy/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reset_id: resetId,
          otp: otp.trim(),
          new_password: newPass,
          confirm_password: confirmPass,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok) throw new Error(data?.detail || data?.error || "Reset failed");

      setMsg({ type: "success", text: "Password reset successful. Redirecting to login…" });
      setTimeout(() => (window.location.href = "/login"), 1200);
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-90px)] bg-[#090603]">
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-[#3f2d1a] bg-[#120c07] p-6 shadow-[0_20px_54px_rgba(0,0,0,0.35)] sm:p-8">

          {/* Title */}
          <h1 className="text-2xl font-black text-[#f8e8cf]">Forgot Password</h1>
          <p className="mt-1 text-sm text-[#8a6e4e]">
            {step === 1
              ? "Enter your registered email address. An OTP will be generated for you."
              : `Enter the OTP shown below and choose a new password.`}
          </p>

          {/* Message banner */}
          {msg && (
            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              msg.type === "error"
                ? "border-red-900/50 bg-red-950/20 text-[#f87171]"
                : "border-[#064e3b]/60 bg-[#064e3b]/20 text-[#34d399]"
            }`}>
              {msg.text}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={sendOtp} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#f1d8b1]">Email ID</label>
                <input
                  type="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@teksys.in"
                  className="w-full rounded-xl border border-[#3f2d1a] bg-[#1a120b] px-3 py-2.5 text-sm text-[#f0e6d4] placeholder:text-[#5a3e22] focus:border-[#d4933c] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#d4933c] py-2.5 text-sm font-black text-[#1a0f06] transition hover:bg-[#c08030] disabled:opacity-60"
              >
                {submitting ? "Generating OTP…" : "Get OTP"}
              </button>

              <p className="text-center text-sm text-[#8a6e4e]">
                <Link href="/login" className="font-semibold text-[#d4933c] hover:underline">Back to Login</Link>
              </p>
            </form>

          ) : (
            <form onSubmit={verifyAndReset} className="mt-6 space-y-4">

              {/* Dev OTP display box */}
              {devOtp && (
                <div className="rounded-xl border border-[#d4933c]/40 bg-[#d4933c]/10 px-4 py-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#d4933c]">Your OTP</p>
                  <p className="mt-1 font-mono text-3xl font-black tracking-[0.3em] text-[#f8e8cf]">{devOtp}</p>
                  <p className="mt-1 text-[10px] text-[#8a6e4e]">Valid for 10 minutes</p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#f1d8b1]">Enter 4-digit OTP</label>
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="----"
                  className="w-full rounded-xl border border-[#3f2d1a] bg-[#1a120b] px-3 py-2.5 text-center font-mono text-xl tracking-[0.4em] text-[#f0e6d4] placeholder:tracking-normal placeholder:text-[#5a3e22] focus:border-[#d4933c] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#f1d8b1]">New Password</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full rounded-xl border border-[#3f2d1a] bg-[#1a120b] px-3 py-2.5 text-sm text-[#f0e6d4] focus:border-[#d4933c] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-[#7a5e3e]">8–16 chars · 1 uppercase · 1 number · 1 symbol</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#f1d8b1]">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full rounded-xl border border-[#3f2d1a] bg-[#1a120b] px-3 py-2.5 text-sm text-[#f0e6d4] focus:border-[#d4933c] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#d4933c] py-2.5 text-sm font-black text-[#1a0f06] transition hover:bg-[#c08030] disabled:opacity-60"
              >
                {submitting ? "Resetting…" : "Verify OTP & Reset Password"}
              </button>

              {/* Resend OTP */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resending}
                  className="text-sm font-semibold text-[#d4933c] hover:underline disabled:opacity-50"
                >
                  {resending ? "Resending…" : "Resend OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(""); setNewPass(""); setConfirmPass(""); setMsg(null); setDevOtp(null); }}
                  className="text-sm text-[#7a5e3e] hover:text-[#d4933c]"
                >
                  Change email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
