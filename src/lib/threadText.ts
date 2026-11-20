import type { EmailMessage } from "./types";

export function threadToText(messages: EmailMessage[]) {
  return messages
    .map((m, i) => `[${i}] From: ${m.from}\nTo: ${m.to}\nDate: ${m.date}\n\n${m.body}`)
    .join("\n\n---\n\n");
}

export function emailOf(address: string) {
  const m = address.match(/<([^>]+)>/);
  return (m ? m[1] : address).trim().toLowerCase();
}

export function nameOf(address: string) {
  const m = address.match(/^([^<]+)</);
  return (m ? m[1] : address).trim();
}

/** Best-effort parse of a pasted thread. Splits on "From:" lines. */
export function parsePastedThread(text: string): EmailMessage[] {
  const chunks = text
    .split(/\n(?=From:)/i)
    .map((c) => c.trim())
    .filter(Boolean);
  if (chunks.length === 0) return [];
  return chunks.map((chunk) => {
    const lines = chunk.split("\n");
    let from = "";
    let to = "";
    let date = "";
    let i = 0;
    for (; i < lines.length; i++) {
      const l = lines[i];
      const fm = l.match(/^From:\s*(.*)$/i);
      const tm = l.match(/^To:\s*(.*)$/i);
      const dm = l.match(/^(Date|Sent):\s*(.*)$/i);
      if (fm) from = fm[1];
      else if (tm) to = tm[1];
      else if (dm) date = dm[2];
      else if (/^(Cc|Subject):/i.test(l)) continue;
      else break;
    }
    return { from: from || "Unknown", to, date, body: lines.slice(i).join("\n").trim() };
  });
}

export function domainsIn(text: string) {
  const out = new Set<string>();
  for (const m of text.matchAll(/[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/gi)) out.add(m[1].toLowerCase());
  return [...out];
}

export const PASTED_KEY = "change-capture-pasted";
