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

export type DeliveredOrderNotificationItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  hisabkitab_url: string;
};

export type DeliveredOrderNotificationCard = {
  id: string;
  type: "delivered_order";
  order_id: string;
  title: string;
  message: string;
  created_at: string;
  metadata: {
    order_id: string;
    order_number: string;
    customer_name: string;
    items: DeliveredOrderNotificationItem[];
  };
};

export type LowStockProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
};
