import { getAccessToken } from "@/lib/storage";
import type {
  ProjectIntelligenceAnalyzeRequest,
  ProjectIntelligenceAnalyzeResponse,
} from "@/lib/projectIntelligence";

type ProjectIntelligenceApiResponse = {
  ok: boolean;
  message?: string;
  data?: ProjectIntelligenceAnalyzeResponse;
};

export async function runProjectIntelligenceAnalysis(
  payload: ProjectIntelligenceAnalyzeRequest
): Promise<ProjectIntelligenceAnalyzeResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Session not found. Please login again.");
  }

  const response = await fetch("/api/proxy/ai/project-intelligence/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const raw = await response.text();
  let parsed: ProjectIntelligenceApiResponse | null = null;

  try {
    parsed = raw ? (JSON.parse(raw) as ProjectIntelligenceApiResponse) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok || !parsed?.ok || !parsed?.data) {
    throw new Error(
      parsed?.message || `Analysis request failed with status ${response.status}`
    );
  }

  return parsed.data;
}
