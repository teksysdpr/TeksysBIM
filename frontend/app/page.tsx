import Link from "next/link";
import type { Metadata } from "next";
import { Building2, ClipboardList, Compass, Layers3, NotebookPen, Ruler, Sigma } from "lucide-react";
import { PremiumCard, SectionTitle } from "@/app/components/marketing/MarketingBlocks";
import HomeContactForm from "@/app/components/home/HomeContactForm";

export const metadata: Metadata = {
  title: "TeksysBIM",
  description:
    "Premium BIM solutions and consultancy portal for BIM modeling, project management support, and model-based estimation and costing.",
};

const pillarCards = [
  {
    title: "BIM Modeling & Conversion",
    description:
      "Convert CAD drawings, PDFs, and design information into intelligent BIM models that improve visualization, coordination, and digital readiness.",
    icon: Layers3,
  },
  {
    title: "BIM-Based Project Management Consultancy",
    description:
      "Use BIM as a practical project intelligence layer for design coordination, milestone reviews, planning support, and developer-side decision-making.",
    icon: ClipboardList,
  },
  {
    title: "BIM-Based Estimation & Costing",
    description:
      "Leverage BIM for quantity takeoff, BOQ support, estimation workflows, and clearer cost understanding linked to project design.",
    icon: Sigma,
  },
];

const valueHighlights = [
  "Better design coordination",
  "Better visibility for developers",
  "Better project review support",
  "Better quantity confidence",
  "Better cost awareness",
];

const services = [
  {
    title: "CAD to BIM Conversion",
    description:
      "Transform 2D drawings, PDFs, and legacy CAD data into structured BIM models.",
    icon: Ruler,
  },
  {
    title: "BIM Modeling & Coordination",
    description:
      "Develop architectural, structural, and MEP models that support coordination, review, and project understanding.",
    icon: Layers3,
  },
  {
    title: "BIM-Based Project Management Consultancy",
    description:
      "Support project teams and developers with BIM-led design review, coordination workflows, milestone discussions, and planning visibility.",
    icon: NotebookPen,
  },
  {
    title: "BIM-Based Estimation & Costing",
    description:
      "Use BIM-derived quantities to strengthen BOQ preparation, cost planning, and design-linked commercial evaluation.",
    icon: Sigma,
  },
];

const solutions = [
  {
    title: "For Design Coordination",
    description:
      "Improve visibility between architecture, structural, and MEP disciplines before issues become costly downstream problems.",
  },
  {
    title: "For Project Management Support",
    description:
      "Use BIM in planning discussions, milestone reviews, coordination meetings, and project-side technical understanding.",
  },
  {
    title: "For Estimation & Cost Clarity",
    description:
      "Support better cost planning with model-based quantities and stronger quantity confidence.",
  },
  {
    title: "For Developer-Side BIM Advisory",
    description:
      "Help developers use BIM as a decision-support tool rather than just a design deliverable.",
  },
];

const industries = [
  {
    title: "Real Estate Developers",
    description:
      "Gain stronger design visibility, coordination insight, and model-backed project understanding.",
  },
  {
    title: "EPC Contractors",
    description:
      "Improve coordination, constructability review, and execution planning support through BIM.",
  },
  {
    title: "PMC / Consultant Teams",
    description:
      "Bring more structure to technical reviews, project discussions, and decision workflows.",
  },
  {
    title: "Architects & Engineers",
    description:
      "Improve digital coordination quality and downstream usability of design information.",
  },
];

const whyBimBenefits = [
  "Stronger visualization",
  "Improved interdisciplinary coordination",
  "Early issue identification",
  "Better quantity extraction",
  "More informed project and cost decisions",
];

