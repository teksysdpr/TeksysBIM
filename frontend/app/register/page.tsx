"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const SECTORS = ["Real Estate", "Industrial", "Infrastructure", "Others"];

function isValidPassword(p: string) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(p);
}

function normalizeMobile(v: string) {
  let s = v.trim().replace(/\s+/g, "");
  if (s.startsWith("+91")) s = s.slice(3);
  return s;
}

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);

  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [pinCode, setPinCode] = useState("");
  const [sector, setSector] = useState("Real Estate");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminMobile, setAdminMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [pendingId, setPendingId] = useState<number | null>(null);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const mobileNorm = useMemo(() => normalizeMobile(adminMobile), [adminMobile]);

  async function submitRegisterInit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!companyName.trim()) return setMsg({ type: "error", text: "Name of Company is required." });
    if (!address.trim()) return setMsg({ type: "error", text: "Address is required." });
    if (!state.trim()) return setMsg({ type: "error", text: "State is required." });
    if (!/^\d{6}$/.test(pinCode.trim())) return setMsg({ type: "error", text: "PIN Code must be exactly 6 digits." });
    if (!SECTORS.includes(sector)) return setMsg({ type: "error", text: "Please select a valid sector." });
    if (!adminName.trim()) return setMsg({ type: "error", text: "Name of Admin is required." });
    if (!adminEmail.trim()) return setMsg({ type: "error", text: "Email ID of Admin is required." });

    if (!/^[6-9]\d{9}$/.test(mobileNorm)) {
      return setMsg({ type: "error", text: "Mobile must be 10 digits (India) starting with 6-9." });
    }
    if (!isValidPassword(password)) {
      return setMsg({ type: "error", text: "Password must be 8–16 chars with 1 uppercase, 1 number and 1 symbol." });
    }
    if (password !== confirmPassword) {
      return setMsg({ type: "error", text: "Confirm Password does not match." });
    }

    setSubmitting(true);
    try {
      const r = await fetch("/api/proxy/auth/register/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          address: address.trim(),
          state: state.trim(),
          pin_code: pinCode.trim(),
          sector: sector.trim(),
          admin_name: adminName.trim(),
          admin_email: adminEmail.trim(),
          admin_mobile: mobileNorm,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok) throw new Error(data?.detail || data?.error || "Registration failed");

      setPendingId(data.pending_id);
      setStep(2);
      setMsg({ type: "success", text: "OTP sent to your registered email address. Please enter OTP." });
    } catch (err: any) {
      setMsg({ type: "error", text: err?.message || "Failed to send OTP. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!pendingId) return setMsg({ type: "error", text: "Missing pending registration id." });
    if (!/^\d{4}$/.test(otp.trim())) return setMsg({ type: "error", text: "Enter 4-digit OTP." });

    setSubmitting(true);
    try {
      const r = await fetch("/api/proxy/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pending_id: pendingId, otp: otp.trim() }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok) throw new Error(data?.detail || data?.error || "OTP verification failed");

      setMsg({ type: "success", text: "Registration verified successfully. Redirecting to Login..." });
      setTimeout(() => (window.location.href = "/login"), 900);
    } catch (err: any) {
      setMsg({ type: "error", text: err?.message || "Failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-90px)] bg-gray-50">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900">Register Company Admin</h1>
          <p className="text-gray-600 mt-1">
            Create your company account. After verification, you can create Planning Engineer and Project Manager users from inside the portal.
          </p>

          {msg && (
            <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${msg.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {msg.text}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={submitRegisterInit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Name Of Company</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Address</label>
                <textarea
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">State</label>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">PIN Code</label>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  placeholder="6-digit PIN code"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Sector</label>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Admin Name</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Admin Email ID</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Admin Mobile No.</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  placeholder="10-digit mobile"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">8–16 chars, 1 uppercase, 1 number, 1 symbol.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 bg-white"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button disabled={submitting} className="w-full bg-indigo-600 text-white font-bold rounded-lg py-2.5 hover:bg-indigo-700 transition disabled:opacity-60">
                {submitting ? "Sending OTP..." : "Register & Send OTP"}
              </button>

              <p className="text-sm text-gray-600 text-center">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-white hover:underline">
                  Login
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={submitOtpVerify} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Enter 4-digit OTP</label>
                <input
                  inputMode="numeric"
                  maxLength={4}
                  className="mt-1 w-full rounded-lg border px-3 py-2 tracking-widest text-lg text-gray-900 bg-white"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
                <p className="mt-1 text-xs text-gray-500">OTP sent to your registered email address.</p>
              </div>

              <button disabled={submitting} className="w-full bg-slate-900 text-white font-bold rounded-lg py-2.5 hover:opacity-90 transition disabled:opacity-60">
                {submitting ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                className="w-full border rounded-lg py-2.5 font-semibold hover:bg-gray-50 transition"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setMsg(null);
                }}
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
