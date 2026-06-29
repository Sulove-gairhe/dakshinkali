import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function functionBody(contents: string, start: string, end: string) {
  const startIndex = contents.indexOf(start);
  const endIndex = contents.indexOf(end, startIndex + start.length);

  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return contents.slice(startIndex, endIndex);
}

const prohibitedStockWrites = [
  /hisabkitab_adjust_stock/,
  /hisabkitab_commit_order_stock/,
  /hisabkitab_release_order_stock/,
  /stock_movements/,
  /stock_quantity/,
  /\.from\(["']products["']\)/,
];

describe("delivered transition stock safety", () => {
  it("keeps the admin status action free of stock mutations", () => {
    const contents = source("./orders.ts");
    const body = functionBody(
      contents,
      "export async function updateOrderStatus(",
      "export async function updateOrderPaymentStatus(",
    );

    for (const pattern of prohibitedStockWrites) {
      expect(body).not.toMatch(pattern);
    }
  });

  it("keeps delivered notification paths free of stock mutations", () => {
    const files = [
      "../../../../api/src/modules/internal/order-notify.routes.ts",
      "../../../../api/src/services/admin-order-notifications.ts",
      "../../../../api/src/services/admin-push-notifications.ts",
      "../notifications/use-delivered-order-notifications.ts",
      "../../../components/admin/notification-bell.tsx",
      "../../../../../supabase/migrations/20260629150000_create_admin_bell_notifications.sql",
    ];

    for (const file of files) {
      const contents = source(file);
      for (const pattern of prohibitedStockWrites) {
        expect(contents).not.toMatch(pattern);
      }
    }
  });
});
