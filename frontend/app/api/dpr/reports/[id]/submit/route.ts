import { NextRequest, NextResponse } from "next/server";
import { DprStoreError, submitDprReport } from "@/lib/dprStore";

type Ctx = { params: Promise<{ id: string }> };

function toErrorResponse(error: unknown) {
  if (error instanceof DprStoreError) {
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

export async function POST(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const reportId = Number(id);
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return NextResponse.json(
        { ok: false, message: "Invalid DPR id." },
        { status: 400 }
      );
    }

    const row = await submitDprReport(reportId);
    return NextResponse.json({
      ok: true,
      message: "DPR submitted successfully.",
      row,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

