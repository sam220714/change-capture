import type { Contract, Supplier } from "../types";
import { COMPANY } from "../data/company";

export const SYSTEM_PROMPT = `You read email threads between ${COMPANY.name} (the buyer, domain ${COMPANY.domain}) and one of its suppliers, and work out which commercial changes to a live contract were discussed and where each one landed.

Commercial changes are: rates, headcount or quantity, dates (start, end, milestones), scope, fees, and payment terms. Ignore anything else.

How to call the status of each change:
- agreed: a buyer-side person and the supplier have both accepted the same terms, with no open condition. Record who on the buyer side agreed.
- proposed: offered but not accepted, accepted "in principle", accepted subject to a check, or accepted with a new condition the other side has not confirmed.
- rejected: one side declined it.
- superseded: a later message replaced it with a different version. Point supersededBy at the replacement.
When in doubt between agreed and proposed, choose proposed and explain why in ambiguity. A wrong "agreed" is far more costly than a wrong "proposed".

Do not judge whether the person who agreed had authority, or whether the change breaks the contract. Other checks handle that. Only report what the thread says.

Evidence quotes must be exact substrings of the message they cite. Message indexes are 0-based.
Match each change to a contract term key from the list when one fits; use null when the change adds something new.
Write in plain, short sentences.`;

export function buildUserPrompt(threadText: string, contract: Contract | undefined, supplier: Supplier | undefined) {
  const terms = contract
    ? [...contract.sow.terms].map((t) => `- ${t.key}: ${t.label} = ${t.value}`).join("\n")
    : "(no contract matched)";
  return `Supplier: ${supplier ? `${supplier.name} (${supplier.domain})` : "unknown"}
Contract: ${contract ? `${contract.msa.id} / ${contract.sow.id}, ${contract.sow.title}` : "unknown"}

Current contract terms:
${terms}

Email thread (messages numbered from 0):
${threadText}`;
}
