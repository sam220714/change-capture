import Link from "next/link";
import { ArrowRight, FileCheck2, GitBranch, MailSearch, ReceiptText, Scale, ShieldCheck } from "lucide-react";
import { CasePage, DarkCard, LightCallout, Section, Stat } from "@/components/case";
import { LinkButton } from "@/components/ui";
import { THREADS } from "@/lib/data/threads";
import { supplierById } from "@/lib/data/company";

const LOOP = [
  { icon: MailSearch, title: "Read", text: "A thread the business owner pastes is matched to the contract by email domain and latest SOW." },
  { icon: FileCheck2, title: "Decide What Was Agreed", text: "The AI marks each change proposed, agreed, rejected or superseded, quoting the email that proves it." },
  { icon: Scale, title: "Check", text: "Rules test the MSA (is email enough?), the approver's authority, rate caps and PO headroom." },
  { icon: GitBranch, title: "Route", text: "Business owner confirms; Finance and Legal get only what crosses their limits, with the reason." },
  { icon: ShieldCheck, title: "Draft and Approve", text: "Amendment, supplier confirmation and holding replies are drafted. Nothing leaves without a person's approval." },
  { icon: ReceiptText, title: "Keep Terms Current", text: "Approved changes update the contract's terms, each traced to source, and invoices are checked against them." },
];

const LOOK_FOR: Record<string, string> = {
  "t-tb-qa": "Inside every limit. The only catch: the MSA says email doesn't amend the contract, so an amendment is drafted.",
  "t-ka-ext": "Nothing is fully agreed. The AI separates the rejected analyst, the superseded 4-week extension and the open condition.",
  "t-ll-festive": "A coordinator said yes. The MSA allows email change orders, but only from an authorised person.",
  "t-tb-senior": "An 11.9% rise against a 5% MSA cap, plus Net 15 that the supplier treats as agreed. Goes to Finance and Legal.",
};

export default function Home() {
  return (
    <CasePage
      eyebrow="Sirion Assessment · Stage 1: Contract Intake"
      title="Changes Agreed Over Email, Captured Into the Contract"
      lead="Rates, headcount, dates, scope and payment terms on live supplier contracts get agreed in email and never reach the contract. Change Capture reads those threads, works out what was actually agreed, routes it to the right people, and keeps the contract current, so invoices are checked against the real terms."
    >
      <div className="-mt-6 flex flex-wrap gap-3">
        <LinkButton href="/app/capture" className="rounded-md px-4 py-3 text-lg">
          Start the Demo <ArrowRight size={18} strokeWidth={1.5} />
        </LinkButton>
        <LinkButton href="/case/why" variant="secondary-dark" className="rounded-md px-4 py-3 text-lg">
          Read the Case
        </LinkButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Stat value="2–3%" label="Of Procurement Contract Value Lost to Unrecorded or Unauthorised Changes" source="WorldCC with Ironclad, 2026" />
        <Stat value="54%" label="Have No Automated Data Flow Between Contract Systems" source="WorldCC with Sirion, 2026" />
        <Stat value="3.6%" label="Of Supplier Invoices Contain Errors" source="IOFM via SC&H" />
      </div>

      <Section eyebrow="How It Works" title="One Loop, From Thread to Invoice">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LOOP.map((s, i) => (
            // Subgrid: each card spans 4 rows so icon, step, title and text line up across a row of cards.
            <DarkCard key={s.title} as="li" className="sm:row-span-4 sm:grid sm:grid-rows-subgrid sm:gap-y-0">
              <span className="hairline flex h-[50px] w-[50px] items-center justify-center rounded-[9px] border-sirion-line">
                <s.icon size={22} strokeWidth={1.5} className="text-sirion-line" />
              </span>
              <p className="mt-4 text-xs font-bold uppercase tracking-[1.5px] text-sirion-line">Step {i + 1}</p>
              <h3 className="mt-1 text-2xl font-normal text-sirion-text">{s.title}</h3>
              <p className="mt-2 text-base font-light leading-6 text-sirion-soft">{s.text}</p>
            </DarkCard>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl text-base font-light text-sirion-soft">
          <span className="text-sirion-text">AI reads, rules decide.</span> The model does what it is good at: reading a messy conversation and quoting evidence. Who approves, and whether a change breaks the MSA, is decided by plain rules
          anyone can audit.
        </p>
      </Section>

      <Section eyebrow="The Prototype" title="Four Threads to Try">
        <div className="grid gap-4 lg:grid-cols-2">
          {THREADS.map((t) => (
            <Link key={t.id} href={`/app/capture/${t.id}`} className="group">
              <DarkCard className="h-full transition-shadow group-hover:shadow-glow">
                <p className="text-xs font-bold uppercase tracking-[1.5px] text-sirion-line">{t.label}</p>
                <h3 className="mt-2 text-2xl font-normal text-sirion-text">{t.subject}</h3>
                <p className="mt-1 text-sm text-sirion-soft">{supplierById(t.supplierId)?.name}</p>
                <p className="mt-3 text-base font-light leading-6 text-sirion-soft">{LOOK_FOR[t.id]}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-base text-sirion-text">
                  Capture <ArrowRight size={16} strokeWidth={1.5} />
                </span>
              </DarkCard>
            </Link>
          ))}
        </div>
      </Section>

      <LightCallout>
        <p className="text-xs font-bold uppercase tracking-[1.5px] text-sirion-s3">Suggested Path, About 5 Minutes</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-7">
          <li>Viewing as Priya, capture the QA rate thread, approve it, send the amendment and mark it signed. Contract Terms now show ₹1,236 with its source.</li>
          <li>Capture the senior developer thread. Note the MSA cap breach. Approve as Priya, then switch to Rahul (Finance) and Anika (Legal).</li>
          <li>Capture the festive campaign thread and switch to Vikram to ratify or reject what the coordinator agreed.</li>
          <li>Capture the Kestrel thread. Nothing is agreed, so you get a clarifying reply to approve instead of an approval chain.</li>
          <li>Open Invoice Check and flip between SOW Only and Current Agreed Terms.</li>
        </ol>
      </LightCallout>
    </CasePage>
  );
}
