import { ArrowRight } from "lucide-react";
import { CasePage, DarkCard, LightCallout, Section, Tag } from "@/components/case";
import { APPROVAL_LIMITS } from "@/lib/data/company";

const PEOPLE = [
  {
    who: "Business Owner",
    tag: "Primary user",
    wants: "Keep the work moving and the supplier happy. Agree quickly, in the channel they already use.",
    gets: "Keeps agreeing in email. The record, routing and drafts are done for them; they confirm in one click.",
  },
  {
    who: "Finance Business Partner",
    tag: "Approver",
    wants: "No spend outside budget or PO. Predictable cash flow. Invoices that match.",
    gets: "Sees only changes above limits or PO headroom, with the number and the reason.",
  },
  {
    who: "Legal",
    tag: "Approver",
    wants: "Changes made through valid instruments, inside MSA caps and terms, by people with authority.",
    gets: "Sees only MSA breaches and payment-term changes; amendments arrive pre-drafted with the clause cited.",
  },
  {
    who: "Accounts Payable",
    tag: "Downstream",
    wants: "A trustworthy rate to check each invoice line against, and a reason when something is off.",
    gets: "Invoice lines checked against current agreed terms, with holds that point to the pending record.",
  },
  {
    who: "Procurement",
    tag: "Owner of the process",
    wants: "Spend under management, true rate cards, leverage at renewal.",
    gets: "A complete change history per supplier, ready for the next negotiation.",
  },
  {
    who: "Supplier",
    tag: "External",
    wants: "Get paid quickly for what they believe was agreed.",
    gets: "A clear confirmation of what was agreed and when it takes effect, before they invoice.",
  },
  {
    who: "Employees and DPO",
    tag: "Privacy",
    wants: "No surveillance of personal mail. DPDP compliance for personal data in threads.",
    gets: "Only the thread the business owner pastes is read. No mailbox access.",
  },
];

const CONFLICTS = [
  {
    a: "Business",
    b: "Finance",
    tension: "Speed and keeping the team vs staying inside budget and the PO.",
    resolve: "Business owner approves alone inside limits. Finance sees only what crosses them, with the cost already worked out.",
  },
  {
    a: "Business",
    b: "Legal",
    tension: "\"We agreed it in email, that's enough\" vs \"only a signed amendment changes this contract.\"",
    resolve: "The MSA decides, per contract. Where email is valid, a change order is enough; where it isn't, the amendment is pre-drafted.",
  },
  {
    a: "Supplier",
    b: "Finance",
    tension: "Supplier wants Net 15 for payroll; Finance wants Net 45 for cash flow.",
    resolve: "Payment-term changes always reach Finance and Legal, and the supplier gets a holding reply while they decide.",
  },
  {
    a: "Coordinator",
    b: "Business Owner",
    tension: "Junior staff say yes to keep things friendly, without authority.",
    resolve: "Authority is checked against the limits table; the owner must ratify or reject.",
  },
  {
    a: "Visibility",
    b: "Privacy",
    tension: "More threads captured means more changes caught, and more personal data processed.",
    resolve: "Only what a person pastes, never a mailbox. Coverage gaps are accepted as the price of trust.",
  },
];

const FLOW = ["Business owner captures and confirms", "Finance and Legal approve what crosses their limits", "Supplier gets confirmation or amendment", "Contract terms update with source", "AP checks the invoice"];

export default function StakeholdersPage() {
  return (
    <CasePage
      eyebrow="Stakeholder Map"
      title="Who Has a Stake in a Change Agreed Over Email"
      lead="We build for three internal stakeholders: the Business owner who agrees the change, Finance, and Legal. Accounts Payable, Procurement, the supplier and employees are affected and shape the design."
      next={{ href: "/case/problem", label: "The Problem" }}
    >
      <Section eyebrow="The Map" title="What Each One Wants">
        <div className="grid gap-4 lg:grid-cols-2">
          {PEOPLE.map((p) => (
            // Subgrid: header, "Wants" and "In Change Capture" each share a row track with the neighbouring card.
            <DarkCard key={p.who} className="lg:row-span-3 lg:grid lg:grid-rows-subgrid lg:gap-y-0">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-normal text-sirion-text">{p.who}</h3>
                <Tag>{p.tag}</Tag>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-[1.5px] text-sirion-line">Wants</p>
                <p className="mt-1 text-base font-light leading-6 text-sirion-soft">{p.wants}</p>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-[1.5px] text-sirion-line">In Change Capture</p>
                <p className="mt-1 text-base font-light leading-6 text-sirion-soft">{p.gets}</p>
              </div>
            </DarkCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Where Interests Conflict" title="Five Tensions and How the Product Handles Them">
        <div className="hairline overflow-x-auto rounded-lg border-sirion-line/50">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-sirion-line/40 text-left text-xs text-sirion-soft">
                <th className="px-5 py-3 font-normal">Between</th>
                <th className="px-3 py-3 font-normal">Tension</th>
                <th className="px-5 py-3 font-normal">How It Is Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sirion-line/30">
              {CONFLICTS.map((c) => (
                <tr key={c.a + c.b}>
                  <td className="whitespace-nowrap px-5 py-4 text-sirion-text">
                    {c.a} <span className="text-sirion-line">vs</span> {c.b}
                  </td>
                  <td className="px-3 py-4 font-light text-sirion-soft">{c.tension}</td>
                  <td className="px-5 py-4 font-light text-sirion-text">{c.resolve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="How the Experiences Connect" title="One Record, Passed Between Teams">
        <ol className="flex flex-col gap-3 xl:flex-row xl:items-stretch">
          {FLOW.map((f, i) => (
            <li key={f} className="flex items-center gap-3 xl:flex-1">
              <DarkCard className="h-full w-full p-4">
                <p className="text-xs font-bold uppercase tracking-[1.5px] text-sirion-line">{i + 1}</p>
                <p className="mt-1 text-base font-light leading-6 text-sirion-text">{f}</p>
              </DarkCard>
              {i < FLOW.length - 1 && <ArrowRight size={16} strokeWidth={1.5} className="hidden shrink-0 text-sirion-line xl:block" />}
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-3xl text-base font-light text-sirion-soft">In the prototype, use &ldquo;Viewing as&rdquo; at the top to switch between Priya or Vikram (business), Rahul (Finance) and Anika (Legal).</p>
      </Section>

      <LightCallout>
        <p className="text-xs font-bold uppercase tracking-[1.5px] text-sirion-s3">Approval Limits Used in the Prototype</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-sirion-ink/15 text-left text-xs text-sirion-muted2">
                <th className="py-2 pr-3 font-normal">Who</th>
                <th className="py-2 pr-3 font-normal">Rates</th>
                <th className="py-2 pr-3 font-normal">Value</th>
                <th className="py-2 font-normal">Other</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sirion-ink/10">
              {APPROVAL_LIMITS.map((l) => (
                <tr key={l.who} className="h-11">
                  <td className="py-2 pr-3">{l.who}</td>
                  <td className="py-2 pr-3 text-sirion-muted2">{l.rate}</td>
                  <td className="py-2 pr-3 text-sirion-muted2">{l.value}</td>
                  <td className="py-2 text-sirion-muted2">{l.other}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LightCallout>
    </CasePage>
  );
}
