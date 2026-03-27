import { NextRequest, NextResponse } from "next/server";
import { getProjectMisDailyReportById, ProjectMisStoreError } from "@/lib/projectMisStore";

type Ctx = { params: Promise<{ id: string }> };

function toErrorResponse(error: unknown) {
  if (error instanceof ProjectMisStoreError) {
    if (error.code === "NOT_FOUND") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 404 });
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
      return NextResponse.json({ ok: false, message: "Invalid MIS report id." }, { status: 400 });
    }
    const row = await getProjectMisDailyReportById(reportId);
    return NextResponse.json({ ok: true, row });
  } catch (error) {
    return toErrorResponse(error);
  }
}