const whyTeksys = [
  "Domain-aware BIM support",
  "Practical orientation toward project outcomes",
  "Suitable for developer-side and project-side use",
  "Stronger link between design, management, and cost insight",
  "Premium, consultancy-led engagement approach",
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080505] text-[#f5e7cf]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
      >
        <div className="relative h-screen min-h-[620px]">
          <img
            src="/images/home_image.png"
            alt=""
            aria-hidden="true"
            className="block h-full w-full object-cover object-center opacity-[0.78]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f0b]/14 via-[#120b08]/42 to-[#080505]/92" />
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 14%, rgba(194,142,78,0.16), transparent 26%),
            radial-gradient(circle at 16% 76%, rgba(122,63,48,0.10), transparent 24%),
            radial-gradient(circle at 84% 56%, rgba(194,142,78,0.10), transparent 22%),
            linear-gradient(180deg, rgba(10,7,6,0.08) 0%, rgba(8,5,5,0.32) 42%, rgba(8,5,5,0.78) 100%)
          `,
        }}
      />
      <section className="relative overflow-hidden border-b border-[#3f2720]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(132,72,57,0.24),transparent_40%),radial-gradient(circle_at_85%_0%,rgba(204,146,76,0.12),transparent_30%)]" />
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-14 md:px-6 lg:px-8 lg:pb-16 lg:pt-18">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="mx-auto max-w-5xl text-4xl font-black leading-[1.08] text-[#fff4df] drop-shadow-[0_16px_42px_rgba(0,0,0,0.58)] sm:text-5xl lg:text-[64px] lg:leading-[1.06]">
                Beyond CAD to BIM — Bringing Design, Project Management, and Cost Intelligence
                Together
              </h1>
            <p className="mx-auto mt-6 max-w-4xl text-base leading-8 text-[#e0cdb1] sm:text-xl">
              TeksysBIM helps real estate developers, consultants, and project teams use Building
              Information Modeling for more than just conversion — enabling stronger design
              coordination, BIM-based project management consultancy, and model-driven estimation
              and costing.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/#services"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#d7a35d] to-[#bc8643] px-8 py-3.5 text-base font-black text-[#2a1608] shadow-[0_18px_40px_rgba(188,134,67,0.34)] transition hover:scale-[1.02]"
              >
                Explore Our Services
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-2xl border border-[#7c4c2f] bg-[#1d120f]/88 px-8 py-3.5 text-base font-bold text-[#f3c98e] transition hover:bg-[#2a1812]"
              >
                Request Consultation
              </a>
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-[26px] border border-[#65412f] bg-[#1c130f]/82 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.32)] backdrop-blur">
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-r from-[#d7a35d]/40 via-[#bc8643]/20 to-transparent" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7c4c2f] bg-[#120b08]/70 text-[#f3c98e]">
                  <Layers3 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-[#f7d6a8]">BIM Modeling</h3>
                  <p className="mt-2 text-base text-[#e8cdab]">Design Intelligence</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[26px] border border-[#6b4532] bg-[#201510]/82 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.32)] backdrop-blur">
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-r from-[#b37a52]/40 via-[#8f5c40]/20 to-transparent" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7c4c2f] bg-[#120b08]/70 text-[#f3c98e]">
                  <Compass className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-[#f7d6a8]">Project Management</h3>
                  <p className="mt-2 text-base text-[#e8cdab]">Coordination / Review</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[26px] border border-[#72503b] bg-[#251812]/82 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.32)] backdrop-blur">
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-r from-[#d7a35d]/40 via-[#bc8643]/20 to-transparent" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7c4c2f] bg-[#120b08]/70 text-[#f3c98e]">
                  <Sigma className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-[#f7d6a8]">Estimation</h3>
                  <p className="mt-2 text-base text-[#e8cdab]">Quantities / Cost Clarity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-[#3f2720] bg-[#110b09] py-3">
          <p className="mx-auto max-w-7xl px-4 text-center text-sm font-semibold text-[#dfbe92] md:px-6 lg:px-8">
            From CAD conversion to project visibility and cost intelligence — TeksysBIM brings
            more value out of every model.
          </p>
        </div>
      </section>

      <section id="pillars" className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8 lg:py-18">
        <SectionTitle
          align="center"
          title="Three BIM Capabilities. One Smarter Project Foundation."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {pillarCards.map((item) => (
            <PremiumCard key={item.title} title={item.title} description={item.description}>
              <item.icon className="h-7 w-7 text-[#e8b875]" />
            </PremiumCard>
          ))}
        </div>
      </section>

      <section className="border-y border-[#3f2720] bg-[#0f0a08]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-18">
          <SectionTitle
            title="More Than Modeling. More Than Visualization."
            description="Most BIM service providers stop at model creation. TeksysBIM goes further by helping clients use BIM as a working layer for coordination, project understanding, and commercial clarity."
          />
          <div className="grid gap-3">
            {valueHighlights.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-[#5d3a2b] bg-[#19100d] px-4 py-3 text-sm font-semibold text-[#e4c294]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8 lg:py-18">
        <SectionTitle title="Specialized BIM Services for Project-Driven Organizations" />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {services.map((item) => (
            <PremiumCard key={item.title} title={item.title} description={item.description}>
              <item.icon className="h-7 w-7 text-[#e8b875]" />
            </PremiumCard>
          ))}
        </div>
      </section>

      <section id="solutions" className="border-y border-[#3f2720] bg-[#0f0a08]">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8 lg:py-18">
          <SectionTitle
            title="How TeksysBIM Creates Value Across the Project Lifecycle"
            description="BIM support structured for design coordination, project-side visibility, and model-linked cost intelligence."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {solutions.map((item) => (
              <PremiumCard key={item.title} title={item.title} description={item.description} />
            ))}
          </div>
        </div>
      </section>

      <section id="industries" className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8 lg:py-18">
        <SectionTitle title="Built for Stakeholders Who Need More Than a Model" />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {industries.map((item) => (
            <PremiumCard key={item.title} title={item.title} description={item.description}>
              <Building2 className="h-7 w-7 text-[#e8b875]" />
            </PremiumCard>
          ))}
        </div>
      </section>

      <section className="border-y border-[#3f2720] bg-[#0f0a08]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-18">
          <SectionTitle
            title="Why BIM Matters Beyond Design"
            description="BIM is not only a design deliverable. When used strategically, it becomes a practical information layer that helps teams review smarter, coordinate earlier, and estimate with greater confidence."
          />
          <div className="grid gap-3">
            {whyBimBenefits.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-[#5d3a2b] bg-[#19100d] px-4 py-3 text-sm font-semibold text-[#e4c294]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why-teksysbim" className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8 lg:py-18">
        <SectionTitle
          title="Why TeksysBIM"
          description="TeksysBIM combines modeling capability with project understanding. That allows us to support clients not only in creating BIM models, but also in extracting practical value from them for coordination, project consultancy, and costing workflows."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {whyTeksys.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-[#5d3a2b] bg-[#140d0a] px-5 py-4 text-sm font-semibold leading-7 text-[#e2bf92]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="border-y border-[#3f2720] bg-[#0f0a08]">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8 lg:py-18">
          <SectionTitle
            title="Building Practical Value Through BIM"
            description="TeksysBIM is focused on helping project-driven organizations extract more value from Building Information Modeling through intelligent model creation, coordination support, project management consultancy, and model-based estimation insight."
          />
        </div>
      </section>

      <section id="contact" className="border-t border-[#3f2720] bg-[#0f0a08]">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-6 rounded-[34px] border border-[#4c3025] bg-gradient-to-r from-[#130d0b] via-[#17100d] to-[#120c0a] px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.34)] lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d9aa72]">Contact Us</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#fff1db] sm:text-5xl">
                Discuss BIM priorities for your next project
              </h2>
              <p className="mt-5 text-base leading-8 text-[#d8c3a1]">
                Tell us if you need CAD-to-BIM conversion, BIM coordination, BIM-led project
                consultancy, or model-based estimation and costing support.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "BIM modeling and discipline coordination",
                  "Developer-side BIM review and advisory",
                  "Project management support with BIM workflows",
                  "Model-driven quantity and cost intelligence",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-[#5a3a2c] bg-[#1a110e] px-4 py-3 text-sm font-semibold text-[#e8cdab]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <HomeContactForm />
          </div>
        </div>
      </section>

      <section id="final-cta" className="border-t border-[#3f2720] bg-[#120c0a]">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center md:px-6 lg:px-8 lg:py-18">
          <h2 className="text-3xl font-black text-[#fff1db] sm:text-4xl">
            Looking to use BIM for more than just modeling?
          </h2>
          <p className="mx-auto mt-5 max-w-4xl text-base leading-8 text-[#d8c3a1] sm:text-lg">
            Let’s discuss how TeksysBIM can support your project through intelligent modeling,
            BIM-led project consultancy, and model-based estimation and costing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/#final-cta"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d7a35d] to-[#bc8643] px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#2a1608] shadow-[0_16px_30px_rgba(188,134,67,0.32)] transition hover:brightness-105"
            >
              Request Consultation
            </Link>
            <a
              href="mailto:info@teksys.in"
              className="inline-flex items-center justify-center rounded-xl border border-[#7c4c2f] bg-[#1d120f] px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#f3c98e] transition hover:bg-[#2a1812]"
            >
              Contact Our Team
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
