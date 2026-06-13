const STORAGE_KEY = "admin-order-notifications-read";
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

export type OrderNotificationReadEntry = {
  orderId: string;
  createdAt: string;
  read: boolean;
};

function isFresh(entry: OrderNotificationReadEntry, now = Date.now()) {
  const createdAt = new Date(entry.createdAt).getTime();
  return Number.isFinite(createdAt) && now - createdAt <= MAX_AGE_MS;
}

function normalizeEntry(value: unknown): OrderNotificationReadEntry | null {
  if (typeof value === "string") {
    return {
      orderId: value,
      createdAt: new Date().toISOString(),
      read: true,
    };
  }

  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (
    typeof record.orderId !== "string" ||
    typeof record.createdAt !== "string"
  ) {
    return null;
  }

  return {
    orderId: record.orderId,
    createdAt: record.createdAt,
    read: record.read === true,
  };
}

function readEntries(): OrderNotificationReadEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const entries = parsed
      .map((item) => normalizeEntry(item))
      .filter((item): item is OrderNotificationReadEntry => Boolean(item))
      .filter((item) => isFresh(item));
    writeEntries(entries);
    return entries;
  } catch {
    return [];
  }
}

function writeEntries(entries: OrderNotificationReadEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getOrderNotificationReadState(): OrderNotificationReadEntry[] {
  return readEntries();
}

export function upsertOrderNotificationEntry(
  orderId: string,
  createdAt = new Date().toISOString(),
): OrderNotificationReadEntry[] {
  const entries = readEntries();
  const existing = entries.find((entry) => entry.orderId === orderId);
  if (existing) {
    writeEntries(entries);
    return entries;
  }

  const next = [
    ...entries,
    {
      orderId,
      createdAt,
      read: false,
    },
  ];
  writeEntries(next);
  return next;
}

export function markOrderNotificationRead(
  orderId: string,
): OrderNotificationReadEntry[] {
  const entries = readEntries();
  const existing = entries.find((entry) => entry.orderId === orderId);
  const next = existing
    ? entries.map((entry) =>
        entry.orderId === orderId ? { ...entry, read: true } : entry,
      )
    : [
        ...entries,
        {
          orderId,
          createdAt: new Date().toISOString(),
          read: true,
        },
      ];
  writeEntries(next);
  return next;
}

export function isOrderNotificationRead(
  orderId: string,
  entries: OrderNotificationReadEntry[],
): boolean {
  return entries.some((entry) => entry.orderId === orderId && entry.read);
}
