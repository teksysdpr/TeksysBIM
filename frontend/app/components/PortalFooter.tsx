export default function PortalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#3f2720] bg-[#090706] px-4 py-10 text-[#d2b991] md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 border-b border-[#332019] pb-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/TeksysMain_logo.png"
                alt="Teksys Enterprises"
                className="h-7 w-auto"
                style={{ maxWidth: 132 }}
              />
              <span className="text-sm font-bold text-[#e8d4b5]">
                TeksysBIM is a product of Teksys Enterprises (P) Ltd.
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#c4ab85]">
              TeksysBIM helps project-driven organizations derive more value from BIM through
              design intelligence, project support, and cost clarity.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
            <a href="/#services" className="rounded-lg border border-[#3f2720] bg-[#130d0b] px-3 py-2 hover:text-[#efc486]">
              Services
            </a>
            <a href="/#solutions" className="rounded-lg border border-[#3f2720] bg-[#130d0b] px-3 py-2 hover:text-[#efc486]">
              Solutions
            </a>
            <a href="/#industries" className="rounded-lg border border-[#3f2720] bg-[#130d0b] px-3 py-2 hover:text-[#efc486]">
              Industries
            </a>
            <a href="/#about" className="rounded-lg border border-[#3f2720] bg-[#130d0b] px-3 py-2 hover:text-[#efc486]">
              About
            </a>
            <a href="/#final-cta" className="rounded-lg border border-[#3f2720] bg-[#130d0b] px-3 py-2 hover:text-[#efc486]">
              Contact
            </a>
          </div>
        </div>

        <p className="pt-4 text-xs text-[#b79d79]">
          IPR Notice: All rights in logo, brand, and platform are reserved by Teksys Enterprises
          (P) Ltd. © {year}
        </p>
      </div>
    </footer>
  );
}
