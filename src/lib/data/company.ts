import type { Person, Supplier } from "../types";

export const COMPANY = {
  name: "Kavora Retail",
  domain: "kavora.in",
  employees: 3000,
  suppliers: 2500,
  hq: "Bengaluru, Karnataka",
};

export const PEOPLE: Person[] = [
  {
    id: "p-priya",
    name: "Priya Menon",
    email: "priya.menon@kavora.in",
    title: "Head of Engineering Delivery",
    role: "business_owner",
    authority: { ratePct: 5, valueINR: 500000 },
  },
  {
    id: "p-vikram",
    name: "Vikram Sethi",
    email: "vikram.sethi@kavora.in",
    title: "Head of Operations",
    role: "business_owner",
    authority: { ratePct: 5, valueINR: 500000 },
  },
  {
    id: "p-neha",
    name: "Neha Kapoor",
    email: "neha.kapoor@kavora.in",
    title: "Marketing Coordinator",
    role: "coordinator",
    authority: { ratePct: 0, valueINR: 0 },
  },
  {
    id: "p-rahul",
    name: "Rahul Iyer",
    email: "rahul.iyer@kavora.in",
    title: "Finance Business Partner",
    role: "finance",
    authority: { ratePct: 15, valueINR: 5000000 },
  },
  {
    id: "p-anika",
    name: "Anika Shah",
    email: "anika.shah@kavora.in",
    title: "Senior Legal Counsel",
    role: "legal",
    authority: { ratePct: 0, valueINR: 0 },
  },
  {
    id: "p-deepa",
    name: "Deepa Nair",
    email: "deepa.nair@kavora.in",
    title: "Accounts Payable Lead",
    role: "ap",
    authority: { ratePct: 0, valueINR: 0 },
  },
];

/** People you can switch the app to "view as". */
export const VIEWERS = ["p-priya", "p-vikram", "p-rahul", "p-anika"];

export const APPROVAL_LIMITS = [
  {
    who: "Business owner (contract owner)",
    rate: "Rate increases up to 5%",
    value: "Value impact up to ₹5,00,000 within PO headroom",
    other: "Scope and date changes inside the SOW term",
  },
  {
    who: "Finance business partner",
    rate: "Rate increases up to 15%",
    value: "Value impact up to ₹50,00,000; any change that exceeds PO headroom",
    other: "Payment-term changes (cash-flow impact)",
  },
  {
    who: "Legal",
    rate: "Any change that breaks an MSA cap or clause",
    value: "—",
    other: "Payment terms, term extensions beyond the MSA, validity of the instrument",
  },
  {
    who: "Coordinators and other staff",
    rate: "No authority",
    value: "No authority",
    other: "Can propose, cannot agree; agreements need ratification",
  },
];

export const SUPPLIERS: Supplier[] = [
  {
    id: "s-tb",
    name: "TalentBridge Staffing Pvt Ltd",
    domain: "talentbridge.in",
    category: "Staffing Agency",
    contact: "Rohan Desai",
  },
  {
    id: "s-ka",
    name: "Kestrel Advisory LLP",
    domain: "kestreladvisory.com",
    category: "Consultancy",
    contact: "Meera Pillai",
  },
  {
    id: "s-ll",
    name: "Lumen & Lark Creative",
    domain: "lumenlark.co",
    category: "Marketing Agency",
    contact: "Sana Qureshi",
  },
];

export const personById = (id: string) => PEOPLE.find((p) => p.id === id);
export const personByEmail = (email: string | null | undefined) =>
  email ? PEOPLE.find((p) => p.email.toLowerCase() === email.toLowerCase().trim()) : undefined;
export const supplierById = (id: string) => SUPPLIERS.find((s) => s.id === id);
export const supplierByDomain = (domain: string) =>
  SUPPLIERS.find((s) => s.domain.toLowerCase() === domain.toLowerCase());
