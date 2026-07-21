import { describe, expect, it } from "vitest";
import {
  applyAdminProductListFilters,
  type AdminProductListFilterParams,
} from "./product-list-filters";

type FilterCall =
  | { method: "eq"; column: string; value: string }
  | { method: "ilike"; column: string; value: string };

class FakeProductQuery {
  readonly calls: FilterCall[] = [];

  eq(column: string, value: string) {
    this.calls.push({ method: "eq", column, value });
    return this;
  }

  ilike(column: string, value: string) {
    this.calls.push({ method: "ilike", column, value });
    return this;
  }
}

function apply(filters: AdminProductListFilterParams) {
  const query = new FakeProductQuery();
  applyAdminProductListFilters(query, filters);
  return query.calls;
}

describe("admin product list filters", () => {
  it.each([
    ["live only", { publishingStatus: "live" }, [{ method: "eq", column: "publishing_status", value: "live" }]],
    ["draft only", { publishingStatus: "draft" }, [{ method: "eq", column: "publishing_status", value: "draft" }]],
    ["active only", { status: "active" }, [{ method: "eq", column: "status", value: "active" }]],
    ["low stock only", { status: "low_stock" }, [{ method: "eq", column: "status", value: "low_stock" }]],
    ["out of stock only", { status: "out_of_stock" }, [{ method: "eq", column: "status", value: "out_of_stock" }]],
    ["inactive only", { status: "inactive" }, [{ method: "eq", column: "status", value: "inactive" }]],
    [
      "live and active",
      { publishingStatus: "live", status: "active" },
      [
        { method: "eq", column: "publishing_status", value: "live" },
        { method: "eq", column: "status", value: "active" },
      ],
    ],
    [
      "live and low stock",
      { publishingStatus: "live", status: "low_stock" },
      [
        { method: "eq", column: "publishing_status", value: "live" },
        { method: "eq", column: "status", value: "low_stock" },
      ],
    ],
    [
      "draft and inactive",
      { publishingStatus: "draft", status: "inactive" },
      [
        { method: "eq", column: "publishing_status", value: "draft" },
        { method: "eq", column: "status", value: "inactive" },
      ],
    ],
    [
      "search publishing and status",
      { search: " Samsung ", publishingStatus: "live", status: "low_stock" },
      [
        { method: "ilike", column: "name", value: "%Samsung%" },
        { method: "eq", column: "publishing_status", value: "live" },
        { method: "eq", column: "status", value: "low_stock" },
      ],
    ],
  ] satisfies Array<[string, AdminProductListFilterParams, FilterCall[]]>)(
    "applies %s without extra conditions",
    (_label, filters, expected) => {
      expect(apply(filters)).toEqual(expected);
    },
  );

  it("does not add conditions when no filters are set", () => {
    expect(apply({})).toEqual([]);
  });
});
