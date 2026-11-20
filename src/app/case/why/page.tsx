import { CasePage, DarkCard, LightCallout, Prose, Section } from "@/components/case";

const REASONS = [
  {
    title: "The Money Leaks After Signature",
    text: "WorldCC puts post-signature loss at about 11% of procurement contract value. Unauthorised or unrecorded changes are named as one of the biggest parts, at 2–3%, with untracked price adjustments another 1–2%.",
  },
  {
    title: "It Links All Three Symptoms in the Brief",
    text: "Requests get lost: the change sits in someone's inbox. Approvals stall: nobody knows who must approve a 12% rise. Invoices don't match: the supplier bills the new rate, the contract still says the old one.",
  },
  {
    title: "The Repository Goes Stale Without It",
    text: "WorldCC and Sirion (2026) found contract data is often captured once, then updated manually, periodically, or only at amendment or renewal. A repository is only as good as its last update.",
  },
  {
    title: "Current AI Is Good at Exactly This",
    text: "Reading a messy thread, telling a proposal from an acceptance, and quoting the line that proves it are things today's models do well. The parts they should not own, like who may approve, stay in rules.",
  },
];

export default function WhyPage() {
  return (
    <CasePage
      eyebrow="1 · Why This Stage"
      title="Intake, Applied to Contracts That Are Already Signed"
      lead="The brief describes intake as turning scattered requests into structured, routed, trackable work. The most expensive scattered requests are not new contracts. They are changes to live ones, agreed in email."
      next={{ href: "/case/stakeholders", label: "Stakeholder Map" }}
    >
      <Section eyebrow="The Choice" title="Changes on Live Contracts Are Intake Requests">
        <Prose>
          <p>
            A staffing agency asks for a rate rise. A consultancy wants four more weeks. An agency adds a video campaign. Each is a request to change a contract, and each is
            settled the way the brief describes: in email, with no routing, no tracking and no update to the contract.
          </p>
          <p>
            We assume the repository already exists, with MSAs and SOWs stored and structured. <strong>Change Capture is the intake channel that keeps it current.</strong>
          </p>
        </Prose>
      </Section>

      <Section eyebrow="Why It Is Worth Solving" title="Four Reasons">
        <div className="grid gap-4 md:grid-cols-2">
          {REASONS.map((r) => (
            <DarkCard key={r.title}>
              <h3 className="text-2xl font-normal text-sirion-text">{r.title}</h3>
              <p className="mt-3 text-base font-light leading-6 text-sirion-soft">{r.text}</p>
            </DarkCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Why Not the Others" title="Where Sirion Already Leads">
        <div className="grid gap-4 md:grid-cols-3">
          <DarkCard>
            <h3 className="text-xl font-normal text-sirion-text">Negotiation</h3>
            <p className="mt-2 text-base font-light leading-6 text-sirion-soft">Strong and productised at Sirion: IssueDetection and Redline agents in Word, playbooks, counterparty portal.</p>
          </DarkCard>
          <DarkCard>
            <h3 className="text-xl font-normal text-sirion-text">Repository</h3>
            <p className="mt-2 text-base font-light leading-6 text-sirion-soft">Sirion&apos;s flagship: extraction across 1,200+ fields, hierarchies, conformed contracts. A generic repository demo would add little.</p>
          </DarkCard>
          <DarkCard>
            <h3 className="text-xl font-normal text-sirion-text">New-Request Intake</h3>
            <p className="mt-2 text-base font-light leading-6 text-sirion-soft">Fast commoditising: Zip, Coupa, SAP, Ironclad and Workday shipped intake agents recently. Front doors are a solved problem.</p>
          </DarkCard>
        </div>
      </Section>

      <LightCallout>
        <p className="text-xs font-bold uppercase tracking-[1.5px] text-sirion-s3">Competition Check</p>
        <p className="mt-3 text-lg font-light leading-7">
          Sirion tracks amendments and merges formal amendments into conformed contracts, and compares document versions. Coupa enforces rate cards on timesheets. Spendflo checks SOWs before
          signature. We found no buy-side product that reads email threads for informal commercial changes and pushes them into the contract record. Sell-side guides do describe agents that
          watch client email for scope creep, so the idea is not unheard of. Our edge is the buy-side framing and the validity check: does this MSA even allow a change by email?
        </p>
      </LightCallout>
    </CasePage>
  );
}
