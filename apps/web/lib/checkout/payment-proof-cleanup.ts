const DEFAULT_EXPIRY_HOURS = 48;
const DEFAULT_PROOF_BUCKET = "order-proofs";

type SupabaseError = { message: string };

type SupabaseQueryResult<T> = PromiseLike<{
  data: T[] | null;
  error: SupabaseError | null;
}>;

type SupabaseOrderQuery<T> = {
  select(columns: string): SupabaseOrderQuery<T>;
  not(column: string, operator: string, value: unknown): SupabaseOrderQuery<T>;
  lt(column: string, value: string): SupabaseOrderQuery<T>;
  order(column: string, options: { ascending: boolean }): SupabaseQueryResult<T>;
};

type SupabaseOrderUpdate = {
  eq(column: string, value: string): PromiseLike<{ error: SupabaseError | null }>;
};

export type PaymentProofCleanupClient = {
  from(table: "orders"): SupabaseOrderQuery<OrderProofRow> & {
    update(values: Record<string, unknown>): SupabaseOrderUpdate;
  };
  storage: {
    from(bucket: string): {
      remove(paths: string[]): Promise<{ error: SupabaseError | null }>;
    };
  };
};

type OrderProofRow = {
  id: string;
  order_number: string | null;
  proof_file_url: string | null;
  proof_file_name: string | null;
  proof_uploaded_at: string | null;
  proof_storage_path?: string | null;
};

export interface ExpiredProof {
  orderId: string;
  orderNumber: string;
  proofFileUrl: string;
  proofFileName: string;
  uploadedAt: Date;
  storagePath: string;
}

export type PaymentProofCleanupOptions = {
  supabase: PaymentProofCleanupClient;
  expiryHours?: number;
  now?: Date;
  bucket?: string;
};

export type PaymentProofCleanupResult = {
  cleaned: ExpiredProof[];
  errors: string[];
};

export async function cleanupExpiredPaymentProofs({
  supabase,
  expiryHours = DEFAULT_EXPIRY_HOURS,
  now = new Date(),
  bucket = DEFAULT_PROOF_BUCKET,
}: PaymentProofCleanupOptions): Promise<PaymentProofCleanupResult> {
  if (!Number.isFinite(expiryHours) || expiryHours <= 0) {
    throw new Error("expiryHours must be a positive number.");
  }

  const cutoff = new Date(now.getTime() - expiryHours * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("orders")
    .select(
      [
        "id",
        "order_number",
        "proof_file_url",
        "proof_file_name",
        "proof_uploaded_at",
        "proof_storage_path",
      ].join(","),
    )
    .not("proof_file_url", "is", null)
    .lt("proof_uploaded_at", cutoff.toISOString())
    .order("proof_uploaded_at", { ascending: true });

  if (error) {
    return { cleaned: [], errors: [error.message] };
  }

  const cleaned: ExpiredProof[] = [];
  const errors: string[] = [];

  for (const row of data ?? []) {
    const expiredProof = toExpiredProof(row, bucket);
    if (!expiredProof) {
      errors.push(
        `Order ${row.order_number ?? row.id} has an expired proof without a storage path.`,
      );
      continue;
    }

    const removeResult = await supabase.storage
      .from(bucket)
      .remove([expiredProof.storagePath]);
    if (removeResult.error) {
      errors.push(
        `Order ${expiredProof.orderNumber}: ${removeResult.error.message}`,
      );
      await markCleanupFailed(supabase, expiredProof.orderId);
      continue;
    }

    const updateResult = await supabase
      .from("orders")
      .update({
        proof_file_url: null,
        proof_file_name: null,
        proof_file_type: null,
        proof_file_size: null,
        proof_uploaded_at: null,
        proof_storage_provider: null,
        proof_storage_path: null,
        proof_cleanup_status: "cleaned",
      })
      .eq("id", expiredProof.orderId);

    if (updateResult.error) {
      errors.push(
        `Order ${expiredProof.orderNumber}: ${updateResult.error.message}`,
      );
      await markCleanupFailed(supabase, expiredProof.orderId);
      continue;
    }

    cleaned.push(expiredProof);
  }

  return { cleaned, errors };
}

function toExpiredProof(
  row: OrderProofRow,
  bucket: string,
): ExpiredProof | null {
  if (!row.proof_file_url || !row.proof_uploaded_at) return null;

  const storagePath =
    row.proof_storage_path ?? extractStoragePath(row.proof_file_url, bucket);
  if (!storagePath) return null;

  return {
    orderId: row.id,
    orderNumber: row.order_number ?? row.id,
    proofFileUrl: row.proof_file_url,
    proofFileName: row.proof_file_name ?? storagePath.split("/").pop() ?? "",
    uploadedAt: new Date(row.proof_uploaded_at),
    storagePath,
  };
}

export function extractStoragePath(value: string, bucket = DEFAULT_PROOF_BUCKET) {
  if (!value) return null;
  if (value.startsWith("orders/")) return value;

  try {
    const url = new URL(value);
    const marker = `/object/public/${bucket}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

async function markCleanupFailed(
  supabase: PaymentProofCleanupClient,
  orderId: string,
) {
  await supabase
    .from("orders")
    .update({ proof_cleanup_status: "failed" })
    .eq("id", orderId);
}
