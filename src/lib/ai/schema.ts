import { z } from "zod/v4";

export const ChangeSchema = z.object({
  id: z.string().describe("Short id, c1, c2, ..."),
  type: z.enum(["rate", "headcount", "dates", "scope", "payment_terms", "fee"]),
  termKey: z
    .string()
    .nullable()
    .describe("Key of the contract term this change modifies, from the provided term list. null if it adds something new or no term matches."),
  description: z.string().describe("One plain sentence: what changes."),
  fromValue: z.string().nullable().describe("Current value as written in the contract, e.g. '₹1,200 / hr'."),
  toValue: z.string().describe("New value as discussed in the thread."),
  fromNumeric: z.number().nullable().describe("Numeric current value in INR or days or count; null if not numeric."),
  toNumeric: z.number().nullable().describe("Numeric new value; null if not numeric."),
  effectiveDate: z.string().nullable().describe("ISO date the change takes effect, if stated."),
  endDate: z.string().nullable().describe("ISO date a temporary change stops applying; null if permanent."),
  status: z
    .enum(["proposed", "agreed", "rejected", "superseded"])
    .describe(
      "agreed = both sides clearly accepted the same terms with no open condition; proposed = offered or conditionally accepted; rejected = declined; superseded = replaced by a later change in this thread.",
    ),
  proposedBy: z.string().nullable().describe("Email address of the person who proposed it."),
  agreedBy: z.string().nullable().describe("Email of the BUYER-side person who agreed, only if status is agreed."),
  supersededBy: z.string().nullable().describe("id of the change that replaced this one."),
  evidence: z
    .array(z.object({ messageIndex: z.number().describe("0-based message index"), quote: z.string().describe("Exact substring of that message") }))
    .describe("Verbatim quotes that support the status."),
  confidence: z.number().describe("0 to 1: confidence in the status call."),
  ambiguity: z.string().nullable().describe("What is unclear, if anything."),
});

export const ExtractionSchema = z.object({
  summary: z.string().describe("Two sentences max: what the thread is about and where it landed."),
  changes: z.array(ChangeSchema),
  openQuestions: z.array(z.string()).describe("Questions a human must resolve before this can be recorded."),
  riskFlags: z.array(z.string()).describe("Things like work starting before approval, or a supplier billing on terms not yet agreed."),
  suggestedReply: z
    .string()
    .nullable()
    .describe("If anything is ambiguous, a short, polite clarifying email to the supplier from the buyer. Otherwise null."),
});

export type ExtractionOutput = z.infer<typeof ExtractionSchema>;
