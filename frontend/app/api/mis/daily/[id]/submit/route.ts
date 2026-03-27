import { NextRequest, NextResponse } from "next/server";
import { ProjectMisStoreError, submitProjectMisDailyReport } from "@/lib/projectMisStore";

type Ctx = { params: Promise<{ id: string }> };

function toErrorResponse(error: unknown) {
  if (error instanceof ProjectMisStoreError) {
    if (error.code === "NOT_FOUND") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 404 });
    }
    if (error.code === "VALIDATION") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }
    if (error.code === "READ_ONLY") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 403 });
    }
  }
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ ok: false, message }, { status: 500 });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const reportId = Number(id);
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return NextResponse.json({ ok: false, message: "Invalid MIS report id." }, { status: 400 });
    }

    let approvedBy = "";
    try {
      const body = await req.json();
      approvedBy = String(body?.approved_by || "");
    } catch {
      approvedBy = "";
    }

    const row = await submitProjectMisDailyReport(reportId, approvedBy);
    return NextResponse.json({
      ok: true,
      message: "MIS report submitted successfully.",
      row,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

