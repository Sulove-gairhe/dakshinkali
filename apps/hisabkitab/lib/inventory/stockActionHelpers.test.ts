import { describe, expect, it } from "vitest";
import {
  canAdjustInventory,
  canViewInventory,
  getQuantityDelta,
  mapStockRpcError,
  requiresReason,
  type StockActionInput,
} from "./stockActionHelpers";
import type { HisabKitabUserContext } from "../auth/permissions";

const staffContext = (staffPermissions: string[]): HisabKitabUserContext => ({
  userId: "user-1",
  email: "staff@example.com",
  role: "staff",
  fullName: "Staff",
  staffPermissions,
  isAdmin: false,
});

describe("stock action helpers", () => {
  it("allows inventory view with explicit permission", () => {
    expect(
      canViewInventory(staffContext(["hisabkitab.inventory.view"])),
    ).toBe(true);
  });

  it("requires explicit adjustment permission for staff", () => {
    expect(
      canAdjustInventory(staffContext(["hisabkitab.inventory.view"])),
    ).toBe(false);
    expect(
      canAdjustInventory(staffContext(["hisabkitab.inventory.adjust"])),
    ).toBe(true);
  });

  it("allows admins to adjust without explicit permission", () => {
    expect(
      canAdjustInventory({
        ...staffContext([]),
        role: "admin",
        isAdmin: true,
      }),
    ).toBe(true);
  });

  it("requires reasons for reductions", () => {
    const decrease: StockActionInput = {
      productId: "00000000-0000-0000-0000-000000000001",
      mode: "decrease",
      quantity: 1,
      reason: "",
      correction: false,
    };
    const setLower: StockActionInput = { ...decrease, mode: "set", quantity: 4 };
    const setHigher: StockActionInput = { ...decrease, mode: "set", quantity: 6 };

    expect(requiresReason(decrease, 5)).toBe(true);
    expect(requiresReason(setLower, 5)).toBe(true);
    expect(requiresReason(setHigher, 5)).toBe(false);
  });

  it("maps user-friendly RPC errors", () => {
    expect(
      mapStockRpcError({
        message:
          "Inactive product stock decreases require correction movement type and reason",
      }),
    ).toBe(
      "Inactive product decreases must be marked as a correction and include a reason.",
    );
    expect(mapStockRpcError({ message: "Insufficient stock for product" })).toBe(
      "That adjustment would make stock negative.",
    );
  });

  it("computes quantity deltas without zero-delta mutation", () => {
    expect(
      getQuantityDelta({
        productId: "00000000-0000-0000-0000-000000000001",
        mode: "increase",
        quantity: 3,
        reason: "",
        correction: false,
      }),
    ).toBe(3);
    expect(
      getQuantityDelta({
        productId: "00000000-0000-0000-0000-000000000001",
        mode: "decrease",
        quantity: 3,
        reason: "Correction",
        correction: true,
      }),
    ).toBe(-3);
  });
});
