// FocusList intentionally keeps this worker network-only.
// It enables PWA installation without aggressively caching the application,
// so users receive new versions without manually clearing browser data.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
