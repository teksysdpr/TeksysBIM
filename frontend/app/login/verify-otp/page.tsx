"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getLoginId, getSelectedCategory, saveVerifiedSession } from "@/lib/storage";
import { getLandingPathFromAuthContext, resolveAuthCategory, type AuthCategory } from "@/lib/landing";
import { fetchAuthMe, verifyOtp } from "@/services/authService";
import { evaluateSessionToken, isLoginAllowedNow, sessionPolicyMessage } from "@/lib/sessionPolicy";

function getCategoryMismatchMessage(selectedCategory: string | null) {
  const requested = resolveAuthCategory({ category: selectedCategory });
  if (requested === "ADMIN") return "Access denied: You are not an Admin.";
  if (requested === "PLANNING") return "Access denied: You are not part of Planning.";
  if (requested === "CONTRACT") return "Access denied: You are not part of Contract.";
  if (requested === "ACCOUNTS") return "Access denied: You are not part of Accounts.";
  if (requested === "PURCHASE") return "Access denied: You are not part of Purchase.";
  if (requested === "SITE") return "Access denied: You are not part of Site.";
  return "Access denied: selected login category is not allowed for this user.";
}

function isCategoryMismatch(selectedCategory: string | null, actualCategory: AuthCategory | null) {
  const requestedCategory = resolveAuthCategory({ category: selectedCategory });
  if (!requestedCategory || !actualCategory) return false;
  return requestedCategory !== actualCategory;
}

export default function VerifyOtpPage() {
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!isLoginAllowedNow()) {
      setError(sessionPolicyMessage("outside_allowed_hours"));
      setLoading(false);
      return;
    }

    try {
      const loginId = getLoginId();

      if (!loginId) {
        throw new Error("Login session not found. Please login again.");
      }

      const selectedCategory = getSelectedCategory();
      const res = await verifyOtp({
        login_id: loginId,
        otp,
        selected_category: selectedCategory || undefined,
      });

      const actualCategory = resolveAuthCategory({
        category: res.user?.category,
        role: res.user?.role,
      });
      if (isCategoryMismatch(selectedCategory, actualCategory)) {
        throw new Error(getCategoryMismatchMessage(selectedCategory));
      }
      const sessionCheck = evaluateSessionToken(res.access_token);
      if (!sessionCheck.valid) {
        throw new Error(sessionPolicyMessage(sessionCheck.reason));
      }

      let sessionUser: any = res.user;
      try {
        const mePayload = await fetchAuthMe(res.access_token);
        const meFromApi =
          mePayload && typeof mePayload === "object" && mePayload.user
            ? mePayload.user
            : mePayload;
        if (meFromApi && typeof meFromApi === "object") {
          sessionUser = {
            ...sessionUser,
            ...meFromApi,
          };
        }
      } catch {
        // fallback to verify payload user
      }

      saveVerifiedSession({
        accessToken: res.access_token,
        user: sessionUser,
      });

      const landingPath = getLandingPathFromAuthContext({
        landingPath: res.landing_path,
        category: res.user?.category || selectedCategory,
        role: res.user?.role,
      });
      router.push(landingPath);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#3f281d] px-4 py-8">
      <div className="mx-auto max-w-md rounded-[28px] border border-[#eadfd6] bg-white p-6 shadow-2xl">
        <div className="mb-6">
          <div className="mb-3 inline-flex rounded-full bg-[#f6ede6] px-4 py-2 text-xs font-semibold text-[#7a4a2c] sm:text-sm">
            OTP Verification
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">
            Verify Login
          </h1>
          <p className="text-sm text-slate-500">
            Enter the OTP sent for your login session
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleVerify}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              OTP
            </label>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </main>
  );
}
