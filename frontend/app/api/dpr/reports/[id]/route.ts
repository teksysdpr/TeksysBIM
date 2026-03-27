import { NextRequest, NextResponse } from "next/server";
import {
  DprStoreError,
  getDprReportById,
  updateDprReport,
} from "@/lib/dprStore";

type Ctx = { params: Promise<{ id: string }> };

function parseBoolean(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
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

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const reportId = Number(id);
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return NextResponse.json(
        { ok: false, message: "Invalid DPR id." },
        { status: 400 }
      );
    }

    const row = await getDprReportById(reportId);
    return NextResponse.json({ ok: true, row });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const reportId = Number(id);
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return NextResponse.json(
        { ok: false, message: "Invalid DPR id." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const allowDuplicate =
      parseBoolean(req.nextUrl.searchParams.get("allow_duplicate")) ||
      Boolean(body?.allow_duplicate);
    const allowEditSubmitted =
      parseBoolean(req.nextUrl.searchParams.get("allow_edit_submitted")) ||
      Boolean(body?.allow_edit_submitted);
    const inclusiveHindranceDays =
      !req.nextUrl.searchParams.has("inclusive_hindrance_days") ||
      parseBoolean(req.nextUrl.searchParams.get("inclusive_hindrance_days")) ||
      body?.inclusive_hindrance_days !== false;

    const row = await updateDprReport(reportId, body, {
      allow_duplicate: allowDuplicate,
      allow_edit_submitted: allowEditSubmitted,
      inclusive_hindrance_days: inclusiveHindranceDays,
    });
    return NextResponse.json({
      ok: true,
      message: "DPR updated successfully.",
      row,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

