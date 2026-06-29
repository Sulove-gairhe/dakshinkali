import { describe, expect, it } from "vitest";
import { mapDeliveredOrderNotification } from "./delivered-notification-mapper";

describe("delivered bell row mapping", () => {
  it("maps delivered_order metadata without changing its links", () => {
    const row = {
      id: "bell-1",
      type: "delivered_order",
      order_id: "order-1",
      title: "Order delivered - stock deduction required",
      message: "Order DK-QA-37531019 from Phase 2E QA",
      created_at: "2026-06-29T00:00:00Z",
      metadata: {
        order_id: "order-1",
        order_number: "DK-QA-37531019",
        customer_name: "Phase 2E QA",
        items: [
          {
            product_id: "product-1",
            product_name: "QA Product",
            quantity: 1,
            hisabkitab_url:
              "https://hisabkitab.dakshinkali.shop/inventory?product_id=product-1",
          },
        ],
      },
    };

    expect(mapDeliveredOrderNotification(row)).toEqual(row);
  });

  it("rejects non-delivered notification types", () => {
    expect(
      mapDeliveredOrderNotification({
        id: "bell-1",
        type: "new_order",
      }),
    ).toBeNull();
  });
});
