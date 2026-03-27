"use client";

import { useState } from "react";
import Link from "next/link";

function normalizeMobile(v: string) {
  let s = v.trim().replace(/\s+/g, "");
  if (s.startsWith("+91")) s = s.slice(3);
  return s;
}

function isValidPassword(p: string) {
  // 8-16 chars, 1 uppercase, 1 number, 1 symbol
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(p);
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);

  const [identifier, setIdentifier] = useState("");
  const [resetId, setResetId] = useState<number | null>(null);

  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const id = identifier.trim();
    if (!id) return setMsg({ type: "error", text: "Enter Email ID." });

    setSubmitting(true);
    try {
      const r = await fetch("/api/proxy/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok) throw new Error(data?.detail || data?.error || "Failed to send OTP");

      setResetId(data.reset_id);
      setStep(2);
      setMsg({ type: "success", text: "OTP sent. Please enter OTP and set new password." });
    } catch (err: any) {
      setMsg({ type: "error", text: err?.message || "Failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!resetId) return setMsg({ type: "error", text: "Reset session missing. Please resend OTP." });
    if (!/^\d{4}$/.test(otp.trim())) return setMsg({ type: "error", text: "Enter 4-digit OTP." });
    if (!isValidPassword(newPass)) return setMsg({ type: "error", text: "Password must be 8–16 chars with 1 uppercase, 1 number and 1 symbol." });
    if (newPass !== confirmPass) return setMsg({ type: "error", text: "Confirm password does not match." });

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

      setMsg({ type: "success", text: "Password reset successful. Redirecting to login..." });
      setTimeout(() => (window.location.href = "/login"), 900);
    } catch (err: any) {
      setMsg({ type: "error", text: err?.message || "Failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-90px)] bg-gray-50">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-600 mt-1">Enter your registered Email ID. A verification OTP will be sent to your email address.</p>

          {msg && (
            <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${msg.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {msg.text}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={sendOtp} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Email ID</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <button
                disabled={submitting}
                className="w-full bg-indigo-600 text-white font-bold rounded-lg py-2.5 hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send OTP"}
              </button>

              <p className="text-sm text-gray-600 text-center">
                <Link href="/login" className="font-semibold text-white hover:underline">Back to Login</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={verifyAndReset} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Enter 4-digit OTP</label>
                <input
                  inputMode="numeric"
                  maxLength={4}
                  className="mt-1 w-full rounded-lg border px-3 py-2 tracking-widest text-lg text-gray-900 bg-white"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">New Password</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">8–16 chars, 1 uppercase, 1 number, 1 symbol.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                />
              </div>

              <button
                disabled={submitting}
                className="w-full bg-slate-900 text-white font-bold rounded-lg py-2.5 hover:opacity-90 transition disabled:opacity-60"
              >
                {submitting ? "Resetting..." : "Verify OTP & Reset"}
              </button>

              <button
                type="button"
                className="w-full border border-gray-300 text-gray-900 bg-white rounded-lg py-2.5 font-semibold hover:bg-gray-50 transition"
                onClick={() => { setStep(1); setOtp(""); setNewPass(""); setConfirmPass(""); setMsg(null); }}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
