/**
 * BimStatCard — lightweight summary stat card
 *
 * Lighter-weight than BimMetricCard (no left-border accent, no icon box).
 * Use for grids of aggregate numbers at the top of list pages
 * (e.g. "Total: 12 · Draft: 4 · Approved: 3").
 *
 * BimMetricCard is still preferred for the main dashboard KPI row.
 *
 * Usage:
 *   <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
 *     <BimStatCard label="Total"    value={12}           />
 *     <BimStatCard label="Draft"    value={4}  color="amber" />
 *     <BimStatCard label="Approved" value={3}  color="green" />
 *     <BimStatCard label="Value"    value="₹2.4 Cr" color="gold" />
 *   </div>
 */

export type StatColor =
  | "default"   // #f0c27e — warm gold (default)
  | "gold"      // #e8c080
  | "green"     // #34d399
  | "amber"     // #fbbf24
  | "red"       // #f87171
  | "blue"      // #60a5fa
  | "purple"    // #a78bfa
  | "gray";     // #6b7280

const COLOR_CLASS: Record<StatColor, string> = {
  default: "text-[#f0c27e]",
  gold:    "text-[#e8c080]",
  green:   "text-[#34d399]",
  amber:   "text-[#fbbf24]",
  red:     "text-[#f87171]",
  blue:    "text-[#60a5fa]",
  purple:  "text-[#a78bfa]",
  gray:    "text-[#6b7280]",
};

type Props = {
  label: string;
  value: string | number;
  color?: StatColor;
  className?: string;
};

export function BimStatCard({ label, value, color = "default", className = "" }: Props) {
  // Numbers get a larger text size; strings (formatted values like "₹2.4 Cr") get base
  const sizeClass = typeof value === "number" ? "text-2xl" : "text-base";

  return (
    <div
      className={`rounded-2xl border border-[#3f2d1a] bg-[#0f0905] p-4 ${className}`}
    >
      <p className={`font-black tabular-nums ${sizeClass} ${COLOR_CLASS[color]}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-[#7a5e3e]">{label}</p>
    </div>
  );
}
