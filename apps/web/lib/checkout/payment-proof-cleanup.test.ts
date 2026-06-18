import { describe, expect, it, vi } from "vitest";
import {
  cleanupExpiredPaymentProofs,
  extractStoragePath,
  type PaymentProofCleanupClient,
} from "./payment-proof-cleanup";

const expiredRow = {
  id: "order-1",
  order_number: "DK-20260618-ABC123",
  proof_file_url:
    "https://example.supabase.co/storage/v1/object/public/order-proofs/orders/user-1/proof.png",
  proof_file_name: "proof.png",
  proof_uploaded_at: "2026-06-15T00:00:00.000Z",
  proof_storage_path: "orders/user-1/proof.png",
};

function createSupabaseMock({
  rows = [expiredRow],
  queryError = null,
  removeError = null,
  updateError = null,
}: {
  rows?: typeof expiredRow[];
  queryError?: { message: string } | null;
  removeError?: { message: string } | null;
  updateError?: { message: string } | null;
} = {}) {
  const calls = {
    selectedColumns: "",
    not: vi.fn(),
    lt: vi.fn(),
    order: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
  };

  // Supabase's fluent query builder is intentionally duck-typed in this test.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let queryBuilder: any;

  queryBuilder = {
    select: vi.fn((columns: string) => {
      calls.selectedColumns = columns;
      return queryBuilder;
    }),
    not: vi.fn((...args: unknown[]) => {
      calls.not(...args);
      return queryBuilder;
    }),
    lt: vi.fn((...args: unknown[]) => {
      calls.lt(...args);
      return queryBuilder;
    }),
    order: vi.fn(async (...args: unknown[]) => {
      calls.order(...args);
      return { data: rows, error: queryError };
    }),
    update: vi.fn((values: Record<string, unknown>) => {
      calls.update(values);
      return {
        eq: vi.fn(async (...args: unknown[]) => {
          calls.eq(...args);
          return { error: updateError };
        }),
      };
    }),
  };

  const supabase = {
    from: vi.fn(() => queryBuilder),
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn(async (paths: string[]) => {
          calls.remove(paths);
          return { error: removeError };
        }),
      })),
    },
  } as unknown as PaymentProofCleanupClient;

  return { supabase, calls };
}

describe("payment proof cleanup", () => {
  it("deletes expired proof files and clears order proof metadata", async () => {
    const { supabase, calls } = createSupabaseMock();

    const result = await cleanupExpiredPaymentProofs({
      supabase,
      now: new Date("2026-06-18T00:00:00.000Z"),
    });

    expect(calls.lt).toHaveBeenCalledWith(
      "proof_uploaded_at",
      "2026-06-16T00:00:00.000Z",
    );
    expect(calls.remove).toHaveBeenCalledWith(["orders/user-1/proof.png"]);
    expect(calls.update).toHaveBeenCalledWith(
      expect.objectContaining({
        proof_file_url: null,
        proof_storage_path: null,
        proof_cleanup_status: "cleaned",
      }),
    );
    expect(result.cleaned).toHaveLength(1);
    expect(result.errors).toEqual([]);
  });

  it("extracts storage paths from public Supabase object URLs", () => {
    expect(
      extractStoragePath(
        "https://project.supabase.co/storage/v1/object/public/order-proofs/orders/user%201/proof%20one.png",
      ),
    ).toBe("orders/user 1/proof one.png");
  });

  it("marks cleanup as failed when storage deletion fails", async () => {
    const { supabase, calls } = createSupabaseMock({
      removeError: { message: "storage unavailable" },
    });

    const result = await cleanupExpiredPaymentProofs({ supabase });

    expect(result.cleaned).toEqual([]);
    expect(result.errors).toEqual([
      "Order DK-20260618-ABC123: storage unavailable",
    ]);
    expect(calls.update).toHaveBeenCalledWith({
      proof_cleanup_status: "failed",
    });
  });

  it("returns query errors without attempting storage deletion", async () => {
    const { supabase, calls } = createSupabaseMock({
      queryError: { message: "permission denied" },
    });

    const result = await cleanupExpiredPaymentProofs({ supabase });

    expect(result).toEqual({ cleaned: [], errors: ["permission denied"] });
    expect(calls.remove).not.toHaveBeenCalled();
  });
});
