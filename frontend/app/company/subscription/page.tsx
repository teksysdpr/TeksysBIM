"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";
import { getAccessToken } from "@/lib/storage";
import {
  getCompanySubscription,
  getCompanySubscriptionAllocations,
  getCompanySubscriptionUsage,
  getCompanySubscriptionAlerts,
  SubscriptionAllocationRow,
  SubscriptionAlertRow,
  SubscriptionRow,
  SubscriptionUsageRow,
} from "@/services/companyService";
import { getProjects, getSchedules } from "@/app/services/projectControlService";

type UsageViewRow = {
  metric: string;
  allocated: number;
  used: number;
  remaining: number;
};

type PlanOption = {
  key: string;
  name: string;
  billingCycle: string;
  price: number;
  projectsLimit: number;
  schedulesLimit: number;
  description: string;
  recommended?: boolean;
};

const PLAN_OPTIONS: PlanOption[] = [
  {
    key: "monthly",
    name: "Monthly",
    billingCycle: "Monthly",
    price: 1000,
    projectsLimit: 999,
    schedulesLimit: 999999,
    description: "Flexible monthly access billed per active user.",
  },
  {
    key: "quarterly",
    name: "Quarterly",
    billingCycle: "Quarterly",
    price: 2800,
    projectsLimit: 999,
    schedulesLimit: 999999,
    description: "Lower effective cost with quarterly billing per user.",
    recommended: true,
  },
  {
    key: "half_yearly",
    name: "Half Yearly",
    billingCycle: "Half Yearly",
    price: 5000,
    projectsLimit: 999,
    schedulesLimit: 999999,
    description: "Six-month access for teams that want continuity and better value.",
  },
  {
    key: "annual",
    name: "Annual",
    billingCycle: "Annual",
    price: 8000,
    projectsLimit: 999,
    schedulesLimit: 999999,
    description: "Best-value annual access billed per user.",
  },
];

