import type { FlywheelDraft } from "@/types";

// drafts are pure frontend configuration state, keyed by the connected
// public key so a refresh preserves them. they are never transactions.
const KEY_PREFIX = "pof-draft-";

export function draftKey(owner: string): string {
  return `${KEY_PREFIX}${owner}`;
}

export function loadDraft(owner: string): FlywheelDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(owner));
    if (!raw) return null;
    const draft = JSON.parse(raw) as FlywheelDraft;
    return draft?.status === "draft" ? draft : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: FlywheelDraft): void {
  try {
    localStorage.setItem(draftKey(draft.owner), JSON.stringify(draft));
  } catch {
    // storage unavailable — the preview page will show the empty state
  }
}

export function clearDraft(owner: string): void {
  try {
    localStorage.removeItem(draftKey(owner));
  } catch {
    // ignore
  }
}
