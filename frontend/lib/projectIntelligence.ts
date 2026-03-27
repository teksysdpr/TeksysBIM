export type ProjectIntelligenceProject = {
  project_id?: number | string;
  project_name: string;
  project_type?: string | null;
  location?: string | null;
  start_date?: string | null;
  planned_finish_date?: string | null;
};

export type ProjectIntelligenceActivity = {
  activity_id: number | string;
  activity_name: string;
  parent_activity_id?: number | string | null;
  baseline_no?: number | null;
  planned_start?: string | null;
  planned_finish?: string | null;
  planned_duration_days?: number | null;
  planned_qty?: number | null;
  actual_start?: string | null;
  actual_finish?: string | null;
  actual_qty?: number | null;
  progress_percent?: number | null;
  predecessor?: string | null;
  status?: string | null;
  is_critical?: boolean | null;
  delay_reason?: string | null;
  planned_manpower?: number | null;
  actual_manpower?: number | null;
  planned_machinery_hours?: number | null;
  actual_machinery_hours?: number | null;
};

export type ProjectIntelligenceAnalyzeRequest = {
  project: ProjectIntelligenceProject;
  as_of_date?: string | null;
  baseline_no?: number | null;
  activities: ProjectIntelligenceActivity[];
};

export type ProjectIntelligenceVariance = {
  activity_id: string;
  activity_name: string;
  expected_progress_pct: number;
  actual_progress_pct: number;
  progress_variance_pct: number;
  schedule_delay_days: number;
};

export type ProjectIntelligenceRisk = {
  activity_id: string;
  activity_name: string;
  probability_pct: number;
  impact_days: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reasons: string[];
};

export type ProjectIntelligenceAction = {
  activity_id: string;
  activity_name: string;
  priority: "HIGH" | "MEDIUM";
  action: string;
  expected_impact: string;
};

export type ProjectIntelligenceAnomaly = {
  activity_id: string;
  activity_name: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  detail: string;
};

export type ProjectIntelligenceProductivity = {
  activity_id: string;
  activity_name: string;
  planned_productivity_per_day: number | null;
  actual_productivity_per_day: number | null;
  productivity_variance_pct: number | null;
  insight: string;
};

export type ProjectIntelligenceSummary = {
  as_of_date: string;
  project_name: string;
  total_activities: number;
  completed_activities: number;
  delayed_activities: number;
  high_risk_activities: number;
  anomaly_count: number;
  planned_progress_pct: number;
  actual_progress_pct: number;
  progress_variance_pct: number;
  projected_project_delay_days: number;
  project_delay_risk_pct: number;
};

export type ProjectIntelligenceAnalyzeResponse = {
  summary: ProjectIntelligenceSummary;
  variance: ProjectIntelligenceVariance[];
  risks: ProjectIntelligenceRisk[];
  actions: ProjectIntelligenceAction[];
  anomalies: ProjectIntelligenceAnomaly[];
  productivity: ProjectIntelligenceProductivity[];
  executive_summary: string[];
};

