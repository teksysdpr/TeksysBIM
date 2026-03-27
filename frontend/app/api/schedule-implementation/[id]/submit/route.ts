import { NextRequest, NextResponse } from "next/server";
import {
  ScheduleImplementationStoreError,
  submitScheduleImplementation,
} from "@/lib/scheduleImplementationStore";

type Ctx = { params: Promise<{ id: string }> };

function toErrorResponse(error: unknown) {
  if (error instanceof ScheduleImplementationStoreError) {
    if (error.code === "NOT_FOUND") {
      return NextResponse.json({ ok: false, message: error.message }, { status: 404 });
    }
    if (error.code === "VALIDATION" || error.code === "BAD_REQUEST") {
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
    const rowId = Number(id);
    if (!Number.isFinite(rowId) || rowId <= 0) {
      return NextResponse.json({ ok: false, message: "Invalid implementation id." }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const row = await submitScheduleImplementation(rowId, {
      actor: String(body?.actor || ""),
      note: String(body?.note || ""),
    });
    return NextResponse.json({ ok: true, row, message: "Submitted for final approval." });
  } catch (error) {
    return toErrorResponse(error);
  }
}
