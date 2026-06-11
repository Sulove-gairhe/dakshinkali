import type { OrderStatus, PaymentStatus } from "@/lib/admin/order-types";

export type OrderNotificationItem = {
  product_name: string;
  product_image_url: string | null;
};

export type OrderNotificationCard = {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  order_items: OrderNotificationItem[];
};

export type LowStockProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
};
