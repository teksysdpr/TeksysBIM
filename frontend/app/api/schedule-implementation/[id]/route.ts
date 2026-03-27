import { NextRequest, NextResponse } from "next/server";
import {
  getScheduleImplementationById,
  ScheduleImplementationStoreError,
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
  }
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ ok: false, message }, { status: 500 });
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const rowId = Number(id);
    if (!Number.isFinite(rowId) || rowId <= 0) {
      return NextResponse.json({ ok: false, message: "Invalid implementation id." }, { status: 400 });
    }
    const row = await getScheduleImplementationById(rowId);
    return NextResponse.json({ ok: true, row });
  } catch (error) {
    return toErrorResponse(error);
  }
}
