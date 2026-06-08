"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin/auth-server";
import { createServiceClient } from "@/lib/supabase/service-server";
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
  PaymentStatus,
  PaymentMethod,
} from "@/lib/admin/order-types";
import {
  COD_PAYMENT_METHOD,
  FONEPAY_PAYMENT_METHODS,
} from "@/lib/admin/order-types";

const PROOF_BUCKET = "order-proofs";
const QR_PAYMENT_METHODS = [...FONEPAY_PAYMENT_METHODS] satisfies PaymentMethod[];
const APPROVAL_STATUSES: OrderStatus[] = ["pending", "pending_admin_approval"];
const QR_PENDING_PAYMENT_STATUSES = ["pending", "pending_verification"];
const ORDER_LIST_SELECT =
  "*, order_items(id, order_id, product_id, product_name, quantity)";

function isQrPaymentMethod(method: PaymentMethod) {
  return (QR_PAYMENT_METHODS as PaymentMethod[]).includes(method);
}

const orderIdSchema = z.string().uuid();

async function requireAdminOrderAccess() {
  const { user, profile } = await requireAdminUser();

  return {
    supabase: createServiceClient(),
    user,
    profile,
  };
}

async function appendStatusHistory(
  supabase: Awaited<ReturnType<typeof requireAdminOrderAccess>>["supabase"],
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
  supabase: Awaited<ReturnType<typeof requireAdminOrderAccess>>["supabase"],
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

async function updateOrderWithOptionalProofCleanup(
  supabase: Awaited<ReturnType<typeof requireAdminOrderAccess>>["supabase"],
  orderId: string,
  payload: Record<string, unknown>,
) {
  const first = await supabase
    .from("orders")
    .update(payload)
    .eq("id", orderId)
    .select()
    .single();

  if (!first.error || !isMissingProofCleanupColumn(first.error)) {
    return first;
  }

  const { proof_cleanup_status: _proofCleanupStatus, ...fallbackPayload } = payload;
  return supabase
    .from("orders")
    .update(fallbackPayload)
    .eq("id", orderId)
    .select()
    .single();
}

function isMissingProofCleanupColumn(error: { message?: string; code?: string }) {
  return (
    error.code === "PGRST204" ||
    error.message?.includes("proof_cleanup_status") ||
    error.message?.includes("schema cache")
  );
}

export async function getOrderNavCounts(): Promise<{
  pendingVerification: number;
  pendingApproval: number;
  awaitingApproval: number;
}> {
  const { supabase } = await requireAdminOrderAccess();

  const [verification, approval] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("payment_method", QR_PAYMENT_METHODS)
      .in("status", APPROVAL_STATUSES)
      .in("payment_status", QR_PENDING_PAYMENT_STATUSES),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_method", COD_PAYMENT_METHOD)
      .in("status", APPROVAL_STATUSES),
  ]);

  return {
    pendingVerification: verification.count ?? 0,
    pendingApproval: approval.count ?? 0,
    awaitingApproval: (verification.count ?? 0) + (approval.count ?? 0),
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
  const { supabase } = await requireAdminOrderAccess();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("orders")
    .select(ORDER_LIST_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus);
  }
  if (filters.paymentMethod) {
    query =
      filters.paymentMethod === "fonepay_qr_group"
        ? query.in("payment_method", QR_PAYMENT_METHODS)
        : query.eq("payment_method", filters.paymentMethod);
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

type ApprovalKind = "cod" | "qr";

export async function listAwaitingApprovalOrders({
  kind,
  search,
  page = 1,
  pageSize = 10,
}: {
  kind: ApprovalKind;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  orders: AdminOrderRecord[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const { supabase } = await requireAdminOrderAccess();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 25);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = supabase
    .from("orders")
    .select(ORDER_LIST_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  if (kind === "cod") {
    query = query
      .eq("payment_method", COD_PAYMENT_METHOD)
      .in("status", APPROVAL_STATUSES);
  } else {
    query = query
      .in("payment_method", QR_PAYMENT_METHODS)
      .in("status", APPROVAL_STATUSES)
      .in("payment_status", QR_PENDING_PAYMENT_STATUSES);
  }

  const term = search?.trim().replace(/[%_]/g, "");
  if (term) {
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
    page: safePage,
    pageSize: safePageSize,
  };
}

export async function getAwaitingApprovalSummary(): Promise<{
  total: number;
  cod: number;
  qr: number;
}> {
  const { supabase } = await requireAdminOrderAccess();

  const [cod, qr] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_method", COD_PAYMENT_METHOD)
      .in("status", APPROVAL_STATUSES),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("payment_method", QR_PAYMENT_METHODS)
      .in("status", APPROVAL_STATUSES)
      .in("payment_status", QR_PENDING_PAYMENT_STATUSES),
  ]);

  const codCount = cod.count ?? 0;
  const qrCount = qr.count ?? 0;
  return {
    total: codCount + qrCount,
    cod: codCount,
    qr: qrCount,
  };
}

export async function getAdminOrder(
  orderId: string,
): Promise<AdminOrderRecord | null> {
  const parsed = orderIdSchema.safeParse(orderId);
  if (!parsed.success) return null;
  const { supabase } = await requireAdminOrderAccess();
  return fetchOrderById(supabase, parsed.data);
}

export async function listBoardOrders(): Promise<AdminOrderRecord[]> {
  const { supabase } = await requireAdminOrderAccess();
  const boardStatuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_LIST_SELECT)
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
    const { supabase, user } = await requireAdminOrderAccess();
    const order = await fetchOrderById(supabase, parsed);
    if (!order) return { success: false, error: "Order not found" };
    if (!isQrPaymentMethod(order.payment_method)) {
      return {
        success: false,
        error: "Order is not a QR payment order",
      };
    }
    if (!QR_PENDING_PAYMENT_STATUSES.includes(order.payment_status)) {
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

    const { data, error } = await updateOrderWithOptionalProofCleanup(
      supabase,
      parsed,
      payload,
    );

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
    const { supabase, user } = await requireAdminOrderAccess();
    const order = await fetchOrderById(supabase, parsed);
    if (!order) return { success: false, error: "Order not found" };
    if (!isQrPaymentMethod(order.payment_method)) {
      return {
        success: false,
        error: "Order is not a QR payment order",
      };
    }
    if (!QR_PENDING_PAYMENT_STATUSES.includes(order.payment_status)) {
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

    const { data, error } = await updateOrderWithOptionalProofCleanup(
      supabase,
      parsed,
      payload,
    );

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
    const { supabase, user } = await requireAdminOrderAccess();
    const order = await fetchOrderById(supabase, parsed);
    if (!order) return { success: false, error: "Order not found" };
    if (order.payment_method !== COD_PAYMENT_METHOD) {
      return { success: false, error: "Not a cash on delivery order" };
    }
    if (!APPROVAL_STATUSES.includes(order.status)) {
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
    const { supabase, user } = await requireAdminOrderAccess();
    const order = await fetchOrderById(supabase, parsed);
    if (!order) return { success: false, error: "Order not found" };
    if (order.payment_method !== COD_PAYMENT_METHOD) {
      return { success: false, error: "Not a cash on delivery order" };
    }
    if (!APPROVAL_STATUSES.includes(order.status)) {
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

const updatePaymentStatusSchema = z.object({
  orderId: z.string().uuid(),
  paymentStatus: z.enum([
    "pending",
    "pending_verification",
    "paid",
    "failed",
    "refunded",
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
    const { supabase, user } = await requireAdminOrderAccess();
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

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  note?: string,
): Promise<ActionResult<AdminOrderRecord>> {
  try {
    const input = updatePaymentStatusSchema.parse({
      orderId,
      paymentStatus,
      note,
    });
    const { supabase, user } = await requireAdminOrderAccess();
    const order = await fetchOrderById(supabase, input.orderId);
    if (!order) return { success: false, error: "Order not found" };

    const payload: Record<string, unknown> = {
      payment_status: input.paymentStatus,
    };
    if (input.note?.trim()) payload.admin_notes = input.note.trim();

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
      order.status,
      input.note?.trim() || `Payment status updated to ${input.paymentStatus}`,
      user.id,
    );

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${input.orderId}`);
    revalidatePath("/admin/orders/approval");
    revalidatePath("/admin/orders/board");
    return {
      success: true,
      data: mapOrderRow(data as Record<string, unknown>),
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to update payment status",
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

    const { supabase, user } = await requireAdminOrderAccess();
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
    if (order.status === "pending" && order.payment_method !== COD_PAYMENT_METHOD) {
      updatePayload.status = "pending_admin_approval";
    }

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
      (updatePayload.status as string | undefined) ?? order.status,
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
