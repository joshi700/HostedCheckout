// Small persistence helpers for the TechGear demo kit.
//
// Redirect-based flows (Hosted Checkout Payment Page, 3DS) leave the site and come
// back, so the cart, the checkout snapshot and the API-call log are kept in
// sessionStorage. Storage can be unavailable (private mode, blocked site data), so
// every access is wrapped and the app still works without it.

export function load(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

// Wrap a fetch-style call so it is recorded for the Developer view.
// `record(call)` receives the call object twice: when sent and when finished.
let seq = 0;
export async function tracked(record, { method, url, label, request }, fn) {
  const call = { id: `${Date.now()}-${++seq}`, method, url, label, request, status: null };
  const started = performance.now();
  record(call);
  try {
    const { status, body } = await fn();
    record({ ...call, status, response: body, ms: Math.round(performance.now() - started) });
    return body;
  } catch (e) {
    record({ ...call, status: e.status || 0, response: { error: e.message }, ms: Math.round(performance.now() - started) });
    throw e;
  }
}

// Merge a recorded call into a calls array (replaces the pending entry by id).
export function upsertCall(calls, call) {
  const i = calls.findIndex((c) => c.id === call.id);
  if (i === -1) return [...calls, call];
  const next = calls.slice();
  next[i] = call;
  return next;
}
