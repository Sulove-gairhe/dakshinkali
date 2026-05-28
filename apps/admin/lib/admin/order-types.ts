export type OrderStatus =
  | "pending"
  | "pending_admin_approval"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "pending_verification"
  | "paid"
  | "failed"
  | "refunded";

export type PaymentMethod =
  | "cash_on_delivery"
  | "esewa"
  | "khalti"
  | "bank_transfer"
  | "fonepay_qr";

export interface ShippingAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderStatusHistoryRecord {
  id: string;
  order_id: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface AdminOrderRecord {
  id: string;
  user_id: string | null;
  order_number: string;
  status: OrderStatus;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes: string | null;
  admin_notes: string | null;
  proof_file_url: string | null;
  proof_file_name: string | null;
  proof_file_type: string | null;
  proof_file_size: number | null;
  proof_uploaded_at: string | null;
  proof_cleanup_status: string | null;
  admin_notification_status: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
  order_items?: OrderItemRecord[];
  order_status_history?: OrderStatusHistoryRecord[];
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function actionErrorMessage<T>(
  result: ActionResult<T>,
): string | undefined {
  if (result.success) return undefined;
  return result.error;
}

export interface OrderListFilters {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
