import { describe, expect, it } from "vitest";
import {
  canShipOrder,
  formatFileSize,
  getValidNextStatuses,
  isValidOrderTransition,
} from "./order-utils";

describe("order-utils", () => {
  it("allows valid transitions", () => {
    expect(isValidOrderTransition("pending", "confirmed")).toBe(true);
    expect(isValidOrderTransition("pending_admin_approval", "confirmed")).toBe(
      true,
    );
    expect(isValidOrderTransition("delivered", "cancelled")).toBe(false);
  });

  it("returns valid next statuses", () => {
    expect(getValidNextStatuses("processing")).toEqual([
      "shipped",
      "cancelled",
    ]);
  });

  it("enforces shipping guard", () => {
    expect(canShipOrder("pending", "fonepay_qr")).toBe(false);
    expect(canShipOrder("paid", "fonepay_qr")).toBe(true);
    expect(canShipOrder("pending", "cash_on_delivery")).toBe(true);
  });

  it("formats file sizes", () => {
    expect(formatFileSize(2457600)).toBe("2.3 MB");
  });
});
