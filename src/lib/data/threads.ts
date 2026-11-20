import type { Invoice, Thread } from "../types";

const PRIYA = "Priya Menon <priya.menon@kavora.in>";
const VIKRAM = "Vikram Sethi <vikram.sethi@kavora.in>";
const NEHA = "Neha Kapoor <neha.kapoor@kavora.in>";
const ROHAN = "Rohan Desai <rohan.desai@talentbridge.in>";
const MEERA = "Meera Pillai <meera.pillai@kestreladvisory.com>";
const SANA = "Sana Qureshi <sana@lumenlark.co>";

export const THREADS: Thread[] = [
  {
    id: "t-tb-qa",
    supplierId: "s-tb",
    subject: "QA rate revision, SOW-TB-03",
    label: "Clean agreed rate change",
    messages: [
      {
        from: ROHAN,
        to: PRIYA,
        date: "2026-09-22T10:14:00+05:30",
        body: "Hi Priya,\n\nFollowing our annual review, we'd like to revise the QA Engineer rate under SOW-TB-03 from ₹1,200/hr to ₹1,236/hr (3%), effective 1 October 2026, in line with clause 4.2 of the MSA. Both QA engineers stay on the engagement and Senior Developer rates are unchanged.\n\nCould you confirm?\n\nRegards,\nRohan",
      },
      {
        from: PRIYA,
        to: ROHAN,
        date: "2026-09-23T09:02:00+05:30",
        body: "Hi Rohan,\n\nThanks. 3% on the QA rate from 1 October is fine with us, agreed. Please reflect it from the October invoice.\n\nPriya",
      },
      {
        from: ROHAN,
        to: PRIYA,
        date: "2026-09-24T11:40:00+05:30",
        body: "Thanks Priya, noted. We'll bill QA at ₹1,236/hr from October.\n\nRohan",
      },
    ],
  },
  {
    id: "t-ka-ext",
    supplierId: "s-ka",
    subject: "Diagnostic timeline and team",
    label: "Ambiguous: proposal, counter, condition",
    messages: [
      {
        from: MEERA,
        to: VIKRAM,
        date: "2026-11-02T16:20:00+05:30",
        body: "Hi Vikram,\n\nThe warehouse data from the western region has taken longer to clean than planned. To deliver the full network model we propose extending the engagement by 4 weeks to 28 February 2027 and adding one analyst for 8 weeks at the SOW rate of ₹1,20,000 per week (₹9,60,000 total).\n\nHappy to discuss.\n\nMeera",
      },
      {
        from: VIKRAM,
        to: MEERA,
        date: "2026-11-04T10:05:00+05:30",
        body: "Hi Meera,\n\nIn principle the extension makes sense. The analyst is a budget question, let me check with finance before we commit.\n\nVikram",
      },
      {
        from: MEERA,
        to: VIKRAM,
        date: "2026-11-05T09:30:00+05:30",
        body: "Thanks Vikram. To keep momentum we'll plan for the analyst to start on Monday 10 November unless you tell us otherwise.\n\nMeera",
      },
      {
        from: VIKRAM,
        to: MEERA,
        date: "2026-11-07T18:45:00+05:30",
        body: "Meera,\n\nPlease hold the analyst, we haven't approved that. What we can do is a 2-week extension to 14 February 2027 at no additional cost.\n\nVikram",
      },
      {
        from: MEERA,
        to: VIKRAM,
        date: "2026-11-09T12:10:00+05:30",
        body: "Understood. A 2-week extension at no additional cost works for us, provided Milestone 3 (final report) moves to 14 February 2027 and its payment date moves with it.\n\nMeera",
      },
    ],
  },
  {
    id: "t-ll-festive",
    supplierId: "s-ll",
    subject: "Festive campaign: scope and retainer",
    label: "Agreed without authority",
    messages: [
      {
        from: SANA,
        to: NEHA,
        date: "2026-09-03T15:00:00+05:30",
        body: "Hi Neha,\n\nAs discussed on the call, for the festive season we'll add a video campaign (one 30-second hero film and six cut-downs) for October to December. To resource this we'd revise the monthly retainer from ₹6,00,000 to ₹7,50,000 for those three months.\n\nCan you confirm so we can book the production crew?\n\nSana",
      },
      {
        from: NEHA,
        to: SANA,
        date: "2026-09-03T17:25:00+05:30",
        body: "Hi Sana,\n\nYes please go ahead, approved from our side. The team is excited about the film.\n\nNeha",
      },
      {
        from: SANA,
        to: NEHA,
        date: "2026-09-04T10:00:00+05:30",
        body: "Wonderful, crew booked. The October invoice will reflect the revised retainer.\n\nSana",
      },
    ],
  },
  {
    id: "t-tb-senior",
    supplierId: "s-tb",
    subject: "Senior developer rates and payment terms",
    label: "Breaks the MSA",
    messages: [
      {
        from: ROHAN,
        to: PRIYA,
        date: "2026-10-06T12:00:00+05:30",
        body: "Hi Priya,\n\nThe market for senior Java talent has moved sharply. To retain the six senior developers on your team, we need to move the Senior Java Developer rate from ₹1,850/hr to ₹2,070/hr from 1 October. We'd also ask to move payment to Net 15 to manage our payroll cash flow.\n\nWithout this we expect two of the team to leave by November.\n\nRohan",
      },
      {
        from: PRIYA,
        to: ROHAN,
        date: "2026-10-07T08:50:00+05:30",
        body: "Rohan,\n\nLosing two seniors mid-release isn't an option for us. OK, go ahead with ₹2,070 from October.\n\nOn Net 15, I'm fine with it, but I'll need to loop in finance at some point.\n\nPriya",
      },
      {
        from: ROHAN,
        to: PRIYA,
        date: "2026-10-08T09:15:00+05:30",
        body: "Thank you Priya. We'll invoice the October hours at ₹2,070/hr with Net 15 terms. Appreciate the quick decision.\n\nRohan",
      },
    ],
  },
];

export const INVOICES: Invoice[] = [
  {
    id: "INV-TB-2610",
    contractId: "c-tb",
    period: "October 2026",
    issued: "2026-11-02",
    paymentTerms: "Net 15",
    lines: [
      { termKey: "rate.senior_dev", description: "Senior Java Developer (6 × 168 hrs)", qty: 1008, unit: "hr", rate: 2070 },
      { termKey: "rate.qa", description: "QA Engineer (2 × 168 hrs)", qty: 336, unit: "hr", rate: 1236 },
    ],
  },
  {
    id: "INV-LL-2610",
    contractId: "c-ll",
    period: "October 2026",
    issued: "2026-10-31",
    paymentTerms: "Net 30",
    lines: [{ termKey: "fee.retainer", description: "Monthly retainer incl. festive video campaign", qty: 1, unit: "month", rate: 750000 }],
  },
  {
    id: "INV-KA-0112",
    contractId: "c-ka",
    period: "10 to 14 Nov 2026",
    issued: "2026-11-17",
    paymentTerms: "Net 30",
    lines: [{ termKey: "rate.analyst_week", description: "Additional analyst (1 week)", qty: 1, unit: "week", rate: 120000 }],
  },
];

export const threadById = (id: string) => THREADS.find((t) => t.id === id);
