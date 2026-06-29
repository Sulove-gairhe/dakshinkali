import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseClient } from "@dakshinkali/database";
import type { OrderWithItemsEntity } from "../modules/orders/types";
import {
  buildDeliveredOrderBellPayload,
  createDeliveredOrderBellNotification,
} from "./admin-order-notifications";

vi.mock("@dakshinkali/database");
vi.mock("./admin-push-notifications", async () => {
  const actual = await vi.importActual<
    typeof import("./admin-push-notifications")
  >("./admin-push-notifications");
  return {
    ...actual,
    sendAdminOrderPush: vi.fn(),
    sendAdminDeliveredOrderPush: vi.fn(),
  };
});

function createOrder(): OrderWithItemsEntity {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    orderNumber: "DK-QA-37531019",
    customerName: "Phase 2E QA",
    customerEmail: "qa@example.com",
    customerPhone: null,
    total: 100,
    subtotal: 100,
    shippingCost: 0,
    discountAmount: 0,
    couponCode: null,
    notes: null,
    status: "delivered",
    paymentMethod: "cash_on_delivery",
    paymentStatus: "pending",
    shippingAddress: {
      line1: "QA",
      city: "Kathmandu",
      state: "Bagmati",
      postalCode: "44600",
      country: "Nepal",
    },
    items: [
      {
        id: "item-1",
        orderId: "00000000-0000-4000-8000-000000000001",
        productId: "00000000-0000-4000-8000-000000000002",
        productName: "QA Product",
        productImageUrl: null,
        quantity: 1,
        unitPrice: 100,
      },
    ],
    createdAt: new Date("2026-06-29T00:00:00Z"),
    updatedAt: new Date("2026-06-29T00:00:00Z"),
  } as OrderWithItemsEntity;
}

function createMockClient(options: {
  deliveredStatus: string;
  existingId?: string;
  insertError?: { code?: string; message: string };
}) {
  const insert = vi.fn();

  const from = vi.fn((table: string) => {
    if (table === "orders") {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { delivered_notification_status: options.deliveredStatus },
          error: null,
        }),
      };
      return chain;
    }

    if (table === "admin_bell_notifications") {
      const readChain: any = {
        select: vi.fn(() => readChain),
        eq: vi.fn(() => readChain),
        maybeSingle: vi.fn().mockResolvedValue({
          data: options.existingId ? { id: options.existingId } : null,
          error: null,
        }),
      };

      readChain.insert = insert.mockImplementation((payload) => {
        const writeChain: any = {
          payload,
          select: vi.fn(() => writeChain),
          single: vi.fn().mockResolvedValue({
            data: options.insertError ? null : { id: "bell-1" },
            error: options.insertError ?? null,
          }),
        };
        return writeChain;
      });
      return readChain;
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return { client: { from }, from, insert };
}

describe("Task 18 delivered bell notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not create a bell row when delivered status is already sent", async () => {
    const mock = createMockClient({ deliveredStatus: "sent" });
    vi.mocked(createSupabaseClient).mockReturnValue(mock.client as never);

    const result = await createDeliveredOrderBellNotification(createOrder());

    expect(result).toEqual({ created: false, reason: "already_sent" });
    expect(mock.from).not.toHaveBeenCalledWith("admin_bell_notifications");
    expect(mock.insert).not.toHaveBeenCalled();
  });

  it("does not insert when order_id and delivered_order already exist", async () => {
    const mock = createMockClient({
      deliveredStatus: "sending",
      existingId: "bell-existing",
    });
    vi.mocked(createSupabaseClient).mockReturnValue(mock.client as never);

    const result = await createDeliveredOrderBellNotification(createOrder());

    expect(result).toEqual({ created: false, reason: "already_exists" });
    expect(mock.insert).not.toHaveBeenCalled();
  });

  it("creates one delivered_order row with order, customer, items, and link", async () => {
    const mock = createMockClient({ deliveredStatus: "sending" });
    vi.mocked(createSupabaseClient).mockReturnValue(mock.client as never);

    const result = await createDeliveredOrderBellNotification(createOrder());

    expect(result).toEqual({ created: true, notificationId: "bell-1" });
    expect(mock.insert).toHaveBeenCalledTimes(1);
    expect(mock.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "delivered_order",
        order_id: "00000000-0000-4000-8000-000000000001",
        title: "Order delivered - stock deduction required",
        message: "Order DK-QA-37531019 from Phase 2E QA",
        metadata: expect.objectContaining({
          order_number: "DK-QA-37531019",
          customer_name: "Phase 2E QA",
          items: [
            expect.objectContaining({
              product_id: "00000000-0000-4000-8000-000000000002",
              quantity: 1,
              hisabkitab_url: expect.stringContaining(
                "source_order=DK-QA-37531019",
              ),
            }),
          ],
        }),
      }),
    );
  });

  it("treats a unique conflict as an existing notification", async () => {
    const mock = createMockClient({
      deliveredStatus: "sending",
      insertError: { code: "23505", message: "duplicate key" },
    });
    vi.mocked(createSupabaseClient).mockReturnValue(mock.client as never);

    const result = await createDeliveredOrderBellNotification(createOrder());

    expect(result).toEqual({ created: false, reason: "already_exists" });
    expect(mock.insert).toHaveBeenCalledTimes(1);
  });

  it("builds the exact HisabKitab prefill parameters", () => {
    const payload = buildDeliveredOrderBellPayload(createOrder());
    const url = new URL(payload.metadata.items[0].hisabkitab_url);

    expect(url.pathname).toBe("/inventory");
    expect(url.searchParams.get("q")).toBe("QA Product");
    expect(url.searchParams.get("status")).toBe("all");
    expect(url.searchParams.get("stock_view")).toBe("all");
    expect(url.searchParams.get("product_id")).toBe(
      "00000000-0000-4000-8000-000000000002",
    );
    expect(url.searchParams.get("deduct_qty")).toBe("1");
    expect(url.searchParams.get("source_order")).toBe("DK-QA-37531019");
    expect(url.searchParams.get("customer")).toBe("Phase 2E QA");
  });
});
