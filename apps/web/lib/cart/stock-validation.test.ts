import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  validateCartStock,
  UUID_RE,
} from "./stock-validation";

const mockProduct = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Test Product",
  status: "active",
  publishing_status: "live",
  deleted_at: null,
  stock_quantity: 10,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

async function setupMock(data: unknown[] = [mockProduct]) {
  const { createClient } = await import("@/lib/supabase/server");
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data, error: null }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (createClient as any).mockResolvedValue({
    from: mockFrom,
  });
  return { createClient, mockFrom };
}

describe("validateCartStock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns valid for empty items", async () => {
    const result = await validateCartStock([]);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("aggregates duplicate product IDs correctly", async () => {
    const { createClient } = await setupMock([mockProduct]);
    const result = await validateCartStock([
      { productId: mockProduct.id, quantity: 2 },
      { productId: mockProduct.id, quantity: 3 },
      { productId: mockProduct.id, quantity: 1 },
    ]);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((createClient as any).mock.results[0].value.from).toBeDefined();
  });

  it("rejects invalid UUID", async () => {
    await setupMock([]);
    const result = await validateCartStock([
      { productId: "not-a-uuid", quantity: 1 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "invalid_product_id",
      productId: "not-a-uuid",
    });
  });

  it("rejects quantity <= 0", async () => {
    await setupMock([]);
    const result = await validateCartStock([
      { productId: mockProduct.id, quantity: 0 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "invalid_quantity",
    });
  });

  it("rejects negative quantity", async () => {
    await setupMock([]);
    const result = await validateCartStock([
      { productId: mockProduct.id, quantity: -1 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "invalid_quantity",
    });
  });

  it("rejects missing product", async () => {
    await setupMock([]);
    const result = await validateCartStock([
      { productId: mockProduct.id, quantity: 1 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "missing",
      productId: mockProduct.id,
    });
  });

  it("rejects deleted product", async () => {
    await setupMock([
      { ...mockProduct, deleted_at: "2026-06-01T00:00:00.000Z" },
    ]);
    const result = await validateCartStock([
      { productId: mockProduct.id, quantity: 1 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "deleted",
    });
  });

  it("rejects unpublished product", async () => {
    await setupMock([
      { ...mockProduct, publishing_status: "draft" },
    ]);
    const result = await validateCartStock([
      { productId: mockProduct.id, quantity: 1 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "unpublished",
    });
  });

  it("rejects inactive product", async () => {
    await setupMock([
      { ...mockProduct, status: "inactive" },
    ]);
    const result = await validateCartStock([
      { productId: mockProduct.id, quantity: 1 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "inactive",
    });
  });

  it("rejects out_of_stock product", async () => {
    await setupMock([
      { ...mockProduct, status: "out_of_stock" },
    ]);
    const result = await validateCartStock([
      { productId: mockProduct.id, quantity: 1 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "out_of_stock",
    });
  });

  it("rejects insufficient stock", async () => {
    await setupMock([
      { ...mockProduct, stock_quantity: 2 },
    ]);
    const result = await validateCartStock([
      { productId: mockProduct.id, quantity: 5 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "insufficient_stock",
      requestedQuantity: 5,
      availableQuantity: 2,
    });
  });

  it("passes valid active product", async () => {
    await setupMock([mockProduct]);
    const result = await validateCartStock([
      { productId: mockProduct.id, quantity: 5 },
    ]);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("passes low_stock product if quantity <= stock", async () => {
    await setupMock([
      { ...mockProduct, status: "low_stock", stock_quantity: 3 },
    ]);
    const result = await validateCartStock([
      { productId: mockProduct.id, quantity: 3 },
    ]);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("handles mixed valid and invalid items", async () => {
    const validId = mockProduct.id;
    const invalidId = "00000000-0000-0000-0000-000000000002";
    await setupMock([mockProduct]);

    const result = await validateCartStock([
      { productId: validId, quantity: 2 },
      { productId: invalidId, quantity: 1 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: "missing",
      productId: invalidId,
    });
  });

  it("aggregates before querying database", async () => {
    const { createClient } = await setupMock([mockProduct]);

    await validateCartStock([
      { productId: mockProduct.id, quantity: 1 },
      { productId: mockProduct.id, quantity: 2 },
      { productId: mockProduct.id, quantity: 3 },
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fromSpy = (createClient as any).mock.results[0].value.from;
    expect(fromSpy).toHaveBeenCalledWith("products");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectSpy = fromSpy.mock.results[0].value.select;
    expect(selectSpy).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inSpy = selectSpy.mock.results[0].value.in;
    expect(inSpy).toHaveBeenCalledWith("id", [mockProduct.id]);
  });
});

describe("UUID_RE", () => {
  it("matches valid UUIDs", () => {
    expect(UUID_RE.test("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(UUID_RE.test("00000000-0000-0000-0000-000000000000")).toBe(true);
  });

  it("rejects invalid strings", () => {
    expect(UUID_RE.test("not-a-uuid")).toBe(false);
    expect(UUID_RE.test("")).toBe(false);
    expect(UUID_RE.test("123")).toBe(false);
  });
});
