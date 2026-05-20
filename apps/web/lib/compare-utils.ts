import type { StoreProduct } from "@/lib/store-products";

// --- Category Normalization ---

const CATEGORY_MAP: Record<string, string> = {
  "refrigerators": "refrigerator",
  "refrigerator": "refrigerator",
  "fridge": "refrigerator",
  "fridges": "refrigerator",
  "double-door refrigerators": "refrigerator",
  "single-door refrigerators": "refrigerator",
  "smart tvs": "tv",
  "smart tv": "tv",
  "tv": "tv",
  "tvs": "tv",
  "television": "tv",
  "televisions": "tv",
  "washing machines": "washing-machine",
  "washing machine": "washing-machine",
  "washer": "washing-machine",
  "laundry": "washing-machine",
  "freezers": "freezer",
  "freezer": "freezer",
  "chest freezer": "freezer",
  "deep freezer": "freezer",
  "water dispenser": "water-dispenser",
  "water dispensers": "water-dispenser",
  "dispenser": "water-dispenser",
  "kitchen appliance": "kitchen-appliance",
  "kitchen appliances": "kitchen-appliance",
  "rice cooker": "kitchen-appliance",
  "mixer": "kitchen-appliance",
};

export function normalizeCategory(category: string): string {
  return CATEGORY_MAP[category.toLowerCase().trim()] ?? category.toLowerCase().trim();
}

export function getCategoryDisplayName(normalized: string): string {
  const names: Record<string, string> = {
    refrigerator: "Refrigerators",
    tv: "Televisions",
    "washing-machine": "Washing Machines",
    freezer: "Freezers",
    "water-dispenser": "Water Dispensers",
    "kitchen-appliance": "Kitchen Appliances",
  };
  return names[normalized] ?? normalized;
}

export function getCategoryComparisonTitle(normalized: string): string {
  const titles: Record<string, string> = {
    refrigerator: "Refrigerator Comparison",
    tv: "Television Comparison",
    "washing-machine": "Washing Machine Comparison",
    freezer: "Freezer Comparison",
    "water-dispenser": "Water Dispenser Comparison",
    "kitchen-appliance": "Kitchen Appliance Comparison",
  };
  return titles[normalized] ?? "Product Comparison";
}

// --- Spec Definitions ---

export type SpecRow = { key: string; label: string };

const TV_SPECS: SpecRow[] = [
  { key: "displayType", label: "Display Type" },
  { key: "screenSize", label: "Screen Size" },
  { key: "resolution", label: "Resolution" },
  { key: "smartTv", label: "Smart TV" },
  { key: "ports", label: "Ports" },
  { key: "warranty", label: "Warranty" },
];

const REFRIGERATOR_SPECS: SpecRow[] = [
  { key: "capacity", label: "Capacity" },
  { key: "doorType", label: "Door Type" },
  { key: "color", label: "Color" },
  { key: "compressorType", label: "Compressor Type" },
  { key: "warranty", label: "Warranty" },
];

const WASHING_MACHINE_SPECS: SpecRow[] = [
  { key: "capacity", label: "Capacity" },
  { key: "loadType", label: "Load Type" },
  { key: "washPrograms", label: "Wash Programs" },
  { key: "motorType", label: "Motor Type" },
  { key: "spinSpeed", label: "Spin Speed" },
  { key: "warranty", label: "Warranty" },
];

const FREEZER_SPECS: SpecRow[] = [
  { key: "capacity", label: "Capacity" },
  { key: "type", label: "Type" },
  { key: "energyRating", label: "Energy Rating" },
  { key: "defrostSystem", label: "Defrost System" },
  { key: "warranty", label: "Warranty" },
];

const GENERIC_SPECS: SpecRow[] = [
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category" },
  { key: "keyFeature", label: "Key Feature" },
  { key: "warranty", label: "Warranty" },
  { key: "availability", label: "Availability" },
];

