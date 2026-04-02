/**
 * BimBadge — themed status/label pill
 *
 * Renders a rounded pill with an optional leading colour dot.
 * Colour palette matches BimMetricCard variants and the status
 * styles used across conversion, estimate, project, and issue pages.
 *
 * Colors:
 *   gold   — warm amber (default, e.g. "In Progress", "Draft")
 *   green  — emerald    (e.g. "Active", "Approved", "Completed")
 *   amber  — yellow     (e.g. "Pending", "On Hold")
 *   red    — rose       (e.g. "Rejected", "Overdue", "Error")
 *   blue   — sky        (e.g. "Submitted", "In Review")
 *   purple — violet     (e.g. "Clash", "Hold")
 *   gray   — neutral    (e.g. "Archived", "Superseded", "Inactive")
 *
 * Usage:
 *   <BimBadge label="Active"     color="green" />
 *   <BimBadge label="Draft"      color="amber" />
 *   <BimBadge label="Superseded" color="gray"  dot={false} />
 *   <BimBadge label="Overdue"    color="red" />
 */

export type BadgeColor =
  | "gold"
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "purple"
  | "gray";

interface BadgeStyle {
  pill: string;
  dot: string;
}

const BADGE_STYLES: Record<BadgeColor, BadgeStyle> = {
  gold: {
    pill: "border-[#6b3e14] bg-[#d4933c]/10 text-[#e8c080]",
    dot:  "bg-[#d4933c]",
  },
  green: {
    pill: "border-[#064e3b] bg-[#34d399]/10 text-[#34d399]",
    dot:  "bg-[#34d399]",
  },
  amber: {
    pill: "border-[#78350f] bg-[#fbbf24]/10 text-[#fbbf24]",
    dot:  "bg-[#fbbf24]",
  },
  red: {
    pill: "border-[#7f1d1d] bg-[#f87171]/10 text-[#f87171]",
    dot:  "bg-[#f87171]",
  },
  blue: {
    pill: "border-[#1e3a5f] bg-[#60a5fa]/10 text-[#60a5fa]",
    dot:  "bg-[#60a5fa]",
  },
  purple: {
    pill: "border-[#3b1f6b] bg-[#a78bfa]/10 text-[#a78bfa]",
    dot:  "bg-[#a78bfa]",
  },
  gray: {
    pill: "border-white/10 bg-white/5 text-[#6b7280]",
    dot:  "bg-[#6b7280]",
  },
};

type Props = {
  label: string;
  color?: BadgeColor;
  /** Show the leading colour dot (default: true) */
  dot?: boolean;
};

export function BimBadge({ label, color = "gold", dot = true }: Props) {
  const s = BADGE_STYLES[color];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.pill}`}
    >
      {dot ? <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> : null}
      {label}
    </span>
  );
}

/**
 * badgeColor — maps a raw status string to a BadgeColor.
 *
 * Use this to derive a colour from a status value without writing
 * per-page colour maps. Falls back to "gray" for unknown values.
 *
 * Convention map (extend per module as needed):
 *   active / approved / completed / live      → green
 *   draft / pending / in_progress / open      → amber
 *   submitted / in_review / uploading         → blue
 *   rejected / overdue / error / failed       → red
 *   on_hold / clash / blocked                 → purple
 *   archived / superseded / cancelled         → gray
 *   default                                   → gold
 */
export function badgeColor(status: string): BadgeColor {
  const s = status.toLowerCase().replace(/[^a-z_]/g, "_");
  if (/^(active|approved|completed|live|done|passed)$/.test(s)) return "green";
  if (/^(draft|pending|in_progress|open|started)$/.test(s))     return "amber";
  if (/^(submitted|in_review|uploading|processing)$/.test(s))   return "blue";
  if (/^(rejected|overdue|error|failed|critical)$/.test(s))     return "red";
  if (/^(on_hold|clash|blocked|hold)$/.test(s))                 return "purple";
  if (/^(archived|superseded|cancelled|closed|inactive)$/.test(s)) return "gray";
  return "gold";
}
