"use client";

import { FormEvent, useState } from "react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  message: "",
};

export default function HomeContactPanel() {
  const [form, setForm] = useState<FormState>(initialState);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || "Failed to submit enquiry.");
      }

      setNotice("Thank you. Your request has been submitted successfully.");
      setForm(initialState);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit enquiry.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <section id="home-contact" className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <div className="grid gap-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_56px_rgba(15,23,42,0.08)] lg:grid-cols-[0.85fr_1.15fr] lg:p-8">
        <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
            Talk to us
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Start your ERP rollout with a cleaner operating model
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Tell us about your organization, process gaps, or rollout plan. We will help you
            structure the right ERP layer for projects and business operations.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Project and business process mapping",
              "Role-wise access and control strategy",
              "ERP rollout guidance for execution teams",
              "Management dashboard and reporting alignment",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submitForm} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Full name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
            <input
              className={inputClass}
              placeholder="Email address"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Mobile number"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Company name"
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
            />
          </div>

          <textarea
            className={`${inputClass} min-h-[150px] resize-y`}
            placeholder="Tell us what you want to streamline or control"
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            required
          />

          {notice ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Submitting..." : "Submit enquiry"}
            </button>

            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
            >
              Go to Login
            </a>
          </div>
        </form>
      </div>
    </section>
  );
}
