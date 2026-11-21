import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export function CasePage({ eyebrow, title, lead, children, next }: { eyebrow: string; title: string; lead?: ReactNode; children: ReactNode; next?: { href: string; label: string } }) {
  return (
    <div className="hero-glow min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-14 md:px-8 md:pt-20">
        <span className="hairline inline-flex rounded-full border-sirion-line px-4 py-1 text-sm text-sirion-soft">{eyebrow}</span>
        <h1 className="mt-5 max-w-4xl text-[40px] leading-[1.1] text-sirion-text md:text-[52px]">{title}</h1>
        {lead && <p className="mt-5 max-w-3xl text-lg font-light leading-7 text-sirion-soft">{lead}</p>}
        <div className="mt-14 space-y-16">{children}</div>
        {next && (
          <Link href={next.href} className="mt-20 inline-flex items-center gap-2 text-base text-sirion-text hover:underline">
            Next: {next.label} <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        )}
      </div>
    </div>
  );
}

export function Section({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section>
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[1.5px] text-sirion-line">{eyebrow}</p>}
      <h2 className="mt-2 text-[32px] leading-9 tracking-[-0.32px] text-sirion-text">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Pass `as="li"` when the card is a direct child of a list, so a subgrid can align its rows with its neighbours. */
export function DarkCard({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  return <Tag className={`hairline rounded-lg border-sirion-line/50 bg-sirion-s2 p-6 ${className}`}>{children}</Tag>;
}

export function Stat({ value, label, source }: { value: string; label: string; source: string }) {
  return (
    <DarkCard className="lg:row-span-3 lg:grid lg:grid-rows-subgrid lg:gap-y-0">
      <p className="text-[40px] font-light leading-none text-sirion-text">{value}</p>
      <p className="mt-3 text-lg font-bold leading-[22px] text-sirion-text">{label}</p>
      <p className="pt-2 text-xs text-sirion-soft">{source}</p>
    </DarkCard>
  );
}

export function LightCallout({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-sirion-light p-8 text-sirion-ink">{children}</div>;
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-3xl space-y-4 text-base leading-7 text-sirion-soft [&_strong]:font-normal [&_strong]:text-sirion-text">{children}</div>;
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="hairline inline-flex whitespace-nowrap rounded-full border-sirion-line/70 px-2.5 py-0.5 text-xs text-sirion-soft">{children}</span>;
}
