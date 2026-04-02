"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * BimButton — themed button component
 *
 * Variants:
 *   primary   — gold fill, dark text. Use for primary page CTAs.
 *   secondary — dark bg, gold text, border. Use for secondary actions & toolbar buttons.
 *   ghost     — transparent bg, gold text, border. Use for inline/subtle actions.
 *   danger    — dark red bg, red text, border. Use for destructive actions.
 *
 * Sizes:
 *   sm (default) — text-xs, px-3 py-2  (toolbar, row actions)
 *   md           — text-sm, px-4 py-2.5 (page CTA)
 *
 * icon prop: pass a Lucide icon element — it is rendered before children.
 *
 * For Link-as-button (navigation CTAs), use the exported className helpers:
 *   import { bimBtnClass } from "./BimButton";
 *   <Link href="..." className={bimBtnClass("primary", "md")}>Label</Link>
 *
 * Usage:
 *   <BimButton variant="primary" size="md" icon={<Plus className="h-4 w-4" />}>
 *     New Project
 *   </BimButton>
 *
 *   <BimButton onClick={load} disabled={loading} icon={<RefreshCw className={...} />}>
 *     Refresh
 *   </BimButton>
 */

export type BimButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type BimButtonSize = "sm" | "md";

const VARIANT_BASE: Record<BimButtonVariant, string> = {
  primary:
    "bg-[#d4933c] text-[#1a0f06] font-bold hover:bg-[#c08030] shadow-[0_6px_18px_rgba(186,130,65,0.22)] rounded-xl",
  secondary:
    "border border-[#3f2d1a] bg-[#1a120b] text-[#f0c27e] font-semibold hover:bg-[#25180d] rounded-lg",
  ghost:
    "border border-[#3f2d1a] bg-transparent text-[#f0c27e] font-semibold hover:bg-[#1a120b] rounded-lg",
  danger:
    "border border-red-900/60 bg-red-950/25 text-red-400 font-semibold hover:bg-red-950/40 rounded-lg",
};

const SIZE_BASE: Record<BimButtonSize, string> = {
  sm: "inline-flex items-center gap-1.5 px-3 py-2 text-xs",
  md: "inline-flex items-center gap-2 px-4 py-2.5 text-sm",
};

/** Returns the combined className string — use on <Link> or other elements */
export function bimBtnClass(
  variant: BimButtonVariant = "secondary",
  size: BimButtonSize = "sm",
  extra = ""
): string {
  return [SIZE_BASE[size], VARIANT_BASE[variant], "transition", extra]
    .filter(Boolean)
    .join(" ");
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BimButtonVariant;
  size?: BimButtonSize;
  icon?: ReactNode;
  children: ReactNode;
};

export function BimButton({
  variant = "secondary",
  size = "sm",
  icon,
  children,
  className = "",
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={[
        SIZE_BASE[size],
        VARIANT_BASE[variant],
        "transition",
        disabled ? "cursor-not-allowed opacity-50" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}
