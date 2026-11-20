import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, Sparkles } from "lucide-react";
import type { ChangeStatus, CheckLevel, RecordStage } from "@/lib/types";

type Variant = "primary" | "secondary" | "secondary-dark" | "ghost";

const base = "inline-flex items-center justify-center gap-2 rounded-sm px-3.5 py-2 text-sm font-normal transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const variants: Record<Variant, string> = {
  primary: "bg-sirion-accent text-white hover:bg-sirion-accent-hover",
  secondary: "hairline border-sirion-ink/60 text-sirion-ink hover:bg-sirion-light",
  "secondary-dark": "hairline border-white text-white hover:bg-white/10",
  ghost: "text-sirion-s3 hover:underline px-0",
};

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs font-bold uppercase tracking-[1.5px] text-sirion-line ${className}`}>{children}</p>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`hairline rounded-lg border-sirion-light bg-sirion-card ${className}`}>{children}</div>;
}

export function PageHeader({ eyebrow, title, lead, actions }: { eyebrow: string; title: string; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-2 text-[32px] leading-9 text-sirion-ink">{title}</h1>
        {lead && <p className="mt-2 text-base font-light text-sirion-muted2">{lead}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Teal-marked block for anything the AI produced. */
export function AIPanel({ title, children, meta, className = "" }: { title: string; children: ReactNode; meta?: ReactNode; className?: string }) {
  return (
    <section className={`ai-surface rounded-r-lg p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[1.5px] text-sirion-s3">
          <Sparkles size={14} strokeWidth={1.5} /> {title}
        </p>
        {meta}
      </div>
      {children}
    </section>
  );
}

const statusStyle: Record<ChangeStatus, string> = {
  agreed: "bg-sirion-s3 text-white",
  proposed: "hairline border-sirion-warning text-sirion-warning-ink bg-sirion-warning-soft",
  rejected: "hairline border-sirion-muted text-sirion-muted2",
  superseded: "hairline border-sirion-muted text-sirion-muted2 line-through",
};

export function StatusChip({ status }: { status: ChangeStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs capitalize ${statusStyle[status]}`}>{status}</span>;
}

const stageLabel: Record<RecordStage, string> = {
  clarifying: "Needs clarification",
  in_review: "In approval",
  approved: "Approved, drafts ready",
  sent: "Sent for signature",
  executed: "In contract",
  rejected: "Rejected",
};
const stageStyle: Record<RecordStage, string> = {
  clarifying: "hairline border-sirion-warning text-sirion-warning-ink",
  in_review: "hairline border-sirion-s3 text-sirion-s3",
  approved: "bg-sirion-light text-sirion-s3",
  sent: "bg-sirion-light text-sirion-s3",
  executed: "bg-sirion-s3 text-white",
  rejected: "hairline border-sirion-danger text-sirion-danger",
};

export function StageChip({ stage }: { stage: RecordStage }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ${stageStyle[stage]}`}>{stageLabel[stage]}</span>;
}

const levelIcon: Record<CheckLevel, ReactNode> = {
  ok: <CheckCircle2 size={18} strokeWidth={1.5} className="text-sirion-success" />,
  info: <Info size={18} strokeWidth={1.5} className="text-sirion-line" />,
  warn: <AlertTriangle size={18} strokeWidth={1.5} className="text-sirion-warning" />,
  block: <OctagonAlert size={18} strokeWidth={1.5} className="text-sirion-danger" />,
};

export function LevelIcon({ level }: { level: CheckLevel }) {
  return <span className="mt-0.5 shrink-0">{levelIcon[level]}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="hairline rounded-lg border-dashed border-sirion-line/60 bg-sirion-card p-10 text-center">
      <p className="text-lg font-light text-sirion-ink">{title}</p>
      {children && <div className="mt-2 text-sm text-sirion-muted2">{children}</div>}
    </div>
  );
}

/** Light work surface wrapper for prototype pages. */
export function WorkSurface({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-sirion-app text-sirion-ink">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">{children}</div>
    </div>
  );
}
