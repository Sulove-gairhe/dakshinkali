import type {
  DeliveredOrderNotificationCard,
  DeliveredOrderNotificationItem,
} from "./bell-types";

function mapItem(value: unknown): DeliveredOrderNotificationItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;

  if (
    typeof item.product_id !== "string" ||
    typeof item.product_name !== "string" ||
    typeof item.quantity !== "number" ||
    typeof item.hisabkitab_url !== "string"
  ) {
    return null;
  }

  return {
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    hisabkitab_url: item.hisabkitab_url,
  };
}

export function mapDeliveredOrderNotification(
  value: Record<string, unknown>,
): DeliveredOrderNotificationCard | null {
  if (
    value.type !== "delivered_order" ||
    typeof value.id !== "string" ||
    typeof value.order_id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.message !== "string" ||
    typeof value.created_at !== "string" ||
    !value.metadata ||
    typeof value.metadata !== "object"
  ) {
    return null;
  }

  const metadata = value.metadata as Record<string, unknown>;
  if (
    typeof metadata.order_id !== "string" ||
    typeof metadata.order_number !== "string" ||
    typeof metadata.customer_name !== "string" ||
    !Array.isArray(metadata.items)
  ) {
    return null;
  }

  const items = metadata.items
    .map((item) => mapItem(item))
    .filter((item): item is DeliveredOrderNotificationItem => Boolean(item));

  return {
    id: value.id,
    type: "delivered_order",
    order_id: value.order_id,
    title: value.title,
    message: value.message,
    created_at: value.created_at,
    metadata: {
      order_id: metadata.order_id,
      order_number: metadata.order_number,
      customer_name: metadata.customer_name,
      items,
    },
  };
}
