import type { ReactNode } from "react";

/**
 * BimPanel
 *
 * Dark card/panel wrapper used throughout company pages.
 *
 * Variants (mutually exclusive, elevated takes priority):
 *
 *   default  — rounded-2xl, border-[#2b1e12], bg-[#110e0a]
 *              Dominant panel style — matches dashboard panels, metric cards,
 *              quick-action grids, workspace cards.
 *
 *   deep     — rounded-2xl, border-[#3f2d1a], bg-[#0f0905]
 *              Sunken surface — use for table wrappers, inner content panels,
 *              stat grids that sit inside another panel.
 *
 *   elevated — rounded-[24px], warm gradient bg, no external shadow applied
 *              (add shadow via className if needed).
 *              Use for hero bands, greeting cards, feature highlight areas.
 *
 * Props:
 *   noPad    — suppresses default p-5 padding. Pass when the child controls
 *              its own padding (tables, divide-y lists, custom headers).
 *   as       — renders as a different HTML element (e.g. "section", "article")
 *   className — appended after base classes (safe for shadow, padding overrides)
 *
 * Usage:
 *   <BimPanel>Card with default surface</BimPanel>
 *   <BimPanel deep noPad><BimTable>…</BimTable></BimPanel>
 *   <BimPanel elevated as="section" className="px-6 py-6">Hero band</BimPanel>
 *   <BimPanel noPad className="shadow-[0_4px_20px_rgba(0,0,0,0.4)]">Panel + shadow</BimPanel>
 */

type Tag = "div" | "section" | "article" | "aside";

type Props = {
  children: ReactNode;
  /** Gradient hero-panel style (takes priority over deep) */
  elevated?: boolean;
  /** Darker/deeper sunken surface — for table wrappers and inner panels */
  deep?: boolean;
  /** Suppress default p-5 padding */
  noPad?: boolean;
  as?: Tag;
  className?: string;
};

export function BimPanel({
  children,
  elevated = false,
  deep = false,
  noPad = false,
  as: Tag = "div",
  className = "",
}: Props) {
  const base = elevated
    ? "rounded-[24px] border border-[#2b1e12] bg-gradient-to-br from-[#1b120b] to-[#120c07]"
    : deep
    ? "rounded-2xl border border-[#3f2d1a] bg-[#0f0905]"
    : "rounded-2xl border border-[#2b1e12] bg-[#110e0a]";

  const pad = noPad ? "" : "p-5";

  const classes = [base, pad, className].filter(Boolean).join(" ");

  return <Tag className={classes}>{children}</Tag>;
}
