"use client";

// Thin wrapper around the Meta Pixel's `fbq` global. Every call is a no-op
// until the base pixel script (app/layout.tsx) has loaded fbq onto window —
// checked defensively since events can fire from components that mount
// before that script finishes (e.g. a fast product-page view).
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaEvent(
  eventName: string,
  customData?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventId) {
    window.fbq("track", eventName, customData ?? {}, { eventID: eventId });
  } else {
    window.fbq("track", eventName, customData ?? {});
  }
}
