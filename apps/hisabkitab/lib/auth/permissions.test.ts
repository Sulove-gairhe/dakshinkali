import { describe, expect, it } from "vitest";
import {
  hasAnyHisabKitabPermission,
  hasPermission,
  parseStaffPermissions,
} from "./permissions";

describe("HisabKitab permissions", () => {
  it("parses JSONB array permission strings", () => {
    expect(
      parseStaffPermissions([
        "hisabkitab.settings.view",
        "admin.products.view",
        "hisabkitab.settings.edit",
      ]),
    ).toEqual(["hisabkitab.settings.view", "hisabkitab.settings.edit"]);
  });

  it("parses JSONB object permission maps defensively", () => {
    expect(
      parseStaffPermissions({
        hisabkitab: {
          settings: {
            view: true,
            edit: false,
          },
        },
        extra: "hisabkitab.reports.view",
      }),
    ).toEqual(["hisabkitab.settings.view", "hisabkitab.reports.view"]);
  });

  it("allows admins to bypass explicit permission strings", () => {
    expect(
      hasPermission(
        { isAdmin: true, staffPermissions: [] },
        "hisabkitab.settings.edit",
      ),
    ).toBe(true);
  });

  it("requires staff to have exact permission strings", () => {
    expect(
      hasPermission(
        { isAdmin: false, staffPermissions: ["hisabkitab.settings.view"] },
        "hisabkitab.settings.edit",
      ),
    ).toBe(false);
  });

  it("detects ungranted staff as having no app access", () => {
    expect(
      hasAnyHisabKitabPermission({ isAdmin: false, staffPermissions: [] }),
    ).toBe(false);
  });
});
