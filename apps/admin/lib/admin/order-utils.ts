import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingAddress,
} from "./order-types";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  pending_admin_approval: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function isValidOrderTransition(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return TRANSITIONS[current]?.includes(next) ?? false;
}

export function getValidNextStatuses(current: OrderStatus): OrderStatus[] {
  return TRANSITIONS[current] ?? [];
}

export function canShipOrder(
  paymentStatus: PaymentStatus,
  paymentMethod: PaymentMethod,
): boolean {
  return paymentStatus === "paid" || paymentMethod === "cash_on_delivery";
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function formatShippingAddress(address: ShippingAddress): string {
  const lines = [address.line1];
  if (address.line2?.trim()) lines.push(address.line2);
  lines.push(
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country || "Nepal",
  );
  return lines.filter(Boolean).join("\n");
}

export function orderStatusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-700";
    case "pending_admin_approval":
      return "bg-amber-100 text-amber-900";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "processing":
      return "bg-indigo-100 text-indigo-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function paymentStatusBadgeClass(status: PaymentStatus): string {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "pending_verification":
      return "bg-amber-100 text-amber-900";
    case "failed":
      return "bg-red-100 text-red-800";
    case "refunded":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

export function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case "cash_on_delivery":
      return "Cash on Delivery";
    case "fonepay_qr":
      return "Fonepay QR";
    case "esewa":
      return "eSewa";
    case "khalti":
      return "Khalti";
    case "bank_transfer":
      return "Bank Transfer";
    default:
      return method;
  }
}

export const PROOF_REVIEW_METHODS: PaymentMethod[] = [
  "fonepay_qr",
  "esewa",
  "khalti",
  "bank_transfer",
];

export function needsProofReview(
  paymentStatus: PaymentStatus,
  _paymentMethod?: PaymentMethod,
): boolean {
  return paymentStatus === "pending_verification";
}

export function isImageProofType(mime: string | null | undefined): boolean {
  return !!mime && /^image\/(jpeg|png|webp)$/i.test(mime);
}

export function isPdfProofType(mime: string | null | undefined): boolean {
  return mime === "application/pdf";
}

export function mapOrderRow(row: Record<string, unknown>): import("./order-types").AdminOrderRecord {
  const items = row.order_items as
    | { count: number }[]
    | import("./order-types").OrderItemRecord[]
    | undefined;

  let itemCount = 0;
  if (Array.isArray(items) && items.length > 0) {
    if ("count" in items[0]) {
      itemCount = (items[0] as { count: number }).count;
    } else {
      itemCount = items.length;
    }
  }

  return {
    id: row.id as string,
    user_id: (row.user_id as string) ?? null,
    order_number: row.order_number as string,
    status: row.status as OrderStatus,
    customer_email: row.customer_email as string,
    customer_name: row.customer_name as string,
    customer_phone: (row.customer_phone as string) ?? null,
    shipping_address_line1: row.shipping_address_line1 as string,
    shipping_address_line2: (row.shipping_address_line2 as string) ?? null,
    shipping_city: row.shipping_city as string,
    shipping_state: row.shipping_state as string,
    shipping_postal_code: row.shipping_postal_code as string,
    shipping_country: row.shipping_country as string,
    subtotal: Number(row.subtotal),
    shipping_cost: Number(row.shipping_cost),
    tax: Number(row.tax),
    total: Number(row.total),
    payment_method: row.payment_method as PaymentMethod,
    payment_status: row.payment_status as PaymentStatus,
    notes: (row.notes as string) ?? null,
    admin_notes: (row.admin_notes as string) ?? null,
    proof_file_url: (row.proof_file_url as string) ?? null,
    proof_file_name: (row.proof_file_name as string) ?? null,
    proof_file_type: (row.proof_file_type as string) ?? null,
    proof_file_size:
      row.proof_file_size != null ? Number(row.proof_file_size) : null,
    proof_uploaded_at: (row.proof_uploaded_at as string) ?? null,
    proof_cleanup_status: (row.proof_cleanup_status as string) ?? null,
    admin_notification_status:
      (row.admin_notification_status as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    item_count: itemCount,
    order_items: Array.isArray(items) && !("count" in (items[0] ?? {}))
      ? (items as import("./order-types").OrderItemRecord[])
      : undefined,
    order_status_history: row.order_status_history as
      | import("./order-types").OrderStatusHistoryRecord[]
      | undefined,
  };
}

export function shippingAddressFromOrder(
  order: import("./order-types").AdminOrderRecord,
): ShippingAddress {
  return {
    line1: order.shipping_address_line1,
    line2: order.shipping_address_line2,
    city: order.shipping_city,
    state: order.shipping_state,
    postalCode: order.shipping_postal_code,
    country: order.shipping_country,
  };
}