export function getSpecsForCategory(normalized: string): SpecRow[] {
  switch (normalized) {
    case "tv": return TV_SPECS;
    case "refrigerator": return REFRIGERATOR_SPECS;
    case "washing-machine": return WASHING_MACHINE_SPECS;
    case "freezer": return FREEZER_SPECS;
    default: return GENERIC_SPECS;
  }
}

// --- Product Spec Data (derived from existing product info) ---

type ProductSpecs = Record<string, string | boolean>;

const PRODUCT_SPECS: Record<string, ProductSpecs> = {
  "samsung-253l-double-door-refrigerator": {
    capacity: "253 Litres", doorType: "Double Door", color: "Silver",
    compressorType: "Digital Inverter", warranty: "10 Year Warranty",
  },
  "samsung-192l-single-door-refrigerator": {
    capacity: "192 Litres", doorType: "Single Door", color: "Silver",
    compressorType: "Digital Inverter", warranty: "—",
  },
  "himstar-chest-freezer-170": {
    capacity: "170 Litres", type: "Chest Freezer",
    energyRating: "Energy Efficient", defrostSystem: "—", warranty: "—",
  },
  "samsung-65-crystal-uhd-tv": {
    displayType: "Crystal UHD", screenSize: "65 inch", resolution: "4K Ultra HD",
    smartTv: true, ports: "—", warranty: "—",
  },
  "godrej-rdedge-205bxp-190l": {
    capacity: "190 Litres", doorType: "Single Door", color: "Wine",
    compressorType: "—", warranty: "10 Year Compressor Warranty",
  },
  "himstar-hr-21d92brj-190l": {
    capacity: "190 Litres", doorType: "Single Door", color: "Maroon",
    compressorType: "—", warranty: "10 Year Compressor Warranty",
  },
  "samsung-rr20c2z226u-192l": {
    capacity: "192 Litres", doorType: "Single Door", color: "Mystic Overlay Blue",
    compressorType: "Digital Inverter", warranty: "—",
  },
  "godrej-rdemarvel-207c-190l": {
    capacity: "190 Litres", doorType: "Single Door", color: "Wine",
    compressorType: "—", warranty: "—",
  },
  "himstar-hr-210bhn": {
    capacity: "192 Litres", doorType: "Single Door", color: "—",
    compressorType: "—", warranty: "—",
  },
  "samsung-rt40h28wnpim-253l": {
    capacity: "253 Litres (236L Net)", doorType: "Double Door (Top Mount)",
    color: "Silver", compressorType: "Digital Inverter", warranty: "—",
  },
  "himstar-hw-80fs8btkgz-8kg": {
    capacity: "8 KG", loadType: "Front Load", washPrograms: "Fully Automatic",
    motorType: "Inverter Motor", spinSpeed: "1400 RPM", warranty: "10 Year Motor Warranty",
  },
  "tcl-43v6b-43-inch-4k-smart-tv": {
    displayType: "LED", screenSize: "43 inch", resolution: "4K Ultra HD",
    smartTv: true, ports: "HDMI 2.1 with eARC", warranty: "—",
  },
  "samsung-ua55cu7700-55-inch-crystal-ultra-hd-4k-smart-tv": {
    displayType: "Crystal Ultra HD", screenSize: "55 inch", resolution: "4K Ultra HD",
    smartTv: true, ports: "—", warranty: "—",
  },
};

export function getSpecValue(product: StoreProduct, specKey: string): string {
  const specs = PRODUCT_SPECS[product.slug];
  const specValue = specs?.[specKey];
  if (typeof specValue === "boolean") return specValue ? "Yes" : "No";
  if (specValue) return specValue;

  // Generic fallback for brand/category/availability
  if (specKey === "brand") return product.brand;
  if (specKey === "category") return product.category;
  if (specKey === "availability") return product.status ?? "—";
  if (specKey === "keyFeature") return product.shortDescription.split("|")[0]?.trim() ?? "—";

  return "—";
}

export const MAX_COMPARE_ITEMS = 3;