type DerivedRow = {
  activityId: string;
  activityName: string;
  expectedPct: number;
  actualPct: number;
  variancePct: number;
  scheduleDelayDays: number;
  progressGap: number;
  shortfallPct: number;
  riskScore: number;
  impactDays: number;
  reasons: string[];
  isCritical: boolean;
  plannedProductivity: number | null;
  actualProductivity: number | null;
  productivityVariancePct: number | null;
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function toDateOnly(value?: string | null): string | null {
  const d = parseDate(value);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function diffDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function diffDaysInclusive(from: Date, to: Date): number {
  return diffDays(from, to) + 1;
}

function getExpectedProgressPct(activity: ProjectIntelligenceActivity, asOf: Date): number {
  const plannedStart = parseDate(activity.planned_start);
  const plannedFinish = parseDate(activity.planned_finish);
  if (!plannedStart || !plannedFinish) return 0;
  if (asOf <= plannedStart) return 0;
  if (asOf >= plannedFinish) return 100;

  const totalDays = Math.max(1, diffDaysInclusive(plannedStart, plannedFinish));
  const elapsedDays = Math.max(0, diffDaysInclusive(plannedStart, asOf));
  return clamp((elapsedDays / totalDays) * 100, 0, 100);
}

function getActualProgressPct(activity: ProjectIntelligenceActivity): number {
  const progress = toNumber(activity.progress_percent);
  if (progress !== null) return clamp(progress, 0, 100);

  const plannedQty = toNumber(activity.planned_qty);
  const actualQty = toNumber(activity.actual_qty);
  if (plannedQty && plannedQty > 0 && actualQty !== null) {
    return clamp((actualQty / plannedQty) * 100, 0, 100);
  }

  const status = String(activity.status || "").toUpperCase();
  if (status === "COMPLETED") return 100;
  if (status === "IN_PROGRESS" || status === "ACTIVE") return 50;
  return 0;
}

function getScheduleDelayDays(activity: ProjectIntelligenceActivity, asOf: Date): number {
  const plannedFinish = parseDate(activity.planned_finish);
  if (!plannedFinish) return 0;

  const status = String(activity.status || "").toUpperCase();
  const referenceDate =
    status === "COMPLETED" ? parseDate(activity.actual_finish) || asOf : asOf;

  const rawDelay = diffDays(plannedFinish, referenceDate);
  return Math.max(0, rawDelay);
}

function getShortfallPct(activity: ProjectIntelligenceActivity): number {
  const manpowerPlan = toNumber(activity.planned_manpower);
  const manpowerActual = toNumber(activity.actual_manpower);
  const machineryPlan = toNumber(activity.planned_machinery_hours);
  const machineryActual = toNumber(activity.actual_machinery_hours);

  const manpowerShortfall =
    manpowerPlan && manpowerPlan > 0 && manpowerActual !== null
      ? clamp(((manpowerPlan - manpowerActual) / manpowerPlan) * 100, 0, 100)
      : 0;
  const machineryShortfall =
    machineryPlan && machineryPlan > 0 && machineryActual !== null
      ? clamp(((machineryPlan - machineryActual) / machineryPlan) * 100, 0, 100)
      : 0;

  return Math.max(manpowerShortfall, machineryShortfall);
}

function getProductivity(activity: ProjectIntelligenceActivity, asOf: Date) {
  const plannedQty = toNumber(activity.planned_qty);
  const actualQty = toNumber(activity.actual_qty);
  const plannedDuration = toNumber(activity.planned_duration_days);

  const plannedProductivity =
    plannedQty !== null && plannedDuration && plannedDuration > 0
      ? plannedQty / plannedDuration
      : null;

  const actualStart = parseDate(activity.actual_start) || parseDate(activity.planned_start);
  const actualFinish = parseDate(activity.actual_finish);
  const status = String(activity.status || "").toUpperCase();
  const activeEnd = status === "COMPLETED" && actualFinish ? actualFinish : asOf;

  const elapsedDays =
    actualStart && activeEnd ? Math.max(1, diffDaysInclusive(actualStart, activeEnd)) : null;
  const actualProductivity =
    actualQty !== null && elapsedDays && elapsedDays > 0 ? actualQty / elapsedDays : null;

  const productivityVariancePct =
    plannedProductivity && plannedProductivity > 0 && actualProductivity !== null
      ? ((actualProductivity - plannedProductivity) / plannedProductivity) * 100
      : null;

  return {
    plannedProductivity,
    actualProductivity,
    productivityVariancePct,
  };
}

function getRiskSeverity(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score >= 80) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function parsePredecessorIds(value?: string | null): string[] {
  if (!value) return [];
  const matches = value.match(/\d+(?:\.\d+)?/g);
  return matches ? [...new Set(matches)] : [];
}

function getRiskAndReasons(
  activity: ProjectIntelligenceActivity,
  delayDays: number,
  progressGap: number,
  shortfallPct: number
) {
  const plannedDuration = Math.max(1, toNumber(activity.planned_duration_days) || 1);
  const delayRisk = clamp((delayDays / plannedDuration) * 100, 0, 100);
  const gapRisk = clamp(progressGap, 0, 100);
  const resourceRisk = clamp(shortfallPct, 0, 100);
  const criticalBoost = activity.is_critical ? 10 : 0;
  const delayReasonText = String(activity.delay_reason || "").trim();

  const rawScore = delayRisk * 0.45 + gapRisk * 0.35 + resourceRisk * 0.2 + criticalBoost;
  const score = clamp(rawScore, 0, 100);
  const impactDays = Math.max(delayDays, Math.ceil(progressGap / 10));

  const reasons: string[] = [];
  if (delayDays > 0) reasons.push(`Running ${delayDays} day(s) behind planned finish.`);
  if (progressGap >= 10) reasons.push(`Progress is ${round2(progressGap)}% below expected.`);
  if (shortfallPct >= 15) reasons.push(`Resource shortfall is ${round2(shortfallPct)}%.`);
  if (activity.is_critical) reasons.push("Marked as critical activity.");
  if (delayReasonText) reasons.push(`Recorded delay reason: ${delayReasonText}`);
  if (!reasons.length && score >= 50) {
    reasons.push("Trend indicates increasing schedule slippage risk.");
  }

  return {
    riskScore: score,
    impactDays,
    reasons,
  };
}

function getActionForRisk(row: DerivedRow, delayReason: string) {
  const reason = delayReason.toLowerCase();
  if (reason.includes("material")) {
    return {
      action:
        "Expedite procurement for pending material and lock 7-day consumption plan with supplier commitment.",
      expectedImpact: `Can recover about ${Math.max(1, Math.ceil(row.impactDays * 0.4))} day(s).`,
    };
  }
  if (reason.includes("labour") || reason.includes("manpower") || row.shortfallPct >= 20) {
    const increase = Math.max(15, Math.ceil(row.shortfallPct));
    return {
      action: `Increase manpower deployment by ${increase}% for the next 5-7 working days.`,
      expectedImpact: `Can recover about ${Math.max(1, Math.ceil(row.impactDays * 0.35))} day(s).`,
    };
  }
  if (reason.includes("weather")) {
    return {
      action:
        "Resequence weather-sensitive tasks and parallelize indoor/non-weather fronts to protect milestones.",
      expectedImpact: `Can protect ${Math.max(1, Math.ceil(row.impactDays * 0.3))} day(s) of further slippage.`,
    };
  }
  if (reason.includes("approval") || reason.includes("drawing") || reason.includes("design")) {
    return {
      action: "Escalate pending approvals with a dated closure tracker and daily follow-up till resolution.",
      expectedImpact: `Can reduce decision-driven delay by ${Math.max(1, Math.ceil(row.impactDays * 0.4))} day(s).`,
    };
  }
  return {
    action:
      "Prepare a micro-recovery plan: split task into executable fronts, run parallel crews, and monitor daily output.",
    expectedImpact: `Can recover around ${Math.max(1, Math.ceil(row.impactDays * 0.3))} day(s).`,
  };
}

function collectAnomalies(
  activity: ProjectIntelligenceActivity,
  asOf: Date,
  knownIds: Set<string>
): ProjectIntelligenceAnomaly[] {
  const anomalies: ProjectIntelligenceAnomaly[] = [];
  const activityId = String(activity.activity_id);
  const activityName = activity.activity_name;
  const plannedStart = parseDate(activity.planned_start);
  const plannedFinish = parseDate(activity.planned_finish);
  const actualStart = parseDate(activity.actual_start);
  const actualFinish = parseDate(activity.actual_finish);
  const status = String(activity.status || "").toUpperCase();
  const plannedQty = toNumber(activity.planned_qty);
  const actualQty = toNumber(activity.actual_qty);
  const progressPctRaw = toNumber(activity.progress_percent);

  if (plannedStart && plannedFinish && plannedFinish < plannedStart) {
    anomalies.push({
      activity_id: activityId,
      activity_name: activityName,
      type: "DATE_SEQUENCE",
      severity: "HIGH",
      detail: "Planned finish is earlier than planned start.",
    });
  }

  if (progressPctRaw !== null && (progressPctRaw < 0 || progressPctRaw > 100)) {
    anomalies.push({
      activity_id: activityId,
      activity_name: activityName,
      type: "INVALID_PROGRESS",
      severity: "HIGH",
      detail: `Progress percent ${progressPctRaw}% is outside 0-100 range.`,
    });
  }

  if (plannedQty !== null && plannedQty > 0 && actualQty !== null && actualQty > plannedQty * 1.15) {
    anomalies.push({
      activity_id: activityId,
      activity_name: activityName,
      type: "QTY_OVERREPORT",
      severity: "HIGH",
      detail: `Actual quantity ${actualQty} exceeds planned quantity ${plannedQty} by >15%.`,
    });
  }

  if (actualQty !== null && actualQty > 0 && !actualStart) {
    anomalies.push({
      activity_id: activityId,
      activity_name: activityName,
      type: "MISSING_ACTUAL_START",
      severity: "MEDIUM",
      detail: "Actual quantity exists but actual start date is missing.",
    });
  }

  if (status === "COMPLETED" && !actualFinish) {
    anomalies.push({
      activity_id: activityId,
      activity_name: activityName,
      type: "MISSING_ACTUAL_FINISH",
      severity: "MEDIUM",
      detail: "Status is completed but actual finish date is missing.",
    });
  }

  if (status === "NOT_STARTED" && actualQty !== null && actualQty > 0) {
    anomalies.push({
      activity_id: activityId,
      activity_name: activityName,
      type: "STATUS_MISMATCH",
      severity: "HIGH",
      detail: "Status is not started but actual quantity has been reported.",
    });
  }

  if (plannedStart && !actualStart && asOf > plannedStart && status !== "COMPLETED") {
    anomalies.push({
      activity_id: activityId,
      activity_name: activityName,
      type: "LATE_START_SIGNAL",
      severity: "LOW",
      detail: "Planned start date has passed but no actual start is recorded.",
    });
  }

  for (const predecessorId of parsePredecessorIds(activity.predecessor)) {
    if (!knownIds.has(predecessorId)) {
      anomalies.push({
        activity_id: activityId,
        activity_name: activityName,
        type: "BROKEN_DEPENDENCY",
        severity: "MEDIUM",
        detail: `Predecessor reference ${predecessorId} is not found in activity list.`,
      });
      break;
    }
  }

  return anomalies;
}

export function analyzeProjectIntelligence(
  payload: ProjectIntelligenceAnalyzeRequest
): ProjectIntelligenceAnalyzeResponse {
  const asOfDate = toDateOnly(payload.as_of_date) || new Date().toISOString().slice(0, 10);
  const asOf = parseDate(asOfDate);
  if (!asOf) {
    throw new Error("Invalid as_of_date value.");
  }

  const activities = payload.activities || [];
  const knownIds = new Set(activities.map((a) => String(a.activity_id)));
  const derivedRows: DerivedRow[] = [];
  const anomalies: ProjectIntelligenceAnomaly[] = [];

  let weightedExpectedSum = 0;
  let weightedActualSum = 0;
  let totalWeight = 0;
  let delayedCount = 0;
  let completedCount = 0;

  for (const activity of activities) {
    const activityId = String(activity.activity_id);
    const activityName = activity.activity_name || activityId;
    const expectedPct = round2(getExpectedProgressPct(activity, asOf));
    const actualPct = round2(getActualProgressPct(activity));
    const variancePct = round2(actualPct - expectedPct);
    const progressGap = round2(Math.max(0, expectedPct - actualPct));
    const scheduleDelayDays = getScheduleDelayDays(activity, asOf);
    const shortfallPct = round2(getShortfallPct(activity));
    const status = String(activity.status || "").toUpperCase();

    if (scheduleDelayDays > 0) delayedCount += 1;
    if (status === "COMPLETED" || actualPct >= 100) completedCount += 1;

    const { plannedProductivity, actualProductivity, productivityVariancePct } = getProductivity(
      activity,
      asOf
    );
    const { riskScore, impactDays, reasons } = getRiskAndReasons(
      activity,
      scheduleDelayDays,
      progressGap,
      shortfallPct
    );

    const weight = Math.max(1, toNumber(activity.planned_qty) || 1);
    weightedExpectedSum += expectedPct * weight;
    weightedActualSum += actualPct * weight;
    totalWeight += weight;

    derivedRows.push({
      activityId,
      activityName,
      expectedPct,
      actualPct,
      variancePct,
      scheduleDelayDays,
      progressGap,
      shortfallPct,
      riskScore: round2(riskScore),
      impactDays,
      reasons,
      isCritical: !!activity.is_critical,
      plannedProductivity: plannedProductivity === null ? null : round2(plannedProductivity),
      actualProductivity: actualProductivity === null ? null : round2(actualProductivity),
      productivityVariancePct:
        productivityVariancePct === null ? null : round2(productivityVariancePct),
    });

    anomalies.push(...collectAnomalies(activity, asOf, knownIds));
  }

  const variance: ProjectIntelligenceVariance[] = derivedRows
    .map((row) => ({
      activity_id: row.activityId,
      activity_name: row.activityName,
      expected_progress_pct: row.expectedPct,
      actual_progress_pct: row.actualPct,
      progress_variance_pct: row.variancePct,
      schedule_delay_days: row.scheduleDelayDays,
    }))
    .sort((a, b) => b.schedule_delay_days - a.schedule_delay_days);

  const risks: ProjectIntelligenceRisk[] = derivedRows
    .map((row) => ({
      activity_id: row.activityId,
      activity_name: row.activityName,
      probability_pct: Math.round(row.riskScore),
      impact_days: row.impactDays,
      severity: getRiskSeverity(row.riskScore),
      reasons: row.reasons,
    }))
    .sort((a, b) => b.probability_pct - a.probability_pct);

  const highRiskRows = derivedRows
    .filter((row) => row.riskScore >= 65)
    .sort((a, b) => b.riskScore - a.riskScore);

  const actions: ProjectIntelligenceAction[] = highRiskRows.slice(0, 8).map((row) => {
    const source = activities.find((a) => String(a.activity_id) === row.activityId);
    const delayReason = String(source?.delay_reason || "");
    const recommendation = getActionForRisk(row, delayReason);
    return {
      activity_id: row.activityId,
      activity_name: row.activityName,
      priority: row.riskScore >= 80 ? "HIGH" : "MEDIUM",
      action: recommendation.action,
      expected_impact: recommendation.expectedImpact,
    };
  });

  const productivity: ProjectIntelligenceProductivity[] = derivedRows
    .filter((row) => row.plannedProductivity !== null || row.actualProductivity !== null)
    .map((row) => {
      let insight = "Productivity data is available for monitoring.";
      if (row.productivityVariancePct !== null && row.productivityVariancePct <= -15) {
        insight = `Actual productivity is ${Math.abs(row.productivityVariancePct)}% below plan.`;
      } else if (row.productivityVariancePct !== null && row.productivityVariancePct >= 15) {
        insight = `Actual productivity is ${row.productivityVariancePct}% above plan.`;
      }
      return {
        activity_id: row.activityId,
        activity_name: row.activityName,
        planned_productivity_per_day: row.plannedProductivity,
        actual_productivity_per_day: row.actualProductivity,
        productivity_variance_pct: row.productivityVariancePct,
        insight,
      };
    })
    .sort(
      (a, b) =>
        (a.productivity_variance_pct ?? 0) - (b.productivity_variance_pct ?? 0)
    );

  const plannedProgressPct =
    totalWeight > 0 ? round2(weightedExpectedSum / totalWeight) : 0;
  const actualProgressPct =
    totalWeight > 0 ? round2(weightedActualSum / totalWeight) : 0;
  const progressVariancePct = round2(actualProgressPct - plannedProgressPct);
  const projectedDelayDays = Math.max(0, ...variance.map((v) => v.schedule_delay_days));
  const projectDelayRiskPct =
    risks.length > 0
      ? Math.round(risks.slice(0, Math.min(10, risks.length)).reduce((acc, r) => acc + r.probability_pct, 0) /
          Math.min(10, risks.length))
      : 0;

  const summary: ProjectIntelligenceSummary = {
    as_of_date: asOfDate,
    project_name: payload.project?.project_name || "Unnamed Project",
    total_activities: activities.length,
    completed_activities: completedCount,
    delayed_activities: delayedCount,
    high_risk_activities: risks.filter((r) => r.probability_pct >= 65).length,
    anomaly_count: anomalies.length,
    planned_progress_pct: plannedProgressPct,
    actual_progress_pct: actualProgressPct,
    progress_variance_pct: progressVariancePct,
    projected_project_delay_days: projectedDelayDays,
    project_delay_risk_pct: projectDelayRiskPct,
  };

  const topRisk = risks[0];
  const topDelay = variance[0];
  const execSummary: string[] = [];
  execSummary.push(
    `As of ${summary.as_of_date}, project progress is ${summary.actual_progress_pct}% against planned ${summary.planned_progress_pct}% (variance ${summary.progress_variance_pct}%).`
  );
  execSummary.push(
    `${summary.delayed_activities} activity(ies) are delayed, with projected overall delay impact up to ${summary.projected_project_delay_days} day(s).`
  );
  if (topRisk) {
    execSummary.push(
      `Highest risk activity is "${topRisk.activity_name}" with ${topRisk.probability_pct}% delay probability and ${topRisk.impact_days} day(s) potential impact.`
    );
  }
  if (anomalies.length) {
    execSummary.push(
      `${anomalies.length} data anomaly/anomalies detected. Resolve them to improve forecast reliability.`
    );
  }
  if (topDelay && topDelay.schedule_delay_days > 0) {
    execSummary.push(
      `Most delayed activity currently is "${topDelay.activity_name}" at ${topDelay.schedule_delay_days} day(s) behind plan.`
    );
  }

  return {
    summary,
    variance,
    risks,
    actions,
    anomalies,
    productivity,
    executive_summary: execSummary,
  };
}
