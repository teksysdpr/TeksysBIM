import { NextRequest, NextResponse } from "next/server";
import {
  listScheduleImplementationRecords,
  saveScheduleImplementationDraft,
  ScheduleImplementationStoreError,
} from "@/lib/scheduleImplementationStore";
import type { ScheduleImplementationStatus } from "@/lib/scheduleImplementationTypes";

function parseStatus(value: string | null): ScheduleImplementationStatus | undefined {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  if (!normalized) return undefined;
  if (normalized === "DRAFT") return "DRAFT";
  if (normalized === "SUBMITTED") return "SUBMITTED";
  if (normalized === "APPROVED") return "APPROVED";
  if (normalized === "REJECTED") return "REJECTED";
  return undefined;
}

function toErrorResponse(error: unknown) {
  if (error instanceof ScheduleImplementationStoreError) {
    if (error.code === "VALIDATION" || error.code === "BAD_REQUEST") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }
    if (error.code === "NOT_FOUND") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 404 });
    }
    if (error.code === "READ_ONLY") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 403 });
    }
  }
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ ok: false, message }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const projectIdRaw = req.nextUrl.searchParams.get("project_id");
    const baselineIdRaw = req.nextUrl.searchParams.get("baseline_id");
    const projectId = projectIdRaw ? Number(projectIdRaw) : undefined;
    const baselineId = baselineIdRaw ? Number(baselineIdRaw) : undefined;

    const result = await listScheduleImplementationRecords({
      project_id: Number.isFinite(projectId) ? projectId : undefined,
      schedule_id: String(req.nextUrl.searchParams.get("schedule_id") || "").trim() || undefined,
      baseline_id: Number.isFinite(baselineId) ? baselineId : undefined,
      status: parseStatus(req.nextUrl.searchParams.get("status")),
    });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const row = await saveScheduleImplementationDraft({
      id: Number(body?.id || 0) || undefined,
      project_id: Number(body?.project_id || 0),
      project_name: String(body?.project_name || ""),
      schedule_id: String(body?.schedule_id || ""),
      schedule_name: String(body?.schedule_name || ""),
      baseline_id: Number(body?.baseline_id || 0),
      baseline_no: Number(body?.baseline_no || 0),
      implementation_date: String(body?.implementation_date || ""),
      note: String(body?.note || ""),
      actor: String(body?.actor || ""),
      rows: Array.isArray(body?.rows) ? body.rows : [],
    });
    return NextResponse.json({ ok: true, row, message: "Implementation draft saved." });
  } catch (error) {
    return toErrorResponse(error);
  }
}
