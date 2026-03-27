import { NextRequest, NextResponse } from "next/server";
import {
  listProjectMisDailyReports,
  ProjectMisStoreError,
  saveProjectMisDailyReport,
} from "@/lib/projectMisStore";
import type { MisStatus } from "@/lib/projectMisTypes";

function parseStatus(value: string | null): MisStatus | undefined {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "submitted") return "submitted";
  if (normalized === "approved") return "approved";
  if (normalized === "draft") return "draft";
  return undefined;
}

function parseBoolean(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function toErrorResponse(error: unknown) {
  if (error instanceof ProjectMisStoreError) {
    if (error.code === "VALIDATION") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }
    if (error.code === "NOT_FOUND") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 404 });
    }
    if (error.code === "READ_ONLY") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 403 });
    }
    if (error.code === "DUPLICATE") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 409 });
    }
  }
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ ok: false, message }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const projectIdRaw = req.nextUrl.searchParams.get("project_id");
    const projectId = projectIdRaw ? Number(projectIdRaw) : undefined;
    const scheduleId = String(req.nextUrl.searchParams.get("schedule_id") || "").trim() || undefined;
    const reportDate = String(req.nextUrl.searchParams.get("report_date") || "").trim() || undefined;
    const status = parseStatus(req.nextUrl.searchParams.get("status"));
    const includeLines = parseBoolean(req.nextUrl.searchParams.get("include_lines"));
    const result = await listProjectMisDailyReports({
      project_id: Number.isFinite(projectId) ? projectId : undefined,
      schedule_id: scheduleId,
      report_date: reportDate,
      status,
      include_lines: includeLines,
    });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const row = await saveProjectMisDailyReport({
      id: Number(body?.id || 0) || undefined,
      project_id: Number(body?.project_id || 0),
      project_name: String(body?.project_name || ""),
      schedule_id: String(body?.schedule_id || ""),
      schedule_name: String(body?.schedule_name || ""),
      report_date: String(body?.report_date || ""),
      report_month: String(body?.report_month || ""),
      building_or_tower: String(body?.building_or_tower || ""),
      status: parseStatus(body?.status || null) || "draft",
      created_by: String(body?.created_by || ""),
      approved_by: String(body?.approved_by || ""),
      lines: Array.isArray(body?.lines) ? body.lines : [],
    });

    return NextResponse.json({
      ok: true,
      message: "Daily MIS saved successfully.",
      row,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

