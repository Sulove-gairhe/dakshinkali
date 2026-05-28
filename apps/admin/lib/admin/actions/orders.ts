"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin/auth-server";
import {
  canShipOrder,
  getValidNextStatuses,
  isValidOrderTransition,
  mapOrderRow,
} from "@/lib/admin/order-utils";
import type {
  ActionResult,
  AdminOrderRecord,
  OrderListFilters,
  OrderStatus,
  PaymentMethod,
} from "@/lib/admin/order-types";

const PROOF_BUCKET = "order-proofs";

const orderIdSchema = z.string().uuid();

async function appendStatusHistory(
  supabase: Awaited<ReturnType<typeof requireAdminUser>>["supabase"],
  orderId: string,
  status: string,
  notes: string | null,
  userId: string,
) {
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    status,
    notes,
    changed_by: userId,
  });
}

async function fetchOrderById(
  supabase: Awaited<ReturnType<typeof requireAdminUser>>["supabase"],
  orderId: string,
): Promise<AdminOrderRecord | null> {
  const { data: orderRow, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!orderRow) return null;

  const [{ data: items }, { data: history }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", orderId),
    supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
  ]);

  return mapOrderRow({
    ...(orderRow as Record<string, unknown>),
    order_items: items ?? [],
    order_status_history: history ?? [],
    item_count: items?.length ?? 0,
  });
}

export async function getOrderNavCounts(): Promise<{
  pendingVerification: number;
  pendingApproval: number;
}> {
  const { supabase } = await requireAdminUser();

  const [verification, approval] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "pending_verification"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_admin_approval"),
  ]);

  return {
    pendingVerification: verification.count ?? 0,
    pendingApproval: approval.count ?? 0,
  };
}

