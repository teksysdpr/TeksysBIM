import { NextRequest, NextResponse } from "next/server";
import {
  analyzeProjectIntelligence,
  ProjectIntelligenceAnalyzeRequest,
} from "@/lib/projectIntelligence";

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8101";
const LOCAL_AI_ANALYZE_PATH = "ai/project-intelligence/analyze";

type Ctx = { params: Promise<{ path: string[] }> };

function validateProjectIntelligencePayload(
  payload: any
): payload is ProjectIntelligenceAnalyzeRequest {
  if (!payload || typeof payload !== "object") return false;
  if (!payload.project || typeof payload.project !== "object") return false;
  if (!payload.project.project_name || typeof payload.project.project_name !== "string") {
    return false;
  }
  if (!Array.isArray(payload.activities) || payload.activities.length === 0) return false;
  if (payload.activities.length > 5000) return false;

  for (const row of payload.activities) {
    if (!row || typeof row !== "object") return false;
    if (row.activity_id === null || row.activity_id === undefined) return false;
    if (!row.activity_name || typeof row.activity_name !== "string") return false;
  }

  return true;
}

async function handleLocalIntelligenceAnalyze(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unauthorized request.",
      },
      { status: 401 }
    );
  }

  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid JSON payload.",
      },
      { status: 400 }
    );
  }

  if (!validateProjectIntelligencePayload(payload)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Invalid request. Required fields: project.project_name and non-empty activities array with activity_id and activity_name.",
      },
      { status: 400 }
    );
  }

  try {
    const data = analyzeProjectIntelligence(payload);
    return NextResponse.json({
      ok: true,
      message: "Project intelligence analysis completed.",
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to analyze project intelligence data.",
      },
      { status: 500 }
    );
  }
}

async function proxy(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const localPath = path.join("/");
  if (localPath === LOCAL_AI_ANALYZE_PATH) {
    if (req.method !== "POST") {
      return NextResponse.json(
        {
          ok: false,
          message: "Method not allowed.",
        },
        { status: 405 }
      );
    }
    return handleLocalIntelligenceAnalyze(req);
  }

  const url = `${BACKEND}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  let body: BodyInit | undefined = undefined;
  if (!(req.method === "GET" || req.method === "HEAD")) {
    const rawBody = await req.arrayBuffer();
    body = rawBody.byteLength > 0 ? rawBody : undefined;
  }

  const r = await fetch(url, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
