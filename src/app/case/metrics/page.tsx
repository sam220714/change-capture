import { CasePage, DarkCard, LightCallout, Section } from "@/components/case";

const SUPPORTING = [
  { metric: "Invoice value held or corrected before payment", why: "The payoff the brief names: invoices that match agreed prices.", target: "Tracked in ₹ per month" },
  { metric: "Precision of \"agreed\" calls", why: "A false \"agreed\" updates the contract wrongly. This is the riskiest AI judgement.", target: "≥ 95% on a labelled sample" },
  { metric: "Median time from email agreement to approved record", why: "Shows the routing actually removes stalls.", target: "< 3 business days" },
  { metric: "Routing overrides", why: "Routing is rules, so it can only be wrong if the limits table is off or a change was misread. Each override says which. Too many and Finance and Legal stop trusting the queue, which brings the stalls back.", target: "< 10% of records" },
  { metric: "Capture rate", why: "Every other metric is measured on captured changes. If owners don't paste the threads where changes were agreed, none of the value arrives, so this is the adoption test. It also caps the north star: an uncaptured change can't reach the record.", target: "≥ 95% of agreed changes found in the audit" },
];

const RETHINK = [
  { signal: "Most changes turn out to be agreed on calls or Teams, not email.", then: "Capture is in the wrong channel. Add meeting notes and chat, or a one-line \"log a change\" prompt." },
  { signal: "Precision on \"agreed\" stays below 90% after prompt iteration.", then: "Stop auto-recording. Switch to a triage queue where a person confirms every status." },
  { signal: "Business owners don't paste threads in.", then: "Capture depends on a habit they won't form. Add a lighter path (forward an email, a prompt when an invoice disagrees) or make it policy." },
  { signal: "The pilot audit finds little invoice variance from email changes.", then: "The leakage case is weak. Reposition around compliance and authority instead of money." },
  { signal: "Approvers approve in seconds without opening the record.", then: "Routing is too noisy. Raise limits so only real exceptions reach Finance and Legal." },
];

export default function MetricsPage() {
  return (
    <CasePage
      eyebrow="Success Metrics"
      title="Measured by Whether the Contract Is Current"
      next={{ href: "/case/assumptions", label: "Assumptions" }}
      lead="Activity metrics (threads read, records created) would look good even if the contract stayed wrong. The north star measures the outcome: the agreed change is in the contract record, fast."
    >
      <section className="rounded-lg bg-sirion-s2 p-8 shadow-glow">
        <p className="text-xs font-bold uppercase tracking-[1.5px] text-sirion-line">North-Star Metric</p>
        <p className="mt-3 text-[32px] font-light leading-10 text-sirion-text">
          Share of commercial changes agreed with suppliers that are in the contract record within 5 business days of agreement.
        </p>
        <p className="mt-4 max-w-3xl text-base font-light leading-6 text-sirion-soft">
          Pilot target: from an audited baseline to 90% for pilot suppliers within 8 weeks. Measured by a monthly audit: Procurement samples threads with pilot suppliers, pulled by the business owners themselves under a pilot privacy
          notice, and checks each agreed change against the contract record. The product never reads a mailbox; the audit is a manual, consented step. It rises only if changes are captured, routed, approved and recorded, so it can&apos;t be gamed by one step alone.
        </p>
      </section>

      <Section eyebrow="How We Will Know It Works" title="Supporting Metrics">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SUPPORTING.map((s) => (
            // Target pinned to the bottom so it lines up across a row; the odd fifth card spans the row instead of leaving a hole.
            <DarkCard key={s.metric} className="flex flex-col md:last:col-span-2">
              <h3 className="text-xl font-normal leading-7 text-sirion-text">{s.metric}</h3>
              <p className="mt-2 text-base font-light leading-6 text-sirion-soft">{s.why}</p>
              <p className="mt-auto pt-4 text-lg font-bold text-sirion-text">{s.target}</p>
            </DarkCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Pilot" title="How It Would Be Tested">
        <div className="grid gap-4 lg:grid-cols-3">
          <DarkCard>
            <p className="text-lg font-bold text-sirion-text">20 Suppliers, 8 Weeks</p>
            <p className="mt-2 text-base font-light leading-6 text-sirion-soft">Staffing, consulting and marketing agencies with the most rate cards and SOW changes.</p>
          </DarkCard>
          <DarkCard>
            <p className="text-lg font-bold text-sirion-text">Audited Baseline</p>
            <p className="mt-2 text-base font-light leading-6 text-sirion-soft">Six months of past threads with pilot suppliers, exported by business owners under the pilot privacy notice, compared with the contract record to measure how many agreed changes never made it.</p>
          </DarkCard>
          <DarkCard>
            <p className="text-lg font-bold text-sirion-text">Labelled Eval Set</p>
            <p className="mt-2 text-base font-light leading-6 text-sirion-soft">Legal and Finance label 200 threads (agreed, proposed, rejected, superseded) to score the extraction before and during the pilot.</p>
          </DarkCard>
        </div>
      </Section>

      <Section eyebrow="What Would Make Us Rethink" title="Signals That the Approach Is Wrong">
        <div className="hairline overflow-x-auto rounded-lg border-sirion-line/50">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-sirion-line/40 text-left text-xs text-sirion-soft">
                <th className="px-5 py-3 font-normal">If We See</th>
                <th className="px-5 py-3 font-normal">Then</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sirion-line/30">
              {RETHINK.map((r) => (
                <tr key={r.signal}>
                  <td className="px-5 py-4 text-sirion-text">{r.signal}</td>
                  <td className="px-5 py-4 font-light text-sirion-soft">{r.then}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <LightCallout>
        <p className="text-xs font-bold uppercase tracking-[1.5px] text-sirion-s3">Guardrail</p>
        <p className="mt-3 text-lg font-light leading-7">
          No change reaches the contract or the supplier without a named person approving it. If the false-&ldquo;agreed&rdquo; rate rises, the north star is paused until it is fixed, even if
          coverage looks good.
        </p>
      </LightCallout>
    </CasePage>
  );
}
