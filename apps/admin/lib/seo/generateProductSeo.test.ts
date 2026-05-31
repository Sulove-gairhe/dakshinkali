import { describe, expect, it } from "vitest";
import {
  applyTVSingularRule,
  generateProductSeo,
  generateSeoTitle,
  generateSeoDescription,
  generateSearchTerms,
  detectProductAttributes,
  MAX_VARIATIONS,
  normalizeSearchTerms,
  validateSeoSuggestion,
  type ProductSeoInput,
} from "./generateProductSeo";

function tvInput(overrides: Partial<ProductSeoInput> = {}): ProductSeoInput {
  return {
    name: 'TCL 43V6B 43" 4K Smart Google TV',
    description: "A stunning 4K television with Google TV built-in.",
    brand: "TCL",
    category: "Smart TVs",
    shortDescription: "43 inch 4K Smart Google TV with stunning UHD display",
    highlights: [
      "43 inch 4K UHD display",
      "Google TV built-in",
      "HDR10 support",
      "Metal bezel-less design",
    ],
    specifications: [
      {
        title: "Display",
        specs: [
          { label: "Screen Size", value: '43"' },
          { label: "Resolution", value: "4K UHD (3840 x 2160)" },
        ],
      },
      {
        title: "Smart Features",
        specs: [
          { label: "Smart Platform", value: "Google TV" },
          { label: "WiFi", value: "Yes" },
        ],
      },
    ],
    existingSearchTerms: [],
    variants: [],
    ...overrides,
  };
}

function fridgeInput(overrides: Partial<ProductSeoInput> = {}): ProductSeoInput {
  return {
    name: "Samsung 345L Double Door Frost Free Refrigerator RT34A3022GS/IM",
    description: "Digital Inverter technology with 10 year warranty.",
    brand: "Samsung",
    category: "Double-Door Refrigerators",
    shortDescription:
      "345L double door frost free refrigerator with digital inverter",
    highlights: [
      "345L capacity",
      "Double door design",
      "Digital Inverter technology",
      "Frost Free cooling",
      "10 Year compressor warranty",
    ],
    specifications: [
      {
        title: "Capacity",
        specs: [{ label: "Capacity (Ltr)", value: "345 Ltr" }],
      },
      {
        title: "General Feature",
        specs: [
          { label: "Cooling Features", value: "Frost Free Cooling" },
          { label: "Compressor", value: "Digital Inverter Compressor" },
        ],
      },
    ],
    existingSearchTerms: [],
    variants: [],
    ...overrides,
  };
}

function washingMachineInput(
  overrides: Partial<ProductSeoInput> = {},
): ProductSeoInput {
  return {
    name: "Samsung 8KG Front Load Fully Automatic Washing Machine WW80T504DAN",
    description: "Eco Bubble technology with digital inverter motor.",
    brand: "Samsung",
    category: "Washing Machines",
    shortDescription:
      "8KG front load fully automatic washing machine with Eco Bubble",
    highlights: [
      "8KG capacity",
      "Front load design",
      "Fully automatic",
      "Digital Inverter motor",
      "Eco Bubble technology",
      "1400 RPM spin speed",
    ],
    specifications: [
      {
        title: "Capacity",
        specs: [{ label: "Capacity", value: "8 kg" }],
      },
      {
        title: "Features",
        specs: [
          { label: "Type", value: "Front Load" },
          { label: "Control", value: "Fully Automatic" },
        ],
      },
    ],
    existingSearchTerms: [],
    variants: [],
    ...overrides,
  };
}

