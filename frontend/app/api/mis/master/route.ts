import { NextRequest, NextResponse } from "next/server";
import {
  listProjectMisMasterRows,
  ProjectMisStoreError,
  saveProjectMisMasterRows,
} from "@/lib/projectMisStore";

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
    const result = await listProjectMisMasterRows({
      project_id: Number.isFinite(projectId) ? projectId : undefined,
      schedule_id: scheduleId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await saveProjectMisMasterRows({
      project_id: Number(body?.project_id || 0),
      schedule_id: String(body?.schedule_id || ""),
      rows: Array.isArray(body?.rows) ? body.rows : [],
      reference_date: String(body?.reference_date || ""),
    });
    return NextResponse.json({
      ...result,
      message: "Master MIS saved successfully.",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
