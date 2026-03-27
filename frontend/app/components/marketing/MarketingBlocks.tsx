import Link from "next/link";
import type { ReactNode } from "react";

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

type PremiumCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

type HeroAction = {
  label: string;
  href: string;
  style?: "primary" | "secondary";
};

type PageHeroProps = {
  title: string;
  description: string;
  actions?: HeroAction[];
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SectionTitle({ eyebrow, title, description, align = "left" }: SectionTitleProps) {
  return (
    <div className={cx("max-w-4xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e7b877]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-3xl font-black leading-tight text-[#fff2df] sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-base leading-8 text-[#d5c1a1] sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}

export function PremiumCard({ title, description, children }: PremiumCardProps) {
  return (
    <article className="rounded-[24px] border border-[#4a2b23] bg-gradient-to-b from-[#18100c] to-[#0e0907] p-6 shadow-[0_18px_34px_rgba(0,0,0,0.35)]">
      <h3 className="text-xl font-black text-[#f9debb]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#ceb48f]">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </article>
  );
}

export function PageHero({ title, description, actions = [] }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-[#3f2720] bg-[radial-gradient(circle_at_top_right,rgba(149,76,58,0.2),transparent_45%),linear-gradient(140deg,#090605,#140c0a_48%,#1b0f0d)]">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-14 md:px-6 lg:px-8 lg:pb-16 lg:pt-18">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-black leading-tight text-[#fff3df] sm:text-5xl">{title}</h1>
          <p className="mt-5 text-base leading-8 text-[#d8c3a1] sm:text-lg">{description}</p>
          {actions.length > 0 ? (
            <div className="mt-7 flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={cx(
                    "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-black uppercase tracking-[0.08em] transition",
                    action.style === "secondary"
                      ? "border border-[#7c4c2f] bg-[#1f120f] text-[#f2c98f] hover:bg-[#2a1812]"
                      : "bg-gradient-to-r from-[#d7a35d] to-[#ba8241] text-[#2a1608] shadow-[0_14px_26px_rgba(186,130,65,0.3)] hover:brightness-105"
                  )}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
