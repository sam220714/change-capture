"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { BarChart3, FileStack, FileText, ClipboardPaste, Lightbulb, ListChecks, Network, ReceiptText, RotateCcw, Target, Telescope } from "lucide-react";
import { useStore } from "@/lib/store";
import { PEOPLE, VIEWERS } from "@/lib/data/company";

const CASE = [
  { href: "/", label: "Overview", icon: Telescope },
  { href: "/case/why", label: "Why This Stage", icon: Lightbulb },
  { href: "/case/stakeholders", label: "Stakeholder Map", icon: Network },
  { href: "/case/problem", label: "The Problem", icon: Target },
  { href: "/case/metrics", label: "Success Metrics", icon: BarChart3 },
  { href: "/case/assumptions", label: "Assumptions", icon: FileText },
];

const APP = [
  { href: "/app/capture", label: "Paste a Thread", icon: ClipboardPaste },
  { href: "/app/changes", label: "Change Records", icon: ListChecks },
  { href: "/app/contracts", label: "Contract Terms", icon: FileStack },
  { href: "/app/invoices", label: "Invoice Check", icon: ReceiptText },
];

function NavLink({ href, label, icon: Icon, badge, path }: { href: string; label: string; icon: typeof ClipboardPaste; badge?: number; path: string }) {
  const active = href === "/" ? path === "/" : path.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
        active ? "bg-sirion-s2 text-sirion-text shadow-glow" : "text-sirion-soft hover:bg-sirion-s1 hover:text-sirion-text"
      }`}
    >
      <Icon size={16} strokeWidth={1.5} className={active ? "text-sirion-soft" : "text-sirion-line"} />
      <span className="whitespace-nowrap">{label}</span>
      {badge ? <span className="ml-auto rounded-full bg-sirion-accent px-1.5 text-[11px] leading-5 text-white">{badge}</span> : null}
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { viewerId, setViewer, records, reset } = useStore();
  const myOpen = records.reduce((n, r) => {
    const mine = r.steps.filter((s) => s.assigneeId === viewerId && s.status === "pending");
    const ownerFirst = r.steps.find((s) => s.role === "business_owner");
    const unlocked = mine.filter((s) => s.role === "business_owner" || ownerFirst?.status === "approved");
    return n + (r.stage === "in_review" || r.stage === "clarifying" ? unlocked.length : 0);
  }, 0);

  const onReset = () => {
    if (window.confirm("Clear all change records and start the demo again?")) reset();
  };

  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-sirion-s2 px-4 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="whitespace-nowrap text-lg font-light tracking-tight text-sirion-text">Change Capture</span>
          <span className="hairline hidden rounded-full sm:inline border-sirion-line px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[1.5px] text-sirion-soft">Prototype</span>
        </Link>
        <label className="flex items-center gap-2 text-sm text-sirion-soft">
          <span className="hidden sm:inline">Viewing as</span>
          <select
            value={viewerId}
            onChange={(e) => setViewer(e.target.value)}
            className="hairline w-[200px] rounded-sm border-sirion-line bg-sirion-s1 px-3 py-2 text-sm text-sirion-text sm:w-auto sm:max-w-[240px]"
          >
            {VIEWERS.map((id) => {
              const p = PEOPLE.find((x) => x.id === id)!;
              return (
                <option key={id} value={id}>
                  {p.name}, {p.role === "business_owner" ? "Business" : p.role === "finance" ? "Finance" : "Legal"}
                </option>
              );
            })}
          </select>
        </label>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="bg-sirion-base md:sticky md:top-16 md:h-[calc(100vh-64px)] md:w-60 md:shrink-0 md:overflow-y-auto">
          <Suspense fallback={<NavList path="" myOpen={myOpen} onReset={onReset} />}>
            <NavWithPath myOpen={myOpen} onReset={onReset} />
          </Suspense>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

type NavProps = { myOpen: number; onReset: () => void };

function NavWithPath(props: NavProps) {
  const path = usePathname();
  return <NavList path={path} {...props} />;
}

function NavList({ path, myOpen, onReset }: NavProps & { path: string }) {
  return (
          <nav className="flex gap-1 overflow-x-auto py-3 pl-4 pr-10 [mask-image:linear-gradient(to_right,#000_calc(100%-40px),transparent)] md:flex-col md:px-3 md:py-6 md:[mask-image:none]">
            <p className="hidden px-3 pb-2 text-xs font-bold uppercase tracking-[1.5px] text-sirion-line md:block">The Case</p>
            {CASE.map((i) => (
              <NavLink key={i.href} {...i} path={path} />
            ))}
            <p className="hidden px-3 pb-2 pt-6 text-xs font-bold uppercase tracking-[1.5px] text-sirion-line md:block">Prototype</p>
            <span className="mx-2 w-px shrink-0 bg-sirion-s2 md:hidden" />
            {APP.map((i) => (
              <NavLink key={i.href} {...i} path={path} badge={i.href === "/app/changes" ? myOpen : undefined} />
            ))}
            <button
              onClick={onReset}
              className="flex shrink-0 items-center gap-3 rounded-sm px-3 py-2 text-sm text-sirion-line hover:text-sirion-soft md:mt-6"
            >
              <RotateCcw size={16} strokeWidth={1.5} /> <span className="whitespace-nowrap">Reset Demo</span>
            </button>
          </nav>
  );
}
