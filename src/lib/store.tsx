"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ChangeRecord, Extraction } from "./types";
import { contractById } from "./data/contracts";
import { personById } from "./data/company";
import { evaluate, isLive } from "./rules";

// v2: saved demo state from v1 may reference a persona that no longer exists.
const KEY = "change-capture-v2";

interface State {
  viewerId: string;
  records: ChangeRecord[];
  replies: Record<string, boolean>;
}

const initial: State = { viewerId: "p-priya", records: [], replies: {} };

interface Store extends State {
  ready: boolean;
  setViewer: (id: string) => void;
  createRecord: (args: { threadId: string; contractId: string; extraction: Extraction; source: "live" | "stored"; pastedThread?: ChangeRecord["pastedThread"] }) => string;
  decide: (recordId: string, stepId: string, approve: boolean, note?: string) => void;
  sendReply: (recordId: string) => void;
  recordAcceptance: (recordId: string) => void;
  sendConfirmation: (recordId: string) => void;
  markSigned: (recordId: string) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

const now = () => new Date().toISOString();

export const needsSignature = (r: ChangeRecord) =>
  r.instrument === "amendment" || Boolean(contractById(r.contractId)?.msa.rules.requiresSignedAmendment);

function build(id: string, threadId: string, contractId: string, extraction: Extraction, source: "live" | "stored", createdBy: string): ChangeRecord {
  const contract = contractById(contractId)!;
  const res = evaluate(extraction, contract);
  return {
    id,
    threadId,
    contractId,
    createdAt: now(),
    createdBy,
    extraction,
    extractionSource: source,
    checks: res.checks,
    steps: res.steps,
    stage: res.needsClarification ? "clarifying" : "in_review",
    instrument: res.instrument,
    log: [{ at: now(), who: personById(createdBy)?.name ?? "System", text: "Change record created from email thread." }],
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      if (raw) setState({ ...initial, ...(JSON.parse(raw) as State) });
    } catch {
      /* storage unavailable: start fresh */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const update = useCallback((id: string, fn: (r: ChangeRecord, s: State) => ChangeRecord) => {
    setState((s) => ({ ...s, records: s.records.map((r) => (r.id === id ? fn(r, s) : r)) }));
  }, []);

  const viewerName = (s: State) => personById(s.viewerId)?.name ?? "Someone";

  const store = useMemo<Store>(
    () => ({
      ...state,
      ready,
      setViewer: (viewerId) => setState((s) => ({ ...s, viewerId })),
      createRecord: ({ threadId, contractId, extraction, source, pastedThread }) => {
        const existing = state.records.find((r) => r.threadId === threadId);
        if (existing) return existing.id;
        const id = `CR-${1001 + state.records.length}`;
        setState((s) => ({ ...s, records: [...s.records, { ...build(id, threadId, contractId, extraction, source, s.viewerId), pastedThread }] }));
        return id;
      },
      decide: (recordId, stepId, approve, note) =>
        update(recordId, (r, s) => {
          const steps = r.steps.map((st) =>
            st.id === stepId ? { ...st, status: approve ? ("approved" as const) : ("rejected" as const), decidedAt: now(), note } : st,
          );
          const step = steps.find((st) => st.id === stepId)!;
          const all = steps.every((st) => st.status === "approved");
          let extraction = r.extraction;
          if (all) {
            const owner = personById(contractById(r.contractId)!.businessOwnerId)!;
            extraction = {
              ...r.extraction,
              changes: r.extraction.changes.map((c) => (isLive(c) && c.status === "proposed" ? { ...c, status: "agreed" as const, agreedBy: owner.email } : c)),
            };
          }
          return {
            ...r,
            steps,
            extraction,
            stage: !approve ? "rejected" : all ? "approved" : r.stage,
            log: [
              ...r.log,
              {
                at: now(),
                who: viewerName(s),
                text: `${approve ? "Approved" : "Rejected"}: ${step.role.replace("_", " ")} step.${note ? ` Note: ${note}` : ""}`,
              },
              ...(all ? [{ at: now(), who: "System", text: "All approvals in. Drafts ready to send." }] : []),
            ],
          };
        }),
      sendReply: (recordId) => {
        setState((s) => ({ ...s, replies: { ...s.replies, [recordId]: true } }));
        update(recordId, (r, s) => ({ ...r, log: [...r.log, { at: now(), who: viewerName(s), text: "Clarifying reply approved and sent to supplier." }] }));
      },
      recordAcceptance: (recordId) =>
        update(recordId, (r, s) => {
          const contract = contractById(r.contractId)!;
          const owner = personById(contract.businessOwnerId)!;
          const extraction: Extraction = {
            ...r.extraction,
            changes: r.extraction.changes.map((c) => (c.status === "proposed" ? { ...c, status: "agreed", agreedBy: owner.email, ambiguity: null } : c)),
            openQuestions: [],
          };
          const res = evaluate(extraction, contract);
          const steps = res.steps.map((st) =>
            st.role === "business_owner"
              ? { ...st, status: "approved" as const, decidedAt: now(), reason: "Accepted the open points in the clarifying reply." }
              : st,
          );
          const all = steps.every((st) => st.status === "approved");
          return {
            ...r,
            extraction,
            checks: res.checks,
            steps,
            instrument: res.instrument,
            stage: all ? "approved" : "in_review",
            log: [...r.log, { at: now(), who: viewerName(s), text: "Buyer acceptance recorded; open items now agreed and re-checked." }],
          };
        }),
      sendConfirmation: (recordId) =>
        update(recordId, (r, s) => {
          const emailValid = !needsSignature(r);
          return {
            ...r,
            stage: emailValid ? "executed" : "sent",
            log: [
              ...r.log,
              {
                at: now(),
                who: viewerName(s),
                text: emailValid
                  ? "Change order confirmation sent. Contract record updated."
                  : `${r.instrument === "amendment" ? "Amendment" : "Change order"} and confirmation sent to supplier for signature.`,
              },
            ],
          };
        }),
      markSigned: (recordId) =>
        update(recordId, (r, s) => ({
          ...r,
          stage: "executed",
          log: [...r.log, { at: now(), who: viewerName(s), text: "Amendment signed by both parties. Contract record updated." }],
        })),
      reset: () => setState({ ...initial, viewerId: state.viewerId }),
    }),
    [state, ready, update],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
