'use client';

/**
 * Generates/reads a random, non-identifying session id stored in
 * localStorage, used only to stop the same browser from rating/liking/
 * reviewing the same item twice (see unique constraints in schema.sql).
 * This is NOT an identity system — clearing storage resets it, and that's
 * an accepted tradeoff for "obvious abuse" prevention per the product spec.
 * Phase 2 can swap this for `user_id` once real accounts exist.
 */
const STORAGE_KEY = 'mubeen_hub_session_id';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