export async function listAdminOrders(
  filters: OrderListFilters = {},
): Promise<{
  orders: AdminOrderRecord[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const { supabase } = await requireAdminUser();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("orders")
    .select("*, order_items(count)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus);
  }
  if (filters.paymentMethod) {
    query = query.eq("payment_method", filters.paymentMethod);
  }
  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
  }

  const search = filters.search?.trim();
  if (search) {
    // TODO: migrate to Postgres FTS for scale
    const term = search.replace(/[%_]/g, "");
    query = query.or(
      `order_number.ilike.${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,customer_phone.ilike.%${term}%`,
    );
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);

  return {
    orders: (data ?? []).map((row) =>
      mapOrderRow(row as Record<string, unknown>),
    ),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getAdminOrder(
  orderId: string,
): Promise<AdminOrderRecord | null> {
  const parsed = orderIdSchema.safeParse(orderId);
  if (!parsed.success) return null;
  const { supabase } = await requireAdminUser();
  return fetchOrderById(supabase, parsed.data);
}

export async function listBoardOrders(): Promise<AdminOrderRecord[]> {
  const { supabase } = await requireAdminUser();
  const boardStatuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(count)")
    .in("status", boardStatuses)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapOrderRow(row as Record<string, unknown>),
  );
}

export async function approveOrderPayment(
  orderId: string,
  adminNote?: string,
): Promise<ActionResult<AdminOrderRecord>> {
  try {
    const parsed = orderIdSchema.parse(orderId);
    const { supabase, user } = await requireAdminUser();
    const order = await fetchOrderById(supabase, parsed);
    if (!order) return { success: false, error: "Order not found" };
    if (order.payment_status !== "pending_verification") {
      return {
        success: false,
        error: "Order is not awaiting payment verification",
      };
    }

    const payload: Record<string, unknown> = {
      payment_status: "paid",
      status: "confirmed",
      proof_cleanup_status: "pending",
    };
    if (adminNote?.trim()) {
      payload.admin_notes = adminNote.trim();
    }

    const { data, error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", parsed)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await appendStatusHistory(
      supabase,
      parsed,
      "confirmed",
      adminNote?.trim() || "Payment verified by admin",
      user.id,
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${parsed}`);
    revalidatePath("/admin/orders/board");
    return {
      success: true,
      data: mapOrderRow(data as Record<string, unknown>),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to approve payment",
    };
  }
}

export async function rejectOrderPayment(
  orderId: string,
  adminNote?: string,
): Promise<ActionResult<AdminOrderRecord>> {
  try {
    const parsed = orderIdSchema.parse(orderId);
    const { supabase, user } = await requireAdminUser();
    const order = await fetchOrderById(supabase, parsed);
    if (!order) return { success: false, error: "Order not found" };
    if (order.payment_status !== "pending_verification") {
      return {
        success: false,
        error: "Order is not awaiting payment verification",
      };
    }

    const payload: Record<string, unknown> = {
      payment_status: "failed",
      status: "cancelled",
      proof_cleanup_status: "pending",
    };
    if (adminNote?.trim()) {
      payload.admin_notes = adminNote.trim();
    }

    const { data, error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", parsed)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await appendStatusHistory(
      supabase,
      parsed,
      "cancelled",
      adminNote?.trim() || "Payment rejected by admin",
      user.id,
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${parsed}`);
    revalidatePath("/admin/orders/board");
    return {
      success: true,
      data: mapOrderRow(data as Record<string, unknown>),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reject payment",
    };
  }
}

export async function confirmCodOrder(
  orderId: string,
): Promise<ActionResult<AdminOrderRecord>> {
  try {
    const parsed = orderIdSchema.parse(orderId);
    const { supabase, user } = await requireAdminUser();
    const order = await fetchOrderById(supabase, parsed);
    if (!order) return { success: false, error: "Order not found" };
    if (order.payment_method !== "cash_on_delivery") {
      return { success: false, error: "Not a cash on delivery order" };
    }
    if (order.status !== "pending_admin_approval") {
      return {
        success: false,
        error: "Order is not awaiting COD approval",
      };
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", parsed)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await appendStatusHistory(
      supabase,
      parsed,
      "confirmed",
      "COD order confirmed by admin",
      user.id,
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${parsed}`);
    revalidatePath("/admin/orders/board");
    return {
      success: true,
      data: mapOrderRow(data as Record<string, unknown>),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to confirm COD order",
    };
  }
}

export async function cancelCodOrder(
  orderId: string,
  adminNote?: string,
): Promise<ActionResult<AdminOrderRecord>> {
  try {
    const parsed = orderIdSchema.parse(orderId);
    const { supabase, user } = await requireAdminUser();
    const order = await fetchOrderById(supabase, parsed);
    if (!order) return { success: false, error: "Order not found" };
    if (order.payment_method !== "cash_on_delivery") {
      return { success: false, error: "Not a cash on delivery order" };
    }
    if (order.status !== "pending_admin_approval") {
      return {
        success: false,
        error: "Order is not awaiting COD approval",
      };
    }

    const payload: Record<string, unknown> = { status: "cancelled" };
    if (adminNote?.trim()) payload.admin_notes = adminNote.trim();

    const { data, error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", parsed)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await appendStatusHistory(
      supabase,
      parsed,
      "cancelled",
      adminNote?.trim() || "COD order cancelled by admin",
      user.id,
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${parsed}`);
    return {
      success: true,
      data: mapOrderRow(data as Record<string, unknown>),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel order",
    };
  }
}

const updateStatusSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: z.enum([
    "pending",
    "pending_admin_approval",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  note: z.string().max(2000).optional(),
});

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string,
): Promise<ActionResult<AdminOrderRecord>> {
  try {
    const input = updateStatusSchema.parse({ orderId, newStatus, note });
    const { supabase, user } = await requireAdminUser();
    const order = await fetchOrderById(supabase, input.orderId);
    if (!order) return { success: false, error: "Order not found" };

    if (!isValidOrderTransition(order.status, input.newStatus)) {
      return {
        success: false,
        error: `Cannot move order to ${input.newStatus} from ${order.status}`,
      };
    }

    if (
      input.newStatus === "shipped" &&
      !canShipOrder(order.payment_status, order.payment_method)
    ) {
      return {
        success: false,
        error: "Cannot ship — payment has not been verified",
      };
    }

    const payload: Record<string, unknown> = { status: input.newStatus };
    if (note?.trim()) payload.admin_notes = note.trim();

    const { data, error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", input.orderId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await appendStatusHistory(
      supabase,
      input.orderId,
      input.newStatus,
      note?.trim() || `Status updated to ${input.newStatus}`,
      user.id,
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${input.orderId}`);
    revalidatePath("/admin/orders/board");
    return {
      success: true,
      data: mapOrderRow(data as Record<string, unknown>),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update status",
    };
  }
}

export async function uploadOrderProof(
  formData: FormData,
): Promise<ActionResult<AdminOrderRecord>> {
  try {
    const orderId = orderIdSchema.parse(formData.get("orderId"));
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false, error: "No file provided" };
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      return { success: false, error: "Invalid file type" };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File too large (max 5MB)" };
    }

    const { supabase, user } = await requireAdminUser();
    const order = await fetchOrderById(supabase, orderId);
    if (!order) return { success: false, error: "Order not found" };

    const ext = file.name.split(".").pop() || "bin";
    const storagePath = `orders/${orderId}/${Date.now()}-proof.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(PROOF_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from(PROOF_BUCKET)
      .getPublicUrl(storagePath);

    const updatePayload: Record<string, unknown> = {
      proof_file_url: urlData.publicUrl,
      proof_file_name: file.name,
      proof_file_type: file.type,
      proof_file_size: file.size,
      proof_uploaded_at: new Date().toISOString(),
      proof_storage_provider: "supabase",
      proof_storage_path: storagePath,
      payment_status:
        order.payment_status === "pending"
          ? "pending_verification"
          : order.payment_status,
    };

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await appendStatusHistory(
      supabase,
      orderId,
      order.status,
      "Payment proof uploaded by admin",
      user.id,
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return {
      success: true,
      data: mapOrderRow(data as Record<string, unknown>),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload proof",
    };
  }
}

export async function quickConfirmCod(
  orderId: string,
): Promise<ActionResult<AdminOrderRecord>> {
  return confirmCodOrder(orderId);
}
