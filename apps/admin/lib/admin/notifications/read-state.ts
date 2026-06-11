const STORAGE_KEY = "admin-order-notifications-read";

function readIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function getReadOrderNotificationIds(): Set<string> {
  return readIds();
}

export function markOrderNotificationRead(orderId: string): Set<string> {
  const ids = readIds();
  ids.add(orderId);
  writeIds(ids);
  return ids;
}

export function isOrderNotificationRead(
  orderId: string,
  readIds: Set<string>,
): boolean {
  return readIds.has(orderId);
}
