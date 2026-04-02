"use client";

import Link from "next/link";
import {
  Calculator,
  FolderPlus,
  PenTool,
  RefreshCw,
  Ruler,
  Upload,
} from "lucide-react";
import { BimPanel } from "@/app/components/company/ui/BimPanel";
import { BimSectionLabel } from "@/app/components/company/ui/BimSectionLabel";

const ACTIONS = [
  {
    href: "/company/projects?action=new",
    icon: FolderPlus,
    label: "Create Project",
    color: "text-[#d4933c]",
    ring: "border-[#6b3e14] bg-[#1a0f06]",
  },
  {
    href: "/company/projects",
    icon: PenTool,
    label: "Open Editor",
    color: "text-[#60a5fa]",
    ring: "border-[#1e3a5f] bg-[#0a1422]",
  },
  {
    href: "/company/files",
    icon: Upload,
    label: "Upload CAD / PDF",
    color: "text-[#34d399]",
    ring: "border-[#064e3b] bg-[#021a14]",
  },
  {
    href: "/company/conversion-requests",
    icon: RefreshCw,
    label: "Review Conversion",
    color: "text-[#fbbf24]",
    ring: "border-[#78350f] bg-[#1a0e00]",
  },
  {
    href: "/company/cost-estimation?action=quantities",
    icon: Ruler,
    label: "Generate Quantities",
    color: "text-[#a78bfa]",
    ring: "border-[#3b1f6b] bg-[#100920]",
  },
  {
    href: "/company/cost-estimation",
    icon: Calculator,
    label: "Open Estimate",
    color: "text-[#f87171]",
    ring: "border-[#7f1d1d] bg-[#1a0808]",
  },
];

export default function BimQuickActions() {
  return (
    <BimPanel as="section" className="shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <BimSectionLabel className="mb-4">Quick Actions</BimSectionLabel>
      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-3 rounded-xl border border-[#2b1e12] bg-[#0e0b08] px-3 py-3 transition hover:border-[#5a3820] hover:bg-[#1a1209]"
          >
            <span className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg border ${a.ring}`}>
              <a.icon className={`h-4 w-4 ${a.color}`} />
            </span>
            <span className="text-xs font-semibold leading-tight text-[#e2caa8]">{a.label}</span>
          </Link>
        ))}
      </div>
    </BimPanel>
  );
}
