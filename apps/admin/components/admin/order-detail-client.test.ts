import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("OrderDetailClient status confirmation", () => {
  it("closes the status picker before opening the final confirmation modal", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "order-detail-client.tsx"),
      "utf8",
    );

    expect(source).toMatch(
      /setStatusModalOpen\(false\);\s*setConfirm\(\{ type: "status", status: selectedStatus \}\);/,
    );
  });
});