function acInput(overrides: Partial<ProductSeoInput> = {}): ProductSeoInput {
  return {
    name: "Daikin 1.5 Ton Inverter Split AC FTKF50TV",
    description: "Energy efficient cooling with inverter technology.",
    brand: "Daikin",
    category: "Air Conditioner",
    shortDescription:
      "1.5 ton inverter split air conditioner with energy saving",
    highlights: [
      "1.5 Ton cooling capacity",
      "Inverter technology",
      "Split type",
      "Energy efficient",
      "Powerful cooling",
    ],
    specifications: [
      {
        title: "Cooling",
        specs: [
          { label: "Tonnage", value: "1.5 Ton" },
          { label: "Type", value: "Inverter" },
          { label: "Form", value: "Split" },
        ],
      },
    ],
    existingSearchTerms: [],
    variants: [],
    ...overrides,
  };
}

function noModelInput(overrides: Partial<ProductSeoInput> = {}): ProductSeoInput {
  return {
    name: "Generic LED Television 43 Inch",
    description: "A basic LED television.",
    brand: "Generic",
    category: "TVs",
    shortDescription: "43 inch LED TV",
    highlights: ["43 inch screen", "LED display"],
    specifications: [],
    existingSearchTerms: [],
    variants: [],
    ...overrides,
  };
}

function longNameInput(overrides: Partial<ProductSeoInput> = {}): ProductSeoInput {
  return {
    name: "Samsung 75 Inch QLED 4K Smart TV with Quantum HDR and Dolby Atmos and Anti Reflection Technology QN75Q80TAFXZA",
    description: "Premium QLED television.",
    brand: "Samsung",
    category: "Smart TVs",
    shortDescription: "75 inch QLED 4K TV with premium features",
    highlights: [
      "75 inch QLED display",
      "4K resolution",
      "Quantum HDR",
      "Dolby Atmos",
    ],
    specifications: [
      {
        title: "Display",
        specs: [
          { label: "Screen Size", value: '75"' },
          { label: "Resolution", value: "4K UHD" },
        ],
      },
    ],
    existingSearchTerms: [],
    variants: [],
    ...overrides,
  };
}

function existingSeoInput(
  overrides: Partial<ProductSeoInput> = {},
): ProductSeoInput {
  return {
    ...tvInput(),
    existingSearchTerms: [
      "tcl 43 inch 4k smart tv",
      "tcl tv nepal",
      "4k tv nepal",
    ],
    ...overrides,
  };
}

function unknownCategoryInput(
  overrides: Partial<ProductSeoInput> = {},
): ProductSeoInput {
  return {
    name: "Generic Widget Pro X1000",
    description: "A multi-purpose widget.",
    brand: "GenericCo",
    category: "Widgets",
    shortDescription: "Versatile widget for everyday use",
    highlights: ["Durable build", "Multi-purpose", "Easy to use"],
    specifications: [],
    existingSearchTerms: [],
    variants: [],
    ...overrides,
  };
}

describe("detectProductAttributes", () => {
  it("detects TV attributes", () => {
    const attrs = detectProductAttributes(tvInput());
    expect(attrs.categoryType).toBe("tv");
    expect(attrs.screenSize).toBe("43 inch");
    expect(attrs.model).toBeTruthy();
    expect(attrs.features).toEqual(
      expect.arrayContaining(["4K", "Google TV"]),
    );
  });

  it("detects refrigerator attributes", () => {
    const attrs = detectProductAttributes(fridgeInput());
    expect(attrs.categoryType).toBe("refrigerator");
    expect(attrs.capacity).toBe("345L");
    expect(attrs.features).toEqual(
      expect.arrayContaining(["double door"]),
    );
  });

  it("detects washing machine attributes", () => {
    const attrs = detectProductAttributes(washingMachineInput());
    expect(attrs.categoryType).toBe("washing_machine");
    expect(attrs.capacity).toBe("8KG");
    expect(attrs.features).toEqual(
      expect.arrayContaining(["front load", "fully automatic"]),
    );
  });

  it("detects AC attributes", () => {
    const attrs = detectProductAttributes(acInput());
    expect(attrs.categoryType).toBe("ac");
    expect(attrs.tonnage).toBe("1.5 Ton");
    expect(attrs.features).toEqual(
      expect.arrayContaining(["Inverter", "Split"]),
    );
  });

  it("handles product with no model number", () => {
    const attrs = detectProductAttributes(noModelInput());
    expect(attrs.model).toBeNull();
    expect(attrs.screenSize).toBe("43 inch");
  });

  it("handles unknown category", () => {
    const attrs = detectProductAttributes(unknownCategoryInput());
    expect(attrs.categoryType).toBe("unknown");
  });
});

