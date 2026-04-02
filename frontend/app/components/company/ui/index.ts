/**
 * BIM Portal — Shared Company UI Primitives
 *
 * Import from this barrel file in all company/* pages.
 * Do NOT import from individual files directly.
 *
 * Quick reference:
 *
 *   BimPageShell     — outer page wrapper (dark bg, max-w-7xl, spacing)
 *   BimPageHeader    — eyebrow + h1 + subtitle + optional action slot
 *   BimPanel         — dark card/panel (default or elevated variant)
 *   BimTable         — data table primitives (BimThead, BimTh, BimTbody, BimTr, BimTd)
 *   BimButton        — themed button (primary/secondary/ghost/danger × sm/md)
 *   bimBtnClass      — className helper for Link-as-button
 *   BimBadge         — status pill with colour dot
 *   badgeColor       — derive BadgeColor from a raw status string
 *   BimStateBox      — loading / error / empty state renderer
 *   BimStatCard      — lightweight summary stat card
 *   BimSectionLabel  — tiny uppercase section divider label
 *
 * Example page structure:
 *
 *   export default function MyPage() {
 *     return (
 *       <BimPageShell>
 *         <BimPageHeader
 *           eyebrow="TeksysBIM · My Module"
 *           title="My Module"
 *           subtitle="12 items"
 *           action={<BimButton variant="primary" size="md">New Item</BimButton>}
 *         />
 *         <BimPanel noPad>
 *           <BimTable>
 *             <BimThead><BimTh>Name</BimTh><BimTh right>Value</BimTh></BimThead>
 *             <BimTbody>
 *               {rows.map((r, i) => (
 *                 <BimTr key={r.id} last={i === rows.length - 1}>
 *                   <BimTd>{r.name}</BimTd>
 *                   <BimTd right><BimBadge label={r.status} color={badgeColor(r.status)} /></BimTd>
 *                 </BimTr>
 *               ))}
 *             </BimTbody>
 *           </BimTable>
 *         </BimPanel>
 *       </BimPageShell>
 *     );
 *   }
 */

// Page structure
export { default as BimPageShell } from "./BimPageShell";
export { BimPageHeader } from "./BimPageHeader";

// Panel / card
export { BimPanel } from "./BimPanel";

// Table
export {
  BimTable,
  BimThead,
  BimTh,
  BimTbody,
  BimTr,
  BimTd,
} from "./BimTable";

// Buttons
export { BimButton, bimBtnClass } from "./BimButton";
export type { BimButtonVariant, BimButtonSize } from "./BimButton";

// Status badge
export { BimBadge, badgeColor } from "./BimBadge";
export type { BadgeColor } from "./BimBadge";

// State boxes
export { BimStateBox } from "./BimStateBox";

// Stat card
export { BimStatCard } from "./BimStatCard";
export type { StatColor } from "./BimStatCard";

// Section label
export { BimSectionLabel } from "./BimSectionLabel";
