/**
 * BimSectionLabel — tiny uppercase eyebrow / section divider label
 *
 * Used to introduce sections within a page (e.g. "All Modules", "Recent Activity").
 * Matches the style used on the dashboard and module grid.
 *
 * Usage:
 *   <BimSectionLabel>All Modules</BimSectionLabel>
 *   <BimSectionLabel className="mb-4">Recent Alerts</BimSectionLabel>
 */

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function BimSectionLabel({ children, className = "" }: Props) {
  return (
    <p
      className={`text-[10px] font-black uppercase tracking-[0.2em] text-[#5a3e22] ${className}`}
    >
      {children}
    </p>
  );
}