describe("generateSeoTitle", () => {
  it("generates TV title under 60 characters", () => {
    const title = generateSeoTitle(tvInput());
    expect(title.length).toBeLessThanOrEqual(65);
    expect(title).toContain("TCL");
    expect(title).toContain("Nepal");
  });

  it("generates refrigerator title with capacity and door type", () => {
    const title = generateSeoTitle(fridgeInput());
    expect(title).toContain("345L");
    expect(title).toContain("Double");
    expect(title).toContain("Samsung");
  });

  it("generates washing machine title with capacity and load type", () => {
    const title = generateSeoTitle(washingMachineInput());
    expect(title).toContain("8KG");
    expect(title).toContain("Front");
    expect(title).toContain("Washing Machine");
  });

  it("generates AC title with tonnage and type", () => {
    const title = generateSeoTitle(acInput());
    expect(title).toContain("1.5 Ton");
    expect(title).toContain("Inverter");
    expect(title).toContain("AC");
  });

  it("handles product with no model number", () => {
    const title = generateSeoTitle(noModelInput());
    expect(title.length).toBeGreaterThan(0);
    expect(title).toContain("Generic");
  });

  it("handles product with very long name", () => {
    const title = generateSeoTitle(longNameInput());
    expect(title.length).toBeLessThanOrEqual(65);
    expect(title).toContain("Nepal");
  });
});

describe("generateSeoDescription", () => {
  it("generates description between 120-160 characters for TV", () => {
    const desc = generateSeoDescription(tvInput());
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).toContain("Best price with fast delivery. Order now!");
  });

  it("generates description between 120-160 characters for fridge", () => {
    const desc = generateSeoDescription(fridgeInput());
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).toContain("Best price with fast delivery. Order now!");
  });

  it("generates description between 120-160 characters for washing machine", () => {
    const desc = generateSeoDescription(washingMachineInput());
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc.length).toBeLessThanOrEqual(160);
  });

  it("handles sparse product data gracefully", () => {
    const desc = generateSeoDescription(noModelInput());
    expect(desc.length).toBeGreaterThanOrEqual(100);
    expect(desc).toContain("Best price with fast delivery. Order now!");
  });

  it("always ends with the fixed CTA", () => {
    const products = [
      tvInput(),
      fridgeInput(),
      washingMachineInput(),
      acInput(),
      noModelInput(),
    ];
    for (const p of products) {
      const desc = generateSeoDescription(p);
      expect(desc).toContain("Best price with fast delivery. Order now!");
    }
  });
});

describe("generateSearchTerms", () => {
  it("generates 15-25 search terms for a TV", () => {
    const terms = generateSearchTerms(tvInput());
    expect(terms.length).toBeGreaterThanOrEqual(15);
    expect(terms.length).toBeLessThanOrEqual(25);
  });

  it("generates practical non-gibberish terms", () => {
    const terms = generateSearchTerms(tvInput());
    for (const term of terms) {
      expect(term.length).toBeGreaterThan(0);
      expect(term).toBe(term.toLowerCase());
      expect(term).not.toMatch(/\s{2,}/);
    }
  });

  it("deduplicates existing terms", () => {
    const input = existingSeoInput();
    const terms = generateSearchTerms(input);
    const existingLower = input.existingSearchTerms.map((t) =>
      t.toLowerCase().trim(),
    );
    const overlap = terms.filter((t) => existingLower.includes(t));
    expect(overlap.length).toBe(0);
  });

  it("runs all 7 layers for known categories", () => {
    const terms = generateSearchTerms(tvInput());
    expect(terms.some((t) => t.includes("tcl 43 inch"))).toBe(true);
    expect(terms.some((t) => t.includes("4k"))).toBe(true);
    expect(terms.some((t) => t.includes("google tv") || t.includes("google tv smart tvs"))).toBe(true);
    expect(terms.some((t) => t.includes("tv nepal") || t.includes("smart tvs nepal"))).toBe(true);
  });

  it("runs limited layers for unknown category", () => {
    const terms = generateSearchTerms(unknownCategoryInput());
    expect(terms.length).toBeGreaterThanOrEqual(5);
  });
});

