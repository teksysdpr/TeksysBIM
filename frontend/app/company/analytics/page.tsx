"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, BrainCircuit, LineChart, ShieldAlert, Sparkles } from "lucide-react";
import CompanyPageHeader from "@/app/components/company/CompanyPageHeader";
import { runProjectIntelligenceAnalysis } from "@/app/services/projectIntelligenceService";
import type {
  ProjectIntelligenceAnalyzeRequest,
  ProjectIntelligenceAnalyzeResponse,
} from "@/lib/projectIntelligence";

const SAMPLE_PAYLOAD: ProjectIntelligenceAnalyzeRequest = {
  project: {
    project_id: 101,
    project_name: "Aishwaryam Heights Tower-A",
    project_type: "Residential Building",
    location: "Bengaluru",
    start_date: "2026-01-01",
    planned_finish_date: "2026-12-30",
  },
  baseline_no: 1,
  as_of_date: "2026-03-21",
  activities: [
    {
      activity_id: "1",
      activity_name: "Excavation",
      planned_start: "2026-01-01",
      planned_finish: "2026-01-15",
      planned_duration_days: 15,
      planned_qty: 1500,
      actual_start: "2026-01-01",
      actual_finish: "2026-01-14",
      actual_qty: 1500,
      progress_percent: 100,
      status: "COMPLETED",
      is_critical: true,
      planned_manpower: 24,
      actual_manpower: 24,
    },
    {
      activity_id: "2",
      activity_name: "PCC",
      planned_start: "2026-01-16",
      planned_finish: "2026-01-30",
      planned_duration_days: 15,
      planned_qty: 400,
      actual_start: "2026-01-17",
      actual_qty: 280,
      progress_percent: 70,
      predecessor: "1FS",
      status: "IN_PROGRESS",
      is_critical: true,
      planned_manpower: 16,
      actual_manpower: 12,
      delay_reason: "Material delivery delay",
    },
    {
      activity_id: "3",
      activity_name: "Footing Reinforcement",
      planned_start: "2026-02-01",
      planned_finish: "2026-02-20",
      planned_duration_days: 20,
      planned_qty: 120,
      actual_start: "2026-02-03",
      actual_qty: 55,
      progress_percent: 46,
      predecessor: "2FS",
      status: "IN_PROGRESS",
      is_critical: true,
      planned_manpower: 20,
      actual_manpower: 13,
      delay_reason: "Labour shortage",
    },
    {
      activity_id: "4",
      activity_name: "Footing Concrete",
      planned_start: "2026-02-21",
      planned_finish: "2026-03-10",
      planned_duration_days: 18,
      planned_qty: 600,
      actual_start: "2026-03-02",
      actual_qty: 180,
      progress_percent: 30,
      predecessor: "3FS",
      status: "IN_PROGRESS",
      is_critical: true,
      planned_machinery_hours: 90,
      actual_machinery_hours: 52,
      delay_reason: "Machinery breakdown",
    },
    {
      activity_id: "5",
      activity_name: "Plinth Beam",
      planned_start: "2026-03-11",
      planned_finish: "2026-03-25",
      planned_duration_days: 15,
      planned_qty: 320,
      actual_qty: 0,
      predecessor: "4FS",
      status: "NOT_STARTED",
      is_critical: false,
    },
  ],
};

function formatPct(value: number) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatCount(value: number) {
  return Number(value || 0).toLocaleString();
}

