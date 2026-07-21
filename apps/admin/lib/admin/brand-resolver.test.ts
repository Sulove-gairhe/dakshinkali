import { describe, expect, it } from "vitest";
import {
  canonicalBrandDisplayName,
  cleanBrandDisplayName,
  getRejectedBrandReason,
  isRejectedBrandCandidate,
  normalizeBrandName,
  resolveBrand,
  sortBrands,
} from "./brand-resolver";

describe("brand resolver", () => {
  it.each([
    ["Samsung", "Samsung"],
    ["SAMSUNG", "Samsung"],
    ["samsung", "Samsung"],
    ["samsunG", "Samsung"],
    [" Samsung ", "Samsung"],
    ["Tcl", "TCL"],
    ["tcl", "TCL"],
    ["CG", "CG"],
    ["cg", "CG"],
  ])("canonicalizes %s to %s", (input, expected) => {
    expect(canonicalBrandDisplayName(input)).toBe(expected);
  });

  it("collapses repeated spaces", () => {
    expect(cleanBrandDisplayName("  New   Brand   Name  ")).toBe("New Brand Name");
    expect(normalizeBrandName("  New   Brand   Name  ")).toBe("new brand name");
  });

  it("handles empty input", () => {
    expect(canonicalBrandDisplayName("   ")).toBe("");
    expect(normalizeBrandName(null)).toBe("");
  });

  it.each(["WASHING", "Button", "sensor/Touch/Flat", "Generic", "   "])(
    "rejects import fragment candidate %s",
    (value) => {
      expect(isRejectedBrandCandidate(value)).toBe(true);
      expect(getRejectedBrandReason(value)).toBeTruthy();
    },
  );

  it("sorts priority brands before alphabetical brands", () => {
    const sorted = sortBrands([
      { id: "a", name: "Zed", normalized_name: "zed", sort_priority: null, is_active: true },
      { id: "b", name: "TCL", normalized_name: "tcl", sort_priority: 4, is_active: true },
      { id: "c", name: "Samsung", normalized_name: "samsung", sort_priority: 1, is_active: true },
      { id: "d", name: "Alpha", normalized_name: "alpha", sort_priority: null, is_active: true },
    ]);

    expect(sorted.map((brand) => brand.name)).toEqual(["Samsung", "TCL", "Alpha", "Zed"]);
  });

  it("reuses an existing normalized brand", async () => {
    const supabase = fakeSupabase({
      find: { id: "brand-1", name: "Samsung", normalized_name: "samsung" },
    });

    await expect(resolveBrand(supabase as never, "SAMSUNG")).resolves.toEqual({
      id: "brand-1",
      name: "Samsung",
      normalizedName: "samsung",
    });
  });

  it("recovers from concurrent duplicate creation", async () => {
    const supabase = fakeSupabase({
      insertError: { code: "23505", message: "duplicate key" },
      concurrent: { id: "brand-2", name: "TCL", normalized_name: "tcl" },
    });

    await expect(resolveBrand(supabase as never, "tcl")).resolves.toEqual({
      id: "brand-2",
      name: "TCL",
      normalizedName: "tcl",
    });
  });

  it("creates unknown brands without title-casing them", async () => {
    const supabase = fakeSupabase({
      created: { id: "brand-3", name: "mi LED", normalized_name: "mi led" },
    });

    await expect(resolveBrand(supabase as never, " mi   LED ")).resolves.toEqual({
      id: "brand-3",
      name: "mi LED",
      normalizedName: "mi led",
    });
  });

  it("does not create a guessed value when creation is disabled", async () => {
    const supabase = fakeSupabase();
    await expect(resolveBrand(supabase as never, "Legitimate Guess", { createIfMissing: false })).resolves.toBeNull();
  });
});

function fakeSupabase({
  find = null,
  created = null,
  insertError = null,
  concurrent = null,
}: {
  find?: { id: string; name: string; normalized_name: string } | null;
  created?: { id: string; name: string; normalized_name: string } | null;
  insertError?: { code: string; message: string } | null;
  concurrent?: { id: string; name: string; normalized_name: string } | null;
} = {}) {
  let selectCall = 0;
  return {
    from() {
      const builder = {
        select() {
          return builder;
        },
        eq() {
          return builder;
        },
        insert(..._args: unknown[]) {
          return builder;
        },
        async maybeSingle() {
          return { data: find, error: null };
        },
        async single() {
          selectCall += 1;
          if (selectCall === 1) {
            return { data: created, error: insertError };
          }
          return { data: concurrent, error: null };
        },
      };
      return builder;
    },
  };
}
