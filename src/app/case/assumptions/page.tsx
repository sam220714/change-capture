import { CasePage, DarkCard, Section } from "@/components/case";

const GROUPS = [
  {
    title: "The Company",
    items: [
      "Kavora Retail (fictional): 3,000 employees, 2,500 suppliers, head office in Bengaluru.",
      "First version covers staffing agencies, consultants and marketing agencies. Logistics and SaaS come later.",
      "Business owners own supplier relationships and agree day-to-day changes over email.",
      "An approval-limits table exists or can be agreed: business owners up to 5% and ₹5 lakh; Finance up to 15% and ₹50 lakh; Legal for MSA deviations.",
    ],
  },
  {
    title: "Systems",
    items: [
      "Mail on Microsoft 365 or Google Workspace. Real version connects via a BCC address or a shared supplier inbox.",
      "MSAs and SOWs already sit in a structured repository with key terms extracted (assumed built).",
      "POs and invoices live in an ERP or Excel; the prototype uses three October invoices.",
      "E-signature exists; the prototype simulates sending and signing.",
    ],
  },
  {
    title: "Data",
    items: [
      "MSA and SOW clauses are synthetic, modelled on standard clauses from Law Insider samples.",
      "Four synthetic threads cover the planned cases: clean, ambiguous, no authority, breaks the MSA.",
      "Thread-to-contract matching uses the supplier's email domain and the latest live SOW.",
    ],
  },
  {
    title: "AI",
    items: [
      "Google Gemini (free tier, Flash models) reads the thread and returns a typed record with quotes as evidence. Every quote is checked word for word against the email.",
      "If the free tier is busy, demo threads fall back to stored extractions in the same format; Gemini's free tier may use prompts to improve Google products, which is acceptable only because the data here is synthetic.",
      "Without an API key, demo threads use stored extractions in the same schema, labelled in the UI. A production version would use a paid tier with no training on customer data.",
      "AI never decides routing, authority or validity; those are rules over the contract and limits table.",
      "The AI drafts; a person approves before anything leaves the company.",
    ],
  },
  {
    title: "Privacy and India",
    items: [
      "Opt-in per supplier inbox or thread. Personal mailboxes are never scanned. DPDP applies to personal data in threads.",
      "Amendments that change consideration may need stamp duty under the state Stamp Act; unstamped instruments are inadmissible until duty is paid.",
      "Rate changes change GST on invoices; AP is told to expect it.",
    ],
  },
  {
    title: "Not in This Version",
    items: [
      "Live mail integration, sign-in and roles, a database (state is kept in the browser), ERP connection.",
      "Non-commercial changes (liability, IP, data protection terms).",
      "Supplier-facing portal.",
    ],
  },
];

export default function AssumptionsPage() {
  return (
    <CasePage eyebrow="Assumptions" title="What We Assumed About the Company, Its Systems and Data" lead="Stated so each can be checked and changed.">
      <Section title="Assumptions and Scope">
        <div className="grid gap-4 md:grid-cols-2">
          {GROUPS.map((g) => (
            <DarkCard key={g.title}>
              <h3 className="text-2xl font-normal text-sirion-text">{g.title}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-base font-light leading-6 text-sirion-soft marker:text-sirion-line">
                {g.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </DarkCard>
          ))}
        </div>
      </Section>
    </CasePage>
  );
}