export default function Page() {
  const [jsonText, setJsonText] = useState(
    JSON.stringify(SAMPLE_PAYLOAD, null, 2)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<ProjectIntelligenceAnalyzeResponse | null>(
    null
  );

  async function runAnalysis() {
    setLoading(true);
    setError("");
    try {
      const parsed = JSON.parse(jsonText) as ProjectIntelligenceAnalyzeRequest;
      const response = await runProjectIntelligenceAnalysis(parsed);
      setAnalysis(response);
    } catch (err: any) {
      setError(err?.message || "Failed to run analysis.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen erp-page-bg p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <CompanyPageHeader />

        <section className="text-white">
          <div className="mb-2">
            <Link
              href="/company/dashboard"
              className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-white shadow-sm sm:text-sm"
            >
              Back to Dashboard
            </Link>
          </div>

          <h2 className="text-3xl font-extrabold tracking-wide">AI Project Intelligence</h2>
          <p className="mt-2 text-sm text-white/85 md:text-base">
            Analyze planned vs actual progress, predict delay risk, detect anomalies, and generate
            recovery actions for PMO and project leadership.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
            <Sparkles className="h-3.5 w-3.5" />
            Decision Support Engine v1
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-xl md:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                Structured Input (JSON)
              </div>
              <button
                type="button"
                onClick={() => setJsonText(JSON.stringify(SAMPLE_PAYLOAD, null, 2))}
                className="rounded-full border border-[#b38969] bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-[#f7efe6]"
              >
                Load Sample
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              className="h-[420px] w-full resize-y rounded-2xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 outline-none focus:border-indigo-500"
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void runAnalysis()}
                disabled={loading}
                className="rounded-full bg-gradient-to-r from-[#4F46E5] to-[#2563EB] px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Analyzing..." : "Run Intelligence"}
              </button>
            </div>
            {error ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-xl md:p-5">
            <div className="mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-900">
              Executive Summary
            </div>
            {analysis ? (
              <div className="space-y-2 text-sm text-slate-900">
                {analysis.executive_summary.map((line, index) => (
                  <div key={`${line}-${index}`} className="rounded-xl bg-white p-3 shadow-sm">
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#c8a992] bg-white p-4 text-sm text-[#7f5e49]">
                Run analysis to generate a concise decision summary for this project.
              </div>
            )}
          </div>
        </section>

        {analysis ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Planned Progress
                </div>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {formatPct(analysis.summary.planned_progress_pct)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actual Progress
                </div>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {formatPct(analysis.summary.actual_progress_pct)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Variance
                </div>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {formatPct(analysis.summary.progress_variance_pct)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Delay Risk
                </div>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {formatCount(analysis.summary.project_delay_risk_pct)}%
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Delay Impact
                </div>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {formatCount(analysis.summary.projected_project_delay_days)} d
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-xl md:p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-900">
                  <ShieldAlert className="h-4 w-4" />
                  Top Risks
                </div>
                <div className="space-y-2">
                  {analysis.risks.slice(0, 6).map((risk) => (
                    <div key={`risk-${risk.activity_id}`} className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{risk.activity_name}</div>
                          <div className="mt-1 text-xs text-[#805f49]">
                            {risk.probability_pct}% probability | {risk.impact_days} day(s) impact
                          </div>
                        </div>
                        <span className="rounded-full bg-[#f0e0d2] px-2 py-1 text-[10px] font-bold text-slate-900">
                          {risk.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-xl md:p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-900">
                  <BrainCircuit className="h-4 w-4" />
                  Corrective Actions
                </div>
                <div className="space-y-2">
                  {analysis.actions.length ? (
                    analysis.actions.map((action) => (
                      <div
                        key={`action-${action.activity_id}`}
                        className="rounded-xl border border-[#ead7c8] bg-white p-3 shadow-sm"
                      >
                        <div className="text-sm font-bold text-slate-900">{action.activity_name}</div>
                        <div className="mt-1 text-xs text-[#6a4733]">{action.action}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          Expected impact: {action.expected_impact}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#c8a992] bg-white p-3 text-sm text-[#7f5e49]">
                      No corrective action needed from current data.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-xl md:p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-900">
                  <AlertTriangle className="h-4 w-4" />
                  Data Anomalies
                </div>
                <div className="space-y-2">
                  {analysis.anomalies.length ? (
                    analysis.anomalies.map((issue, idx) => (
                      <div key={`anomaly-${idx}`} className="rounded-xl bg-white p-3 shadow-sm">
                        <div className="text-sm font-semibold text-slate-900">
                          {issue.activity_name} - {issue.type}
                        </div>
                        <div className="mt-1 text-xs text-[#6b4b38]">{issue.detail}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#c8a992] bg-white p-3 text-sm text-[#7f5e49]">
                      No anomalies detected from current payload.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-xl md:p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-900">
                  <LineChart className="h-4 w-4" />
                  Lowest Productivity
                </div>
                <div className="space-y-2">
                  {analysis.productivity.slice(0, 6).map((item) => (
                    <div key={`prod-${item.activity_id}`} className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="text-sm font-semibold text-slate-900">{item.activity_name}</div>
                      <div className="mt-1 text-xs text-[#6b4b38]">{item.insight}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
