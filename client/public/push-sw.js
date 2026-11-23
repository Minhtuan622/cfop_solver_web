/*
 * Nhận thông báo nhắc ôn tập (Web Push). File này được Workbox nạp bằng
 * importScripts vào service worker của PWA (xem `vite.config.ts`).
 * Nội dung push chỉ có loại và số case; câu chữ soạn tại đây theo ngôn ngữ
 * của trình duyệt vì service worker không đọc được cài đặt của app.
 */
self.addEventListener("push", event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  if (data.kind !== "review-due") return;
  const vi = String(self.navigator.language || "").toLowerCase().startsWith("vi");
  const count = Number(data.count) || 0;
  const title = vi ? "Đến giờ ôn tập" : "Time to review";
  const body = vi
    ? count > 0
      ? `Có ${count} case đang chờ bạn ôn lại.`
      : "Có case đang chờ bạn ôn lại."
    : count > 0
      ? `${count} cases are waiting for review.`
      : "Some cases are waiting for review.";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "review-due",
      data: { url: typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/" },
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url).catch(() => undefined);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
