import { NextRequest, NextResponse } from "next/server";
import { createDprReport, DprStoreError, listDprReports } from "@/lib/dprStore";
import type { DprStatus } from "@/lib/dprTypes";

function parseBoolean(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function parseStatus(value: string | null): DprStatus | undefined {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "draft") return "draft";
  if (normalized === "submitted") return "submitted";
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  return undefined;
}

function toErrorResponse(error: unknown) {
  if (error instanceof DprStoreError) {
    if (error.code === "NOT_FOUND") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 404 });
    }
    if (error.code === "DUPLICATE_DPR") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 409 });
    }
    if (error.code === "READ_ONLY") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 403 });
    }
    if (error.code === "VALIDATION") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ ok: false, message }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const projectIdRaw = req.nextUrl.searchParams.get("project_id");
    const projectId = projectIdRaw ? Number(projectIdRaw) : undefined;

    const payload = await listDprReports({
      project_id:
        typeof projectId === "number" && Number.isFinite(projectId)
          ? projectId
          : undefined,
      dpr_date: req.nextUrl.searchParams.get("dpr_date") || undefined,
      status: parseStatus(req.nextUrl.searchParams.get("status")),
      include_rows: parseBoolean(req.nextUrl.searchParams.get("include_rows")),
    });
    return NextResponse.json(payload);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const allowDuplicate =
      parseBoolean(req.nextUrl.searchParams.get("allow_duplicate")) ||
      Boolean(body?.allow_duplicate);
    const inclusiveHindranceDays =
      !req.nextUrl.searchParams.has("inclusive_hindrance_days") ||
      parseBoolean(req.nextUrl.searchParams.get("inclusive_hindrance_days")) ||
      body?.inclusive_hindrance_days !== false;

    const row = await createDprReport(body, {
      allow_duplicate: allowDuplicate,
      inclusive_hindrance_days: inclusiveHindranceDays,
    });

    return NextResponse.json({
      ok: true,
      message: "DPR created successfully.",
      row,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

