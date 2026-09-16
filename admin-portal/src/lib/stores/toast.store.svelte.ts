/**
 * Reactive toast-notification store for the Admin_Portal.
 *
 * Toasts provide non-blocking feedback for create/update/delete outcomes
 * (Requirements 4.7, 17.5, 17.6). Success and error toasts are surfaced via
 * `success(message)` and `error(message)`; each toast is assigned a unique id,
 * carries a `type`, and auto-dismisses after 4 seconds. `dismiss(id)` removes a
 * toast early (e.g. when the user clicks the close button).
 */

export type ToastType = 'success' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

/** How long a toast remains visible before auto-dismissal, in milliseconds. */
const AUTO_DISMISS_MS = 4000;

class ToastStore {
  /** The list of currently visible toasts, newest last. */
  toasts = $state<Toast[]>([]);

  #timers = new Map<string, ReturnType<typeof setTimeout>>();

  #push(type: ToastType, message: string): string {
    const id = this.#createId();
    this.toasts = [...this.toasts, { id, type, message }];

    // Auto-dismiss after the configured delay. `setTimeout` is a no-op-safe
    // fallback in non-browser environments where it may be unavailable.
    if (typeof setTimeout === 'function') {
      const timer = setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
      this.#timers.set(id, timer);
    }
    return id;
  }

  #createId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  /** Show a success toast. Returns the new toast's id. */
  success(message: string): string {
    return this.#push('success', message);
  }

  /** Show an error toast. Returns the new toast's id. */
  error(message: string): string {
    return this.#push('error', message);
  }

  /** Remove a toast by id and clear any pending auto-dismiss timer. */
  dismiss(id: string): void {
    const timer = this.#timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.#timers.delete(id);
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}

export const toastStore = new ToastStore();
