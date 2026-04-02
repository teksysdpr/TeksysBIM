import type { ReactNode } from "react";

/**
 * BimPageShell
 *
 * Standard page wrapper for all company/* routes.
 * Provides the dark bg, full viewport height, horizontal padding,
 * and the inner max-w-7xl centred content column.
 *
 * Usage:
 *   <BimPageShell>
 *     <BimPageHeader title="Projects" />
 *     ...sections...
 *   </BimPageShell>
 *
 * gap:
 *   "sm" → space-y-5   (dense / utility pages)
 *   "md" → space-y-6   (default)
 *   "lg" → space-y-7   (dashboard / data-heavy pages)
 */

type GapSize = "sm" | "md" | "lg";

type Props = {
  children: ReactNode;
  gap?: GapSize;
  /** Override the default max-w-7xl. Pass a full Tailwind class e.g. "max-w-5xl" */
  maxWidth?: string;
};

const GAP: Record<GapSize, string> = {
  sm: "space-y-5",
  md: "space-y-6",
  lg: "space-y-7",
};

export default function BimPageShell({
  children,
  gap = "md",
  maxWidth = "max-w-7xl",
}: Props) {
  return (
    <main className="min-h-[calc(100vh-88px)] bg-[#0a0806] px-4 py-8 text-[#f0e6d4] md:px-6 lg:px-8">
      <div className={`mx-auto ${maxWidth} ${GAP[gap]}`}>{children}</div>
    </main>
  );
}
