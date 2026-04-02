import type { ReactNode } from "react";

/**
 * BimPageHeader
 *
 * Standard inline page title block used at the top of company/* pages.
 * Renders:
 *   - optional eyebrow label (e.g. "TeksysBIM · Projects")
 *   - h1 page title
 *   - optional subtitle / meta line
 *   - optional right-aligned action slot (pass a <BimButton> or <Link>)
 *
 * This is NOT the CompanyPageHeader (which shows company logo + name).
 * Place this below <CompanyPageHeader /> when both are needed.
 *
 * Usage:
 *   <BimPageHeader
 *     eyebrow="TeksysBIM · Conversion"
 *     title="Conversion Requests"
 *     subtitle="12 jobs total"
 *     action={<BimButton variant="primary" size="sm">New Job</BimButton>}
 *   />
 */

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Rendered right-aligned beside the title block */
  action?: ReactNode;
};

export function BimPageHeader({ eyebrow, title, subtitle, action }: Props) {
  return (
    <section className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b4820]">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={`font-black text-[#f8e8cf] text-2xl md:text-3xl${
            eyebrow ? " mt-1.5" : ""
          }`}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[#8a6e4e]">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex-none">{action}</div> : null}
    </section>
  );
}
