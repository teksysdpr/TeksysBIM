"use client";

const PROJECT_IMAGE_MAP_KEY = "dpr_project_image_map_v1";
export const PROJECT_MEDIA_CHANGED_EVENT = "dpr-project-media-changed";

type ProjectImageMap = Record<string, string>;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readProjectImageMap(): ProjectImageMap {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(PROJECT_IMAGE_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProjectImageMap;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function saveProjectImageMap(map: ProjectImageMap) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(PROJECT_IMAGE_MAP_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(PROJECT_MEDIA_CHANGED_EVENT));
  } catch {}
}

export function getProjectImage(projectId: number): string | null {
  const map = readProjectImageMap();
  const value = map[String(projectId)] || "";
  return value || null;
}

export function setProjectImage(projectId: number, imageDataUrl: string) {
  const map = readProjectImageMap();
  map[String(projectId)] = imageDataUrl;
  saveProjectImageMap(map);
}

export function removeProjectImage(projectId: number) {
  const map = readProjectImageMap();
  const key = String(projectId);
  if (!(key in map)) return;
  delete map[key];
  saveProjectImageMap(map);
}
