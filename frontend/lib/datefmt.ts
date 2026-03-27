import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export type AllowedDateFormat =
  | "DD/MM/YYYY"
  | "DD-MMM-YYYY"
  | "DD/MM/YY"
  | "DD-MMM-YY";

export const ALLOWED_FORMATS: AllowedDateFormat[] = [
  "DD/MM/YYYY",
  "DD-MMM-YYYY",
  "DD/MM/YY",
  "DD-MMM-YY",
];

// Display ISO(YYYY-MM-DD) as user-selected format
export function formatDateForUI(
  isoDate: string | null | undefined,
  fmt: AllowedDateFormat
): string {
  if (!isoDate) return "";
  const d = dayjs(isoDate, "YYYY-MM-DD", true);
  if (!d.isValid()) return "";
  const out = d.format(fmt);
  // MSP-style months are typically uppercase (MAR)
  return fmt.includes("MMM") ? out.toUpperCase() : out;
}

// Parse ONLY allowed user formats -> ISO (YYYY-MM-DD)
// Returns null if invalid format
export function parseDateFromUI(input: string, fmt: AllowedDateFormat): string | null {
  const s = (input || "").trim();
  if (!s) return null;

  // Strict parse against exactly the selected fmt only
  const d = dayjs(s, fmt, true);
  if (!d.isValid()) return null;

  return d.format("YYYY-MM-DD");
}