const COMPANY_UPI_ID = "teksys@upi";
const COMPANY_UPI_QR_PATH = "/company-upi-qr.png";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value?: string | number | null, currency = "INR") {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function metricLabel(metric: string) {
  return metric
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeMetric(metric: string) {
  return String(metric || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");
}

function isProjectMetric(metric: string) {
  const key = normalizeMetric(metric);
  return key.includes("project");
}

function isScheduleMetric(metric: string) {
  const key = normalizeMetric(metric);
  return key.includes("schedule") || key.includes("structure");
}

function getDaysToExpire(endDate?: string | null) {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((end.getTime() - now.getTime()) / msPerDay);
}

function getExpiryBadge(daysToExpire: number | null) {
  if (daysToExpire === null) {
    return {
      text: "N/A",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    };
  }
  if (daysToExpire < 0) {
    return {
      text: `Expired ${Math.abs(daysToExpire)}d ago`,
      className: "bg-rose-100 text-rose-700 border-rose-200",
    };
  }
  if (daysToExpire <= 7) {
    return {
      text: `${daysToExpire} days`,
      className: "bg-rose-100 text-rose-700 border-rose-200",
    };
  }
  if (daysToExpire <= 30) {
    return {
      text: `${daysToExpire} days`,
      className: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }
  return {
    text: `${daysToExpire} days`,
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
}

function statusClasses(status?: string) {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "TRIAL") return "bg-sky-100 text-sky-700 border-sky-200";
  if (s === "EXPIRED") return "bg-rose-100 text-rose-700 border-rose-200";
  if (s === "SUSPENDED") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getAlertTone(status?: string) {
  const s = (status || "").toUpperCase();
  if (s === "EXHAUSTED") {
    return {
      panel: "border-rose-200 bg-rose-50/90",
      badge: "bg-rose-100 text-rose-700 border-rose-200",
      bar: "bg-rose-500",
    };
  }
  if (s === "CRITICAL") {
    return {
      panel: "border-amber-200 bg-amber-50/90",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      bar: "bg-amber-500",
    };
  }
  return {
    panel: "border-emerald-200 bg-emerald-50/90",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
  };
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function SubscriptionPage() {
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [allocations, setAllocations] = useState<SubscriptionAllocationRow[]>([]);
  const [usage, setUsage] = useState<SubscriptionUsageRow[]>([]);
  const [alerts, setAlerts] = useState<SubscriptionAlertRow[]>([]);
  const [liveProjectCount, setLiveProjectCount] = useState<number | null>(null);
  const [liveScheduleCount, setLiveScheduleCount] = useState<number | null>(null);
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>(PLAN_OPTIONS[0].key);
  const [paymentMode, setPaymentMode] = useState<"UPI">("UPI");
  const [utrNumber, setUtrNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentStatusMessage, setPaymentStatusMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getAccessToken() || "";
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setAccessToken(token);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [subscriptionRes, allocationRes, usageRes, alertsRes, projectsRes] = await Promise.all([
          getCompanySubscription(accessToken),
          getCompanySubscriptionAllocations(accessToken),
          getCompanySubscriptionUsage(accessToken),
          getCompanySubscriptionAlerts(accessToken),
          getProjects(),
        ]);

        setSubscriptions(subscriptionRes?.rows || []);
        setAllocations(allocationRes?.rows || []);
        setUsage(usageRes?.rows || []);
        setAlerts(alertsRes?.alerts || []);
        const projectRows = projectsRes?.rows || [];
        setLiveProjectCount(projectRows.length);

        const scheduleListResponses = await Promise.all(
          projectRows.map((project) =>
            getSchedules(project.id).catch(() => ({ rows: [] }))
          )
        );
        const scheduleCount = scheduleListResponses.reduce(
          (sum, res) => sum + (Array.isArray(res?.rows) ? res.rows.length : 0),
          0
        );
        setLiveScheduleCount(scheduleCount);
      } catch (err: any) {
        setError(err?.message || "Failed to load subscription details");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [accessToken]);

  const currentSubscription = useMemo(() => {
    if (!subscriptions.length) return null;
    return subscriptions[0];
  }, [subscriptions]);
  const selectedPlan = useMemo(
    () => PLAN_OPTIONS.find((plan) => plan.key === selectedPlanKey) || PLAN_OPTIONS[0],
    [selectedPlanKey]
  );
  const daysToExpire = getDaysToExpire(currentSubscription?.end_date);
  const expiryBadge = getExpiryBadge(daysToExpire);
  const currentPlanLabel = currentSubscription
    ? `Plan #${currentSubscription.subscription_plan_id}`
    : "-";
  const lastPaidAmount = currentSubscription
    ? formatAmount(currentSubscription.amount, currentSubscription.currency_code || "INR")
    : "-";
  const liveProjects = liveProjectCount ?? 0;
  const liveSchedules = liveScheduleCount ?? 0;
  const exceedsProjectLimit = liveProjects > selectedPlan.projectsLimit;
  const exceedsScheduleLimit = liveSchedules > selectedPlan.schedulesLimit;
  const daysToExpireValue =
    daysToExpire === null ? "N/A" : daysToExpire < 0 ? "Expired" : String(daysToExpire);
  const upiLink = `upi://pay?pa=${encodeURIComponent(COMPANY_UPI_ID)}&pn=${encodeURIComponent(
    "Teksys Enterprises"
  )}&am=${selectedPlan.price.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Subscription-${selectedPlan.name}`
  )}`;

  useEffect(() => {
    setPaidAmount(String(selectedPlan.price));
  }, [selectedPlan]);

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(COMPANY_UPI_ID);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 1500);
    } catch {
      setCopiedUpi(false);
    }
  }

  function submitPaymentRequest(e: FormEvent) {
    e.preventDefault();
    setPaymentError("");
    setPaymentStatusMessage("");

    if (paymentMode !== "UPI") {
      setPaymentError("Only UPI mode is enabled currently.");
      return;
    }

    if (!utrNumber.trim()) {
      setPaymentError("Please enter UTR / transaction reference number.");
      return;
    }

    const amountNum = Number(paidAmount || 0);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setPaymentError("Please enter valid paid amount.");
      return;
    }

    setPaymentStatusMessage(
      paymentNote.trim()
        ? "Payment details submitted with note. Verification is pending by the accounts team."
        : "Payment details submitted. Verification is pending by the accounts team."
    );
  }

  const usageViewRows = useMemo<UsageViewRow[]>(() => {
    const allocationMap = new Map<string, number>();
    const usageMap = new Map<string, number>();

    allocations.forEach((row) => {
      allocationMap.set(row.metric, Number(row.allocated_value || 0));
    });

    usage.forEach((row) => {
      usageMap.set(row.metric, Number(row.used_value || 0));
    });

    const metrics = Array.from(
      new Set([...allocationMap.keys(), ...usageMap.keys()])
    ).sort();

    return metrics.map((metric) => {
      const allocated = allocationMap.get(metric) || 0;
      let used = usageMap.get(metric) || 0;

      if (isProjectMetric(metric) && liveProjectCount !== null) {
        used = liveProjectCount;
      } else if (isScheduleMetric(metric) && liveScheduleCount !== null) {
        used = liveScheduleCount;
      }

      return {
        metric,
        allocated,
        used,
        remaining: allocated - used,
      };
    });
  }, [allocations, usage, liveProjectCount, liveScheduleCount]);

  const effectiveAlerts = useMemo(() => {
    return alerts.map((alert) => {
      const allocated = Number(alert.allocated_value || 0);
      let used = Number(alert.used_value || 0);

      if (isProjectMetric(alert.metric) && liveProjectCount !== null) {
        used = liveProjectCount;
      } else if (isScheduleMetric(alert.metric) && liveScheduleCount !== null) {
        used = liveScheduleCount;
      }

      const available = allocated - used;
      const usagePct = allocated > 0 ? Number(((used / allocated) * 100).toFixed(1)) : 0;

      return {
        ...alert,
        used_value: used,
        available_value: available,
        usage_pct: usagePct,
      };
    });
  }, [alerts, liveProjectCount, liveScheduleCount]);

  const usageHighlights = useMemo(() => {
    return usageViewRows
      .filter((row) => row.allocated > 0 || row.used > 0)
      .slice(0, 6);
  }, [usageViewRows]);

  const selectedPlanAmountLabel = formatAmount(selectedPlan.price, "INR");
  const pageCardClass =
    "rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(32,15,8,0.2)]";
  const kpiCardClass =
    "group rounded-2xl border border-[#e7d4c6] bg-white p-4 shadow-[0_10px_28px_rgba(32,15,8,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(32,15,8,0.28)]";

  return (
    <div
      className="min-h-screen px-4 py-5 md:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at top, #1e3a8a 0%, #172554 26%, #0f172a 68%, #020617 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <CompanyPageHeader />

        <section className="relative overflow-hidden rounded-[30px] border border-white/15 bg-gradient-to-br from-[#0B1120]/95 via-[#172554]/90 to-[#0F172A]/95 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#f0c98f]/15 blur-2xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div>
                <Link
                  href="/company/dashboard"
                  className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-white shadow-sm transition hover:bg-white/20 sm:text-sm"
                >
                  Back to Dashboard
                </Link>
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-wide text-[#fff5e8] md:text-4xl">
                  Subscription & Billing
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-white/85 md:text-base">
                  Choose the right plan, pay via UPI, and track live project and schedule usage in
                  one place.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full border border-white/25 bg-black/20 px-3 py-1 text-white/90">
                  Active Plan: {currentPlanLabel}
                </span>
                <span className="rounded-full border border-white/25 bg-black/20 px-3 py-1 text-white/90">
                  Renewal Amount: {selectedPlanAmountLabel}
                </span>
                <span className="rounded-full border border-white/25 bg-black/20 px-3 py-1 text-white/90">
                  UPI: {COMPANY_UPI_ID}
                </span>
              </div>
            </div>

            <aside className="w-full rounded-2xl border border-white/20 bg-black/20 p-4 shadow-lg backdrop-blur-[1px] xl:max-w-[280px]">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Subscription Health
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {currentSubscription ? (
                  <span
                    className={classNames(
                      "inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
                      statusClasses(currentSubscription.status)
                    )}
                  >
                    {currentSubscription.status}
                  </span>
                ) : null}
                <span
                  className={classNames(
                    "inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
                    expiryBadge.className
                  )}
                >
                  {expiryBadge.text}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-2">
                  <div className="uppercase tracking-wider text-white/60">Projects</div>
                  <div className="font-bold text-[#fff4e8]">{liveProjects}</div>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-2">
                  <div className="uppercase tracking-wider text-white/60">Schedules</div>
                  <div className="font-bold text-[#fff4e8]">{liveSchedules}</div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {error ? (
          <section className="rounded-[24px] border border-red-200 bg-red-50 px-6 py-4 text-red-700 shadow-xl">
            {error}
          </section>
        ) : null}

        {loading ? (
          <section className={pageCardClass}>
            <div className="text-slate-900">Loading subscription details...</div>
          </section>
        ) : null}

        {!loading && !error && !currentSubscription ? (
          <section className={pageCardClass}>
            <div className="text-slate-900">No subscription record found for this company.</div>
          </section>
        ) : null}

        {!loading && !error && currentSubscription ? (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <div className={kpiCardClass}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Current Plan
                </div>
                <div className="mt-2 text-xl font-black text-slate-900">{currentPlanLabel}</div>
                <div className="mt-1 text-xs text-slate-600">
                  {currentSubscription.billing_cycle || "-"}
                </div>
              </div>

              <div className={kpiCardClass}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Last Paid
                </div>
                <div className="mt-2 text-xl font-black text-slate-900">{lastPaidAmount}</div>
                <div className="mt-1 text-xs text-slate-600">Previous billing transaction</div>
              </div>

              <div className={kpiCardClass}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Validity
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900">
                  {formatDate(currentSubscription.start_date)}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  to {formatDate(currentSubscription.end_date)}
                </div>
              </div>

              <div className={kpiCardClass}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Days To Expire
                </div>
                <div className="mt-2 text-xl font-black text-slate-900">{daysToExpireValue}</div>
                <div className="mt-1 text-xs text-slate-600">
                  {daysToExpire !== null && daysToExpire < 0
                    ? `Expired ${Math.abs(daysToExpire)} day(s) ago`
                    : "Subscription runway"}
                </div>
              </div>

              <div className={kpiCardClass}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Live Projects
                </div>
                <div className="mt-2 text-xl font-black text-slate-900">
                  {liveProjects} / {selectedPlan.projectsLimit}
                </div>
                <div
                  className={classNames(
                    "mt-1 text-xs font-semibold",
                    exceedsProjectLimit ? "text-rose-700" : "text-emerald-700"
                  )}
                >
                  {exceedsProjectLimit ? "Over selected plan limit" : "Within selected plan limit"}
                </div>
              </div>

              <div className={kpiCardClass}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Live Schedules
                </div>
                <div className="mt-2 text-xl font-black text-slate-900">
                  {liveSchedules} / {selectedPlan.schedulesLimit}
                </div>
                <div
                  className={classNames(
                    "mt-1 text-xs font-semibold",
                    exceedsScheduleLimit ? "text-rose-700" : "text-emerald-700"
                  )}
                >
                  {exceedsScheduleLimit
                    ? "Over selected plan limit"
                    : "Within selected plan limit"}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <section className={pageCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black tracking-wide text-slate-900">
                    Select Subscription Plan
                  </h2>
                  <span className="rounded-full border border-[#d8c1ae] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {PLAN_OPTIONS.length} plans
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Plan selection updates payment amount and instantly validates live usage against
                  limits.
                </p>

                <div className="mt-5 grid gap-3">
                  {PLAN_OPTIONS.map((plan) => {
                    const isSelected = selectedPlanKey === plan.key;
                    const projectsOver = liveProjects > plan.projectsLimit;
                    const schedulesOver = liveSchedules > plan.schedulesLimit;

                    return (
                      <button
                        key={plan.key}
                        type="button"
                        onClick={() => setSelectedPlanKey(plan.key)}
                        className={classNames(
                          "rounded-2xl border p-4 text-left transition duration-200",
                          isSelected
                            ? "border-[#7b4a2d] bg-[#fff3e8] shadow-md ring-1 ring-[#d6b49a]"
                            : "border-[#e7d4c6] bg-white hover:border-[#d1b29a] hover:shadow-sm"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={classNames(
                                "h-3 w-3 rounded-full border",
                                isSelected
                                  ? "border-slate-800 bg-slate-900"
                                  : "border-[#c8ab96] bg-white"
                              )}
                            />
                            <div className="text-lg font-black text-slate-900">{plan.name}</div>
                            {plan.recommended ? (
                              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                Recommended
                              </span>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <div className="text-base font-black text-slate-900">
                              {formatAmount(plan.price, "INR")}
                            </div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {plan.billingCycle}
                            </div>
                          </div>
                        </div>

                        <p className="mt-2 text-sm text-slate-600">{plan.description}</p>

                        <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                          <div className="rounded-lg border border-[#eadacc] bg-white px-3 py-2">
                            Projects: {liveProjects} / {plan.projectsLimit}
                            <div
                              className={classNames(
                                "mt-1",
                                projectsOver ? "text-rose-700" : "text-emerald-700"
                              )}
                            >
                              {projectsOver
                                ? "Current usage exceeds this plan"
                                : "Fits current usage"}
                            </div>
                          </div>
                          <div className="rounded-lg border border-[#eadacc] bg-white px-3 py-2">
                            Schedules: {liveSchedules} / {plan.schedulesLimit}
                            <div
                              className={classNames(
                                "mt-1",
                                schedulesOver ? "text-rose-700" : "text-emerald-700"
                              )}
                            >
                              {schedulesOver
                                ? "Current usage exceeds this plan"
                                : "Fits current usage"}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className={classNames(pageCardClass, "xl:sticky xl:top-6 h-fit")}>
                <h2 className="text-xl font-black tracking-wide text-slate-900">Payment</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Current gateway mode is UPI only. Pay to company UPI and submit transaction
                  reference for verification.
                </p>

                <div className="mt-4 rounded-xl border border-[#e4d1c2] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Payment Mode
                  </div>
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-900">
                    <input
                      type="radio"
                      checked={paymentMode === "UPI"}
                      onChange={() => setPaymentMode("UPI")}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    UPI
                  </label>
                </div>

                <div className="mt-3 rounded-xl border border-[#e4d1c2] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Company UPI ID
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <code className="rounded-md bg-[#f4e5d9] px-2 py-1 text-sm font-bold text-slate-900">
                      {COMPANY_UPI_ID}
                    </code>
                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="rounded-full border border-[#d8c1ae] px-3 py-1 text-xs font-semibold text-[#6e4d3a] transition hover:bg-[#f7ece3]"
                    >
                      {copiedUpi ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-[#e4d1c2] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Scan & Pay
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <img
                      src={COMPANY_UPI_QR_PATH}
                      alt="Company UPI QR"
                      className="h-24 w-24 rounded-lg border border-[#eadacc] bg-white object-contain p-1"
                    />
                    <div className="text-xs text-slate-600">
                      <div>
                        Selected Plan:{" "}
                        <span className="font-bold text-slate-900">{selectedPlan.name}</span>
                      </div>
                      <div>
                        Amount:{" "}
                        <span className="font-bold text-slate-900">{selectedPlanAmountLabel}</span>
                      </div>
                      <a
                        href={upiLink}
                        className="mt-2 inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-indigo-700"
                      >
                        Open UPI App
                      </a>
                    </div>
                  </div>
                </div>

                <form onSubmit={submitPaymentRequest} className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Paid Amount (INR)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full rounded-xl border border-[#d7c2b2] bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[#c29b7f] focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      UTR / Transaction Reference
                    </label>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="Enter UTR number"
                      className="w-full rounded-xl border border-[#d7c2b2] bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[#c29b7f] focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Payment Note (Optional)
                    </label>
                    <textarea
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      rows={3}
                      placeholder="Any reference for accounts team"
                      className="w-full rounded-xl border border-[#d7c2b2] bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[#c29b7f] focus:ring-2"
                    />
                  </div>

                  {paymentError ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {paymentError}
                    </div>
                  ) : null}

                  {paymentStatusMessage ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      {paymentStatusMessage}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#2563EB] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:from-[#4338CA] hover:to-[#1D4ED8]"
                  >
                    Submit For Verification
                  </button>
                </form>
              </section>
            </section>

            <section className={pageCardClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black tracking-wide text-slate-900">Usage Health</h2>
                <span className="rounded-full border border-[#d8c1ae] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {effectiveAlerts.length} alert metrics
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-[#e4d1c2] bg-white p-4 shadow-sm">
                  <div className="text-sm font-bold text-slate-900">Allocation vs Live Usage</div>
                  <div className="mt-3 space-y-3">
                    {usageHighlights.length ? (
                      usageHighlights.map((row) => {
                        const usagePct =
                          row.allocated > 0
                            ? Math.min(100, Math.max(0, (row.used / row.allocated) * 100))
                            : 0;
                        return (
                          <div key={row.metric}>
                            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-600">
                              <span className="font-semibold text-slate-900">
                                {metricLabel(row.metric)}
                              </span>
                              <span>
                                {row.used} / {row.allocated}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-[#f2e4d8]">
                              <div
                                className="h-2 rounded-full bg-indigo-600 transition-all"
                                style={{ width: `${usagePct}%` }}
                              />
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              Remaining: {row.remaining}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-slate-600">
                        No allocation/usage metrics available.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {effectiveAlerts.length ? (
                    effectiveAlerts.map((alert) => {
                      const tone = getAlertTone(alert.status);
                      const usagePct = Math.min(100, Math.max(0, Number(alert.usage_pct || 0)));
                      return (
                        <div
                          key={alert.metric}
                          className={classNames("rounded-xl border p-3 shadow-sm", tone.panel)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-bold text-slate-900">
                              {metricLabel(alert.metric)}
                            </div>
                            <span
                              className={classNames(
                                "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                                tone.badge
                              )}
                            >
                              {alert.status}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                            <div>
                              Allocated:{" "}
                              <span className="font-bold text-slate-900">
                                {alert.allocated_value}
                              </span>
                            </div>
                            <div>
                              Used:{" "}
                              <span className="font-bold text-slate-900">{alert.used_value}</span>
                            </div>
                            <div>
                              Available:{" "}
                              <span className="font-bold text-slate-900">
                                {alert.available_value}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-white/80">
                            <div
                              className={classNames("h-2 rounded-full transition-all", tone.bar)}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                      Usage is healthy. No active subscription alerts.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
