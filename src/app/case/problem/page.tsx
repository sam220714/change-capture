import { CasePage, DarkCard, Prose, Section, Stat } from "@/components/case";

const WHO = [
  { who: "Business Owners", pain: "Agree changes under delivery pressure (\"we can't lose the team\"). The paperwork never follows, and they carry the risk if it goes wrong." },
  { who: "Finance and AP", pain: "Pay invoices that don't match the contract and can't tell an agreed rise from an overcharge. Budgets and POs drift from reality." },
  { who: "Legal", pain: "Accountable for contracts that are being changed outside the process, sometimes against the MSA, by people without authority." },
  { who: "Procurement", pain: "Loses visibility of the true rate card and spend under management, which weakens the next negotiation and renewal." },
  { who: "Suppliers", pain: "Bill what they believe was agreed, then face disputes and late payment when the invoice is rejected weeks later." },
];

const EVIDENCE = [
  { claim: "Unauthorised or unrecorded changes cost about 2–3% of procurement contract value.", source: "WorldCC with Ironclad, 2026" },
  { claim: "\"Negotiated terms live in PDFs, billing rules in emails, rate cards in spreadsheets\", so AP checks invoice against invoice, not against the contract.", source: "PRGX, 2026" },
  { claim: "Contract data is often captured once, then updated manually, periodically, or only at amendment or renewal. 54% have no automated data flow.", source: "WorldCC with Sirion, 2026" },
  { claim: "AI extraction is weakest on amendments and order forms, where pricing and quantity changes live.", source: "Redress Compliance" },
  { claim: "Staffing audits recovered ~$5M from miscalculated markups and ~$1.5M from PTO billed twice.", source: "apexanalytix, c.2020" },
  { claim: "3.6% of supplier invoices contain errors; 73% say AP struggles to match POs and invoices.", source: "IOFM via SC&H; Zip 2023" },
  { claim: "Scope changes are the top cause of contracting delays, cited by 45%.", source: "ContractPodAi / ACC, 2023" },
];

const THEN_NOW = [
  { then: "A changed term arrived as an email, a marked-up annexure, or not at all.", now: "The business owner pastes the thread. AI turns it into a structured change and quotes the lines that prove it." },
  { then: "I asked Operations, Legal and the MSA what was allowed, and who had to approve it.", now: "Rules check the change against the MSA and the approval limits, and route it to the one person who must approve. AI never approves." },
  { then: "The rule we learned was never written down, so the same invoice could go out wrong next month.", now: "The approved change updates the contract record, linked to the email it came from." },
];

export default function ProblemPage() {
  return (
    <CasePage
      eyebrow="The Problem"
      title="The Contract Says One Thing, the Inbox Says Another"
      lead="Commercial terms on live supplier contracts change in email. The contract record doesn't. Every invoice is then checked against terms that are no longer true."
      next={{ href: "/case/metrics", label: "Success Metrics" }}
    >
      <Section eyebrow="Where This Comes From" title="I Was the Person Running Between Legal and Operations">
        <Prose>
          <p>
            At Refyne, where I worked on B2B invoicing, clients often disputed invoices, and the cause was usually the same: <strong>a term had changed, and the invoice hadn&apos;t</strong>. Objections
            came as an email, a marked-up annexure, or silence from an AP portal that rejected the invoice without saying why. Some terms were for Operations to decide, some needed Legal.
            Each time, I had to work out from both teams and from the MSA with the employer what had changed, and whether the person who agreed it was allowed to.
          </p>
          <p>
            So every dispute was really two problems. <strong>First, working out what had changed:</strong> which term was new, which was old, and whether it was allowed.{" "}
            <strong>Second, producing a correct invoice</strong> under the rules that now applied.
          </p>
          <p>
            We solved the second: once a rule was clear, invoices were generated faster and with fewer manual errors. The first stayed manual, in a weekly session with Operations and
            client support, because they held the context.
          </p>
          <p>
            <strong>Change Capture solves the first problem, from the other side of the table.</strong> Here it is the buyer&apos;s contract record that goes stale, and the supplier whose
            invoice gets held.
          </p>
        </Prose>
        <div className="hairline mt-8 overflow-x-auto rounded-lg border-sirion-line/50">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-sirion-line/40 text-left text-xs text-sirion-soft">
                <th className="w-1/2 px-5 py-3 font-normal">At Refyne</th>
                <th className="w-1/2 px-5 py-3 font-normal">In Change Capture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sirion-line/30">
              {THEN_NOW.map((r) => (
                <tr key={r.then}>
                  <td className="px-5 py-4 font-light text-sirion-soft">{r.then}</td>
                  <td className="px-5 py-4 text-sirion-text">{r.now}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Who It Affects" title="Five Groups, One Gap">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {WHO.map((w) => (
            <DarkCard key={w.who}>
              <h3 className="text-2xl font-normal text-sirion-text">{w.who}</h3>
              <p className="mt-3 text-base font-light leading-6 text-sirion-soft">{w.pain}</p>
            </DarkCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Why It Matters" title="Sized for This Company">
        <div className="grid gap-4 lg:grid-cols-3">
          <Stat value="2,500" label="Suppliers, Many on Rate Cards and SOWs" source="From the brief" />
          <Stat value="₹10–15 Cr" label="A Year at Risk From Unrecorded Changes" source="Illustrative: assumes ₹500 Cr addressable supplier spend × WorldCC's 2–3%" />
          <Stat value="Weeks" label="Before a Mismatch Surfaces, at Invoice Time" source="Changes are found when AP rejects a bill, if at all" />
        </div>
        <Prose>
          <p className="mt-6">
            Staffing agencies, consultants and marketing agencies change terms most often: rates move, people are added, timelines slip, scope grows. These are also the categories where
            the brief&apos;s symptom, <strong>invoices that don&apos;t match agreed prices</strong>, shows up first.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="How We Know It Is Real" title="What Published Research Says">
        <div className="hairline overflow-x-auto rounded-lg border-sirion-line/50">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-sirion-line/40 text-left text-xs text-sirion-soft">
                <th className="px-5 py-3 font-normal">Finding</th>
                <th className="px-5 py-3 font-normal">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sirion-line/30">
              {EVIDENCE.map((e) => (
                <tr key={e.claim}>
                  <td className="px-5 py-3 text-sirion-text">{e.claim}</td>
                  <td className="px-5 py-3 text-sirion-soft">{e.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

    </CasePage>
  );
}