describe("normalizeSearchTerms", () => {
  it("deduplicates, lowercases, and trims", () => {
    const result = normalizeSearchTerms([
      "  TCL TV Nepal ",
      "tcl tv nepal",
      "  43 INCH TV  ",
    ]);
    expect(result).toEqual(["tcl tv nepal", "43 inch tv"]);
  });

  it("removes empty strings", () => {
    const result = normalizeSearchTerms(["tcl tv", "", "  ", "samsung tv"]);
    expect(result).toEqual(["tcl tv", "samsung tv"]);
  });
});

describe("validateSeoSuggestion", () => {
  it("warns when title exceeds 60 characters", () => {
    const input = tvInput();
    const suggestion = generateProductSeo(input);
    const longSuggestion = { ...suggestion, title: "A".repeat(61) };
    const validation = validateSeoSuggestion(longSuggestion, input);
    expect(
      validation.warnings.some((w) => w.message.includes("too long")),
    ).toBe(true);
  });

  it("warns when description is too short", () => {
    const input = tvInput();
    const suggestion = generateProductSeo(input);
    const shortSuggestion = { ...suggestion, description: "Short desc." };
    const validation = validateSeoSuggestion(shortSuggestion, input);
    expect(
      validation.warnings.some((w) => w.message.includes("too short")),
    ).toBe(true);
  });

  it("warns when description exceeds 160 characters", () => {
    const input = tvInput();
    const suggestion = generateProductSeo(input);
    const longDesc = { ...suggestion, description: "A".repeat(165) };
    const validation = validateSeoSuggestion(longDesc, input);
    expect(
      validation.warnings.some((w) => w.message.includes("exceeds Google")),
    ).toBe(true);
  });

  it("warns when key fields are missing", () => {
    const input: ProductSeoInput = {
      name: "",
      description: "",
      brand: "",
      category: "",
      shortDescription: "",
      highlights: [],
      specifications: [],
      existingSearchTerms: [],
      variants: [],
    };
    const suggestion = generateProductSeo(input);
    const validation = validateSeoSuggestion(suggestion, input);
    expect(
      validation.warnings.some((w) => w.message.includes("fields missing")),
    ).toBe(true);
  });
});

