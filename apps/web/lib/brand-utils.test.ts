import { describe, expect, it } from "vitest";
import {
  brandSlug,
  canonicalBrandDisplayName,
  compareBrandOptions,
  normalizeBrandParam,
} from "./brand-utils";

describe("storefront brand utilities", () => {
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

  it("normalizes URL params defensively", () => {
    expect(normalizeBrandParam("samsung")).toBe("samsung");
    expect(normalizeBrandParam("Samsung")).toBe("samsung");
    expect(normalizeBrandParam("mi-led")).toBe("mi led");
  });

  it("creates stable brand slugs", () => {
    expect(brandSlug(" Samsung ")).toBe("samsung");
    expect(brandSlug("mi   LED")).toBe("mi-led");
  });

  it("sorts priority brands before alphabetical brands", () => {
    const sorted = [
      { name: "Zed" },
      { name: "TCL" },
      { name: "Samsung" },
      { name: "Alpha" },
      { name: "CG" },
    ].sort(compareBrandOptions);

    expect(sorted.map((brand) => brand.name)).toEqual([
      "Samsung",
      "TCL",
      "CG",
      "Alpha",
      "Zed",
    ]);
  });
});
