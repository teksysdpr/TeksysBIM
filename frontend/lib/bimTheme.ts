/**
 * BIM Portal Theme Tokens
 *
 * Single source of truth for the TeksysBIM dark-luxury visual system.
 * Use these constants when writing new components or harmonising existing ones.
 * All values are verified against the current Home page and company-page codebase.
 *
 * Phase 6A-1 — 2026-04-01
 */

// ─── Page / Shell backgrounds ────────────────────────────────────────────────

export const BG_PAGE       = "#0a0806"; // primary company-page background
export const BG_PAGE_ALT   = "#090603"; // alternate (BimModulePage, slight variation)
export const BG_HOME       = "#080505"; // Home landing page background

// ─── Surface layers (cards, panels, sections) ────────────────────────────────

export const SURFACE_1     = "#110e0a"; // default card / panel bg
export const SURFACE_2     = "#1a0f06"; // elevated surface / icon containers
export const SURFACE_3     = "#0f0905"; // sunken / subtle surface
export const SURFACE_HOVER = "#160f08"; // card hover state bg

// Hero / section gradient (from → to):
//   bg-gradient-to-br from-[#1b120b] to-[#120c07]
export const SURFACE_HERO_FROM = "#1b120b";
export const SURFACE_HERO_TO   = "#120c07";

// ─── Borders ─────────────────────────────────────────────────────────────────

export const BORDER_SOFT   = "#2b1e12"; // default card border
export const BORDER_MID    = "#3f2d1a"; // section / hero panel border
export const BORDER_DARK   = "#3f2720"; // footer / divider
export const BORDER_STRONG = "#5a3a2c"; // form inputs, stronger accent
export const BORDER_HOVER  = "#6b3e14"; // card hover border

// ─── Text hierarchy ──────────────────────────────────────────────────────────

export const TEXT_HEADING  = "#fff3de"; // h1 / h2 headings
export const TEXT_PRIMARY  = "#f0e6d4"; // primary body text
export const TEXT_SECONDARY= "#d0b894"; // secondary / description text
export const TEXT_MUTED    = "#8a6e4e"; // muted / meta text
export const TEXT_LABEL    = "#6b4820"; // tiny eyebrow labels (uppercase)

// ─── Gold accent family ──────────────────────────────────────────────────────

export const GOLD_PRIMARY  = "#d4933c"; // CTA buttons, primary icon color
export const GOLD_LIGHT    = "#e8c080"; // secondary gold text, hover labels
export const GOLD_BRIGHT   = "#e7b877"; // section eyebrow text
export const GOLD_PALE     = "#f0c27e"; // back-button text, back-links
export const GOLD_HOVER    = "#c08030"; // gold button hover

// Gold gradient (primary CTA buttons):
//   bg-gradient-to-r from-[#d7a35d] to-[#ba8241]
export const GOLD_GRADIENT_FROM = "#d7a35d";
export const GOLD_GRADIENT_TO   = "#ba8241";

// ─── Status / metric colour variants ─────────────────────────────────────────
// Used by BimMetricCard and status badges

export const STATUS = {
  gold:   { border: "#d4933c", text: "#e8c080", bg: "#1f1108" },
  green:  { border: "#34d399", text: "#34d399", bg: "#022c22" },
  amber:  { border: "#fbbf24", text: "#fbbf24", bg: "#1c0d00" },
  red:    { border: "#f87171", text: "#f87171", bg: "#200a0a" },
  blue:   { border: "#60a5fa", text: "#60a5fa", bg: "#0a1a2e" },
  purple: { border: "#a78bfa", text: "#a78bfa", bg: "#130a22" },
} as const;

export type StatusVariant = keyof typeof STATUS;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const SHADOW_CARD    = "0 18px 34px rgba(0,0,0,0.35)";
export const SHADOW_SURFACE = "0 20px 50px rgba(0,0,0,0.34)";
export const SHADOW_PANEL   = "0 14px 30px rgba(0,0,0,0.24)";
export const SHADOW_BUTTON  = "0 14px 26px rgba(186,130,65,0.3)";

// ─── Typography / spacing rhythm ─────────────────────────────────────────────
//
// Font: Inter (Google Fonts), mapped via --font-inter CSS variable
// Weights:  900 (black), 700 (bold), 600 (semibold)
// Radii:    cards 24px (rounded-[24px]) or 16px (rounded-2xl)
//           buttons 12px (rounded-xl)
//           icon boxes 12px (rounded-xl)
// Spacing:  page inner: px-4 py-8 md:px-6 lg:px-8
//           section gap: space-y-6
//           card gap: gap-4 (md:gap-6)
//
// NOTE: Tailwind v4 (no tailwind.config.ts) — all custom colours via
//       globals.css @theme or as Tailwind arbitrary values [#hex].
//       Use arbitrary values until a formal @theme block is added.

// ─── Header / nav colours (Header.tsx) ──────────────────────────────────────

export const HEADER_BG          = "#120c07";
export const HEADER_BORDER      = "#3a2a1b";
export const NAV_ACTIVE_BG      = "#3a1f1f";
export const NAV_ACTIVE_TEXT    = "#f3c786";
export const NAV_INACTIVE_TEXT  = "#ead8ba";
export const NAV_HOVER_BG       = "#281515";

// ─── Shared component reference map ─────────────────────────────────────────
//
// MarketingBlocks.tsx  — SectionTitle, PremiumCard, PageHero (Home/public pages)
// Header.tsx           — site-wide sticky nav header
// PortalFooter.tsx     — site-wide footer
// RouteShell.tsx       — root wrapper (Header + children + Footer)
// CompanyPageHeader.tsx— company logo + name header (18 company pages)
// BimModulePage.tsx    — stub/placeholder template (7 pages)
// BimMetricCard.tsx    — metric cards, 6 STATUS variants
// BimModuleGrid.tsx    — module grid on dashboard
// ProjectWorkspaceShell.tsx — project sub-page tab nav shell
