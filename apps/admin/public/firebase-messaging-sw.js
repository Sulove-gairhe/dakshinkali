/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js",
);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function getAdminOrigin() {
  return self.location.origin;
}

function resolveAdminUrl(path) {
  if (!path) return getAdminOrigin();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${getAdminOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

function setupMessaging(config) {
  if (!config?.apiKey || !config?.projectId) return;

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "New order received";
    const body =
      payload.notification?.body || "A new order needs your attention.";
    const data = payload.data || {};

    self.registration.showNotification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data,
    });
  });
}

fetch("/api/firebase-config")
  .then((response) => response.json())
  .then((config) => setupMessaging(config))
  .catch((error) => {
    console.error("[FCM_SW_CONFIG_ERROR]", error);
  });

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = resolveAdminUrl(data.url || data.approvalUrl || "/admin/orders");

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(getAdminOrigin()) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});
