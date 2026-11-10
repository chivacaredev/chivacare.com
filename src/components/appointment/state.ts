/**
 * Per-visitor wizard state, kept in sessionStorage (one tab, cleared when the tab closes).
 * The legacy site kept this in a single server file shared by every visitor; we do not.
 * Patient details from step 4 are never stored here — they go straight to the endpoint
 * (only the contact email/phone is kept in `Booked`, for the success page).
 */
export interface WizardState {
  step1?: { is_services: string };
  step2?: { group: string; is_physician: string; physician: string };
  step3?: { is_date: string; is_time: string; is_remark: string };
}

const KEY = 'chivacare:appointment';

export function load(): WizardState {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

export function save(patch: Partial<WizardState>): WizardState {
  const next = { ...load(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode etc.): the wizard still works within one page.
  }
  return next;
}

export function clear() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Booking summary shown on the success page after a successful submit (this tab only). */
export interface Booked {
  rows: [string, string][];
  email: string;
  phone: string;
}

const BOOKED_KEY = 'chivacare:appointment:booked';

export function saveBooked(b: Booked) {
  try {
    sessionStorage.setItem(BOOKED_KEY, JSON.stringify(b));
  } catch {
    /* ignore: the success page then shows only the thank-you text */
  }
}

export function loadBooked(): Booked | null {
  try {
    return JSON.parse(sessionStorage.getItem(BOOKED_KEY) ?? 'null');
  } catch {
    return null;
  }
}

/**
 * Mark/unmark a field group (`[data-field=name]`) as invalid.
 * Its messages are pre-rendered as `[data-msg=kind]` elements; only the matching one is shown.
 */
export function setError(form: HTMLElement, name: string, kind: string | null) {
  const group = form.querySelector<HTMLElement>(`[data-field="${name}"]`);
  if (!group) return;
  group.classList.toggle('has-error', !!kind);
  group.querySelectorAll<HTMLElement>('[data-msg]').forEach((m) => (m.hidden = m.dataset.msg !== kind));
}

/** Path prefix for this language, read from <html lang>. */
export const langPrefix = () => `/${document.documentElement.lang || 'th'}`;
