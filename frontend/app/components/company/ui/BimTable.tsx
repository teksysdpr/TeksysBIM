import type { ReactNode } from "react";

/**
 * BimTable — themed data table primitives
 *
 * Components:
 *   BimTable   — outer wrapper (overflow-hidden, rounded-2xl, dark bg)
 *   BimThead   — thead row wrapper (handles border-b, text style)
 *   BimTh      — <th> cell (uppercase label style)
 *   BimTbody   — <tbody> pass-through (no styling, for semantic correctness)
 *   BimTr      — <tr> body row (hover, border-b, optional last-row handling)
 *   BimTd      — <td> cell
 *
 * Usage:
 *   <BimTable>
 *     <BimThead>
 *       <BimTh>Name</BimTh>
 *       <BimTh right>Amount</BimTh>
 *     </BimThead>
 *     <BimTbody>
 *       {rows.map((row, i) => (
 *         <BimTr key={row.id} last={i === rows.length - 1}>
 *           <BimTd>{row.name}</BimTd>
 *           <BimTd right className="font-mono">{row.amount}</BimTd>
 *         </BimTr>
 *       ))}
 *     </BimTbody>
 *   </BimTable>
 *
 * For a footer row (e.g. total):
 *   <tr className="border-t border-[#2a1d10] bg-[#140f08]">...</tr>
 */

// ── Outer wrapper ─────────────────────────────────────────────────────────────

type TableProps = {
  children: ReactNode;
  className?: string;
};

export function BimTable({ children, className = "" }: TableProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#3f2d1a] bg-[#0f0905] ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

// ── Head ──────────────────────────────────────────────────────────────────────

export function BimThead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[#2a1d10] text-left">
        {children}
      </tr>
    </thead>
  );
}

type ThProps = {
  children?: ReactNode;
  right?: boolean;
  className?: string;
};

export function BimTh({ children, right = false, className = "" }: ThProps) {
  return (
    <th
      className={[
        "px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#7a5e3e]",
        right ? "text-right" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </th>
  );
}

// ── Body ──────────────────────────────────────────────────────────────────────

export function BimTbody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

type TrProps = {
  children: ReactNode;
  /** Pass true for the final row to suppress its bottom border */
  last?: boolean;
  onClick?: () => void;
  className?: string;
};

export function BimTr({ children, last = false, onClick, className = "" }: TrProps) {
  return (
    <tr
      onClick={onClick}
      className={[
        "border-b border-[#2a1d10]/60 transition hover:bg-[#1a120b]",
        last ? "border-b-0" : "",
        onClick ? "cursor-pointer" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </tr>
  );
}

type TdProps = {
  children?: ReactNode;
  right?: boolean;
  className?: string;
};

export function BimTd({ children, right = false, className = "" }: TdProps) {
  return (
    <td
      className={[
        "px-5 py-3.5",
        right ? "text-right" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </td>
  );
}