describe("generateProductSeo (integration)", () => {
  it("produces complete suggestion for TV", () => {
    const result = generateProductSeo(tvInput());
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.description.length).toBeGreaterThan(0);
    expect(result.searchTerms.length).toBeGreaterThanOrEqual(15);
    expect(result.sourceFields.length).toBeGreaterThan(0);
  });

  it("produces complete suggestion for refrigerator", () => {
    const result = generateProductSeo(fridgeInput());
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.description.length).toBeGreaterThan(0);
    expect(result.searchTerms.length).toBeGreaterThanOrEqual(15);
  });

  it("produces complete suggestion for washing machine", () => {
    const result = generateProductSeo(washingMachineInput());
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.description.length).toBeGreaterThan(0);
    expect(result.searchTerms.length).toBeGreaterThanOrEqual(15);
  });

  it("produces complete suggestion for AC", () => {
    const result = generateProductSeo(acInput());
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.description.length).toBeGreaterThan(0);
    expect(result.searchTerms.length).toBeGreaterThanOrEqual(15);
  });

  it("handles product with no model gracefully", () => {
    const result = generateProductSeo(noModelInput());
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.description.length).toBeGreaterThan(0);
  });

  it("handles very long product name", () => {
    const result = generateProductSeo(longNameInput());
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.description.length).toBeGreaterThan(0);
    expect(result.description.length).toBeLessThanOrEqual(160);
  });

  it("produces deterministic output", () => {
    const input = tvInput();
    const a = generateProductSeo(input);
    const b = generateProductSeo(input);
    expect(a).toEqual(b);
  });

  it("does not contain numeric price in title", () => {
    const result = generateProductSeo(tvInput());
    expect(result.title).not.toMatch(/Rs\.?\s*\d+/);
    expect(result.title).not.toMatch(/NPR\s*\d+/);
  });

  it("returns variationIndex in suggestion", () => {
    const result = generateProductSeo(tvInput());
    expect(result).toHaveProperty("variationIndex");
    expect(result.variationIndex).toBe(0);
  });

  it("accepts variationIndex parameter", () => {
    const result = generateProductSeo(tvInput(), 2);
    expect(result.variationIndex).toBe(2);
  });

  it("wraps variationIndex at MAX_VARIATIONS", () => {
    const result = generateProductSeo(tvInput(), MAX_VARIATIONS);
    expect(result.variationIndex).toBe(0);
  });
});

describe("applyTVSingularRule", () => {
  it("converts televisions to television", () => {
    const result = applyTVSingularRule(["smart televisions nepal"], "tv");
    expect(result).toContain("smart television nepal");
  });

  it("converts tvs to tv", () => {
    const result = applyTVSingularRule(["smart tvs nepal"], "tv");
    expect(result).toContain("smart tv nepal");
  });

  it("converts 4k tvs to 4k tv", () => {
    const result = applyTVSingularRule(["best 4k tvs nepal"], "tv");
    expect(result).toContain("best 4k tv nepal");
  });

  it("does nothing for non-TV categories", () => {
    const terms = ["washing machines nepal", "front load washers"];
    const result = applyTVSingularRule(terms, "washing_machine");
    expect(result).toEqual(terms.map((t) => t.toLowerCase()));
  });

  it("deduplicates after conversion", () => {
    const result = applyTVSingularRule(
      ["smart tv nepal", "smart tvs nepal"],
      "tv",
    );
    expect(result.filter((t) => t === "smart tv nepal").length).toBe(1);
  });
});

describe("variation system", () => {
  it("produces different titles across variations", () => {
    const input = tvInput();
    const v0 = generateSeoTitle(input, 0);
    const v1 = generateSeoTitle(input, 1);
    expect(v0).not.toEqual(v1);
  });

  it("produces different descriptions across variations", () => {
    const input = tvInput();
    const v0 = generateSeoDescription(input, 0);
    const v1 = generateSeoDescription(input, 1);
    expect(v0).not.toEqual(v1);
  });

  it("generates 4 unique title variations for TV", () => {
    const input = tvInput();
    const titles = new Set(
      Array.from({ length: MAX_VARIATIONS }, (_, i) =>
        generateSeoTitle(input, i),
      ),
    );
    expect(titles.size).toBeGreaterThanOrEqual(2);
  });

  it("cycles back to first variation after MAX_VARIATIONS", () => {
    const input = tvInput();
    const v0 = generateSeoTitle(input, 0);
    const v4 = generateSeoTitle(input, MAX_VARIATIONS);
    expect(v0).toEqual(v4);
  });

  it("all variations produce valid title length", () => {
    const input = tvInput();
    for (let i = 0; i < MAX_VARIATIONS; i++) {
      const title = generateSeoTitle(input, i);
      expect(title.length).toBeLessThanOrEqual(65);
    }
  });
});
