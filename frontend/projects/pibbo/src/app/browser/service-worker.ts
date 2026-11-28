/**
 * Registers Pibbo's service worker (ADR 0032), which keeps Pibbo's own files so an activity
 * opened once plays offline. A browser that refuses, or has none, changes nothing.
 */
export function registerServiceWorker(navigator: Navigator): void {
  navigator.serviceWorker?.register('/sw.js').catch(() => undefined);
}
