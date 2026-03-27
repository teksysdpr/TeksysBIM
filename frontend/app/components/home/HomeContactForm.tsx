"use client";

import { FormEvent, useState } from "react";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

function normalizeMobile(value: string) {
  return value.replace(/\D/g, "");
}

function isValidMobile(value: string) {
  const digits = normalizeMobile(value);
  return digits.length >= 10 && digits.length <= 15;
}

function extractErrorMessage(data: any, fallback = "Failed to submit enquiry.") {
  if (!data) return fallback;
  if (typeof data === "string") return data;

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    const first = data.detail[0];
    if (typeof first === "string") return first;
    if (first?.msg) return first.msg;
    return data.detail.map((item: any) => item?.msg || JSON.stringify(item)).join("; ");
  }

  if (typeof data?.detail === "object" && data.detail !== null) {
    if (data.detail.msg) return data.detail.msg;
    try {
      return JSON.stringify(data.detail);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export default function HomeContactForm() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    mobile: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setNotice("");
    setError("");

    const email = form.email.trim();
    const mobile = normalizeMobile(form.mobile);

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      setSubmitting(false);
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      setSubmitting(false);
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      setSubmitting(false);
      return;
    }

    if (form.mobile.trim() && !isValidMobile(form.mobile)) {
      setError("Please enter a valid mobile number with 10 to 15 digits.");
      setSubmitting(false);
      return;
    }

    if (!form.message.trim()) {
      setError("Please enter your requirement.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        company: form.company.trim(),
        email,
        mobile,
        phone: mobile,
        message: form.message.trim(),
      };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = rawText;
      }

      if (!res.ok) {
        throw new Error(extractErrorMessage(data));
      }

      setNotice(
        typeof data?.message === "string" && data.message.trim()
          ? data.message
          : "Thank you. Your enquiry has been submitted successfully."
      );
      setForm({
        name: "",
        company: "",
        email: "",
        mobile: "",
        message: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit enquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-[#5a3a2c] bg-white/5 px-4 py-3 text-sm text-[#f8ecda] outline-none transition placeholder:text-[#b69a79] focus:border-[#d7a35d]/60 focus:ring-4 focus:ring-[#d7a35d]/15";

  return (
    <form onSubmit={handleSubmit} className="rounded-[26px] border border-[#4c3025] bg-[#120c09]/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.26)] backdrop-blur sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#f3c98e]">
          Full Name
          <input
            required
            className={`${inputClass} mt-2`}
            placeholder="Your full name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
        </label>

        <label className="text-sm font-semibold text-[#f3c98e]">
          Company
          <input
            className={`${inputClass} mt-2`}
            placeholder="Company name"
            value={form.company}
            onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
          />
        </label>

        <label className="text-sm font-semibold text-[#f3c98e]">
          Email
          <input
            required
            type="email"
            className={`${inputClass} mt-2`}
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
        </label>

        <label className="text-sm font-semibold text-[#f3c98e]">
          Mobile
          <input
            className={`${inputClass} mt-2`}
            placeholder="Mobile number"
            value={form.mobile}
            onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-[#f3c98e]">
        Requirement
        <textarea
          required
          rows={5}
          className={`${inputClass} mt-2 resize-y`}
          placeholder="Tell us about your BIM requirement"
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
          {notice}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#d7a35d] to-[#bc8643] px-6 py-3 text-sm font-black uppercase tracking-[0.06em] text-[#2a1608] shadow-[0_16px_30px_rgba(188,134,67,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Submitting..." : "Submit Enquiry"}
      </button>
    </form>
  );
}
