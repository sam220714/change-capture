import type { ChangeRecord, Contract } from "./types";
import { COMPANY, personById, supplierById } from "./data/company";
import { date } from "./format";
import { instrumentId } from "./terms";
import { isLive } from "./rules";

export function liveChanges(r: ChangeRecord) {
  return r.extraction.changes.filter(isLive);
}

export function amendmentDraft(r: ChangeRecord, contract: Contract) {
  const supplier = supplierById(contract.supplierId)!;
  const owner = personById(contract.businessOwnerId)!;
  const isCO = r.instrument === "change_order";
  const title = isCO ? "Change Order" : "Amendment";
  const rows = liveChanges(r)
    .map((c, i) => {
      const when = c.effectiveDate ? ` with effect from ${date(c.effectiveDate)}` : "";
      const until = c.endDate ? ` until ${date(c.endDate)}` : "";
      return `${i + 1}. ${c.description} ${c.fromValue ? `The ${c.fromValue} in ${contract.sow.id} is replaced by ${c.toValue}` : `Added: ${c.toValue}`}${when}${until}.`;
    })
    .join("\n");
  return `${title.toUpperCase()} ${instrumentId(r)} TO ${contract.sow.id}
under ${contract.msa.title} (${contract.msa.id})

Between ${COMPANY.name} Pvt Ltd ("Customer") and ${supplier.name} ("Supplier").

The parties agree to vary ${contract.sow.id} as follows:

${rows}

All other terms of ${contract.sow.id} and ${contract.msa.id} remain unchanged. This ${title} is made under clause ${contract.msa.rules.amendmentClause} of the MSA and takes effect when signed by authorised representatives of both parties.${!isCO ? `\n\nStamp duty: to be paid under the ${contract.stampState} Stamp Act before execution.` : ""}

For ${COMPANY.name}: ${owner.name}, ${owner.title}
For ${supplier.name}: ${supplier.contact}`;
}

export function confirmationDraft(r: ChangeRecord, contract: Contract) {
  const supplier = supplierById(contract.supplierId)!;
  const owner = personById(contract.businessOwnerId)!;
  const first = supplier.contact.split(" ")[0];
  const lines = liveChanges(r)
    .map((c) => `- ${c.description}${c.effectiveDate ? ` From ${date(c.effectiveDate)}` : ""}${c.endDate ? ` to ${date(c.endDate)}` : ""}.`)
    .join("\n");
  const how =
    r.instrument === "amendment"
      ? `As our MSA requires changes to be signed by both parties, ${instrumentId(r)} is attached for signature. Please invoice on these terms only once it is signed.`
      : `This email is our Change Order ${instrumentId(r)} under clause ${contract.msa.rules.amendmentClause} of the MSA. Please reply to confirm.`;
  return `To: ${supplier.contact}, ${supplier.name}
Subject: Confirmed changes to ${contract.sow.id}

Hi ${first},

Following our emails, we confirm the following changes to ${contract.sow.id}:

${lines}

${how}

Regards,
${owner.name}
${owner.title}, ${COMPANY.name}`;
}

export function declineDraft(r: ChangeRecord, contract: Contract) {
  const supplier = supplierById(contract.supplierId)!;
  const owner = personById(contract.businessOwnerId)!;
  return `To: ${supplier.contact}
Subject: Proposed changes to ${contract.sow.id}

Hi ${supplier.contact.split(" ")[0]},

Thank you for the proposal. After internal review we are not able to accept these changes, so ${contract.sow.id} continues on its current terms. Please invoice accordingly.

Regards,
${owner.name}`;
}
