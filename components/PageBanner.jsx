import HeroDecor from "@/components/HeroDecor";

export default function PageBanner({ title, subtitle, icon = null, children }) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-[#0f3d2e] to-[#14523d] px-4 pt-10 pb-20 text-center text-white md:pt-12 md:pb-28 hd-over">
      <HeroDecor variant="compact" />
      <div className="max-w-3xl mx-auto">
        {icon}
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/75">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}
