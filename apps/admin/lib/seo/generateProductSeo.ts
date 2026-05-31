import type { ProductSpecificationGroup, ProductVariantGroup } from "../admin/types";

export const MAX_VARIATIONS = 4;

export interface ProductSeoInput {
  name: string;
  description: string;
  brand: string;
  category: string;
  shortDescription: string;
  highlights: string[];
  specifications: ProductSpecificationGroup[];
  existingSearchTerms: string[];
  variants: ProductVariantGroup[];
}

export interface ProductSeoSuggestion {
  title: string;
  description: string;
  searchTerms: string[];
  sourceFields: string[];
  variationIndex: number;
}

export interface SeoWarning {
  type: "warning" | "error" | "info";
  message: string;
}

export interface SeoValidation {
  valid: boolean;
  warnings: SeoWarning[];
}

export interface ProductAttributes {
  model: string | null;
  screenSize: string | null;
  capacity: string | null;
  tonnage: string | null;
  features: string[];
  categoryType: string;
  brand: string;
}

const BRAND_MODEL_REGEX = /[A-Z0-9][A-Z0-9-]+[/][A-Z0-9-]+(?:\s*\/\s*[A-Z0-9-]+)*\b/;
const MODEL_SUFFIX_REGEX = /\b([A-Z0-9][A-Z0-9-]{2,10}(?:\/[A-Z0-9-]+)*)\s*$/;
const SCREEN_SIZE_REGEX = /(\d{2})\s*(?:["\u201C\u201D]|inch\b|inch\b)/i;
const CAPACITY_L_REGEX = /(\d+(?:\.\d+)?)\s*(?:l\b|ltr\b|litre\b|liters?\b)/i;
const CAPACITY_KG_REGEX = /(\d+(?:\.\d+)?)\s*(?:kg\b|kg\b)/i;
const TONNAGE_REGEX = /(\d+(?:\.\d+)?)\s*(?:ton\b|tonne\b|tr\b)/i;
const MODEL_IN_NAME_REGEX = /\b([A-Z0-9]{3,15}(?:\/[A-Z0-9-]+)*)\b/g;

const CATEGORY_TV = /tv|television|display|monitor/i;
const CATEGORY_REFRIGERATOR = /refrigerator|fridge|freezer|freez/i;
const CATEGORY_WASHING_MACHINE = /washing\s*machine|washer|laundry/i;
const CATEGORY_AC = /\bac\b|air\s*condition(er|ing)|inverter\s*ac/i;
const CATEGORY_MICROWAVE = /microwave|oven/i;
const CATEGORY_COOKTOP = /induction|cooktop|cooker|stove/i;
const CATEGORY_WATER_DISPENSER = /water\s*dispenser|dispenser/i;
const CATEGORY_VACUUM = /vacuum|vac/i;
const CATEGORY_MIXER = /mixer|grinder|blender|juicer/i;

const RESOLUTION_KEYWORDS = [
  { label: "8K", pattern: /\b8k\b/i },
  { label: "4K", pattern: /\b4k\b/i },
  { label: "UHD", pattern: /\buhd\b/i },
  { label: "FHD", pattern: /\bfull\s*hd\b|\bfhd\b/i },
  { label: "HD", pattern: /\bhd\b/i },
];

const SMART_PLATFORM_KEYWORDS = [
  { label: "Google TV", pattern: /\bgoogle\s*tv\b/i },
  { label: "Android TV", pattern: /\bandroid\s*tv\b/i },
  { label: "Smart TV", pattern: /\bsmart\s*tv\b/i },
  { label: "Fire TV", pattern: /\bfire\s*tv\b/i },
  { label: "Tizen", pattern: /\btizen\b/i },
  { label: "webOS", pattern: /\bweb\s*os\b|\bwebos\b/i },
];

const DOOR_TYPE_KEYWORDS = [
  "single door",
  "double door",
  "side-by-side",
  "french door",
  "top mount",
  "bottom mount",
];

const LOAD_TYPE_KEYWORDS = [
  { label: "front load", pattern: /\bfront\s*load\b/i },
  { label: "top load", pattern: /\btop\s*load\b/i },
];

const WASH_MODE_KEYWORDS = [
  { label: "fully automatic", pattern: /\b(fully\s*)?automatic\b/i },
  { label: "semi automatic", pattern: /\bsemi[\s-]automatic\b/i },
];

const AC_TYPE_KEYWORDS = [
  { label: "Inverter", pattern: /\binverter\b/i },
  { label: "Non-inverter", pattern: /\bnon[\s-]inverter\b/i },
];

const AC_FORM_KEYWORDS = [
  { label: "Split", pattern: /\bsplit\b/i },
  { label: "Window", pattern: /\bwindow\b/i },
  { label: "Cassette", pattern: /\bcassette\b/i },
];

const CATEGORY_ALTERNATES: Record<string, string[]> = {
  television: ["tv", "led tv", "smart tv", "4k tv"],
  refrigerator: ["fridge", "refrigerator", "deep freezer", "freezer"],
  "washing machine": ["washing machine", "washer", "laundry machine"],
  "air conditioner": ["ac", "air conditioner", "aircon", "split ac"],
  microwave: ["microwave", "microwave oven", "oven"],
  "induction cooktop": ["induction cooktop", "induction cooker", "cooktop"],
  "water dispenser": ["water dispenser", "water cooler", "dispenser"],
  "vacuum cleaner": ["vacuum cleaner", "vacuum", "vac"],
  "mixer grinder": ["mixer grinder", "mixer", "grinder", "blender"],
};

const TV_TITLE_TEMPLATES = [
  (b: string, m: string, sz: string, res: string, plat: string) =>
    `${b}${m ? " " + m : ""}${sz ? ' "' + sz : ""}${res ? " " + res : ""} Smart TV - Buy Online Nepal`,
  (b: string, m: string, sz: string, res: string, plat: string) =>
    `${b}${sz ? " " + sz : ""}${res ? " " + res : ""}${plat ? " " + plat : ""} TV Price in Nepal`,
  (b: string, m: string, sz: string, res: string, plat: string) =>
    `Buy ${b}${m ? " " + m : ""}${plat ? " " + plat : ""} TV${sz ? " " + sz : ""} in Nepal`,
  (b: string, m: string, sz: string, res: string, plat: string) =>
    `${b}${res ? " " + res : ""}${plat ? " " + plat : ""} TV${sz ? " " + sz.replace(/^(\d+)\s*inch/, "$1-Inch") : ""} - Nepal Price`,
];

const FRIDGE_TITLE_TEMPLATES = [
  (b: string, m: string, cap: string, door: string, inv: string) =>
    `${b} ${cap}L${door ? " " + door : ""} Refrigerator - Buy Online Nepal`,
  (b: string, m: string, cap: string, door: string, inv: string) =>
    `${b}${m ? " " + m : ""} ${cap}L Fridge Price in Nepal`,
  (b: string, m: string, cap: string, door: string, inv: string) =>
    `Buy ${b}${door ? " " + door : ""} ${cap}L Refrigerator in Nepal`,
  (b: string, m: string, cap: string, door: string, inv: string) =>
    `${b} ${cap} Liter${inv ? " " + inv : ""} Fridge - Nepal Price`,
];

const WM_TITLE_TEMPLATES = [
  (b: string, m: string, cap: string, load: string, mode: string) =>
    `${b} ${cap}${load ? " " + load : ""} Washing Machine - Buy Online Nepal`,
  (b: string, m: string, cap: string, load: string, mode: string) =>
    `${b} ${cap}${load ? " " + load : ""}${mode ? " " + mode : ""} Washing Machine Price in Nepal`,
  (b: string, m: string, cap: string, load: string, mode: string) =>
    `Buy ${b}${mode ? " " + mode : ""} Washing Machine${cap ? " " + cap : ""}${load ? " " + load : ""} in Nepal`,
  (b: string, m: string, cap: string, load: string, mode: string) =>
    `${b} ${cap}${mode ? " " + mode : ""} Washer${load ? " " + load : ""} - Nepal Price`,
];

const AC_TITLE_TEMPLATES = [
  (b: string, m: string, ton: string, inv: string, form: string) =>
    `${b} ${ton}${inv ? " " + inv : ""}${form ? " " + form : ""} AC - Buy Online Nepal`,
  (b: string, m: string, ton: string, inv: string, form: string) =>
    `${b} ${ton}${form ? " " + form : ""}${inv ? " " + inv : ""} AC Price in Nepal`,
  (b: string, m: string, ton: string, inv: string, form: string) =>
    `Buy ${b} ${ton}${inv ? " " + inv : ""} AC${form ? " " + form : ""} in Nepal`,
  (b: string, m: string, ton: string, inv: string, form: string) =>
    `${b} ${ton}${form ? " " + form : ""} Air Conditioner - Nepal Price`,
];

const UNKNOWN_TITLE_TEMPLATES = [
  (b: string, m: string, cap: string, cat: string) =>
    `${b}${m ? " " + m : ""}${cap ? " " + cap : ""} ${cat} - Buy Online Nepal`,
  (b: string, m: string, cap: string, cat: string) =>
    `${b}${cap ? " " + cap : ""} ${cat}${m ? " " + m : ""} Price in Nepal`,
  (b: string, m: string, cap: string, cat: string) =>
    `Buy ${b} ${cat}${m ? " " + m : ""}${cap ? " " + cap : ""} in Nepal`,
  (b: string, m: string, cap: string, cat: string) =>
    `${b} ${cat}${cap ? " " + cap : ""} - Best Price Nepal`,
];

const tvLine2Variants = [
  (sz: string, res: string, plat: string) =>
    `Features a${sz ? " " + sz : ""}${res ? " " + res : ""} display${plat ? " with " + plat : ""}.`,
  (sz: string, res: string, plat: string) =>
    `Enjoy${res ? " " + res : ""} picture quality on${sz ? " a " + sz : ""} screen${plat ? " with " + plat : ""}.`,
  (sz: string, res: string, plat: string) =>
    `Powered by${plat ? " " + plat : ""} with stunning${res ? " " + res : ""} visuals${sz ? " on " + sz : ""}.`,
];

const fridgeLine2Variants = [
  (cap: string, door: string, inv: string) =>
    `Offers${cap ? " " + cap + "L" : ""}${door ? " " + door : ""} storage${inv ? " with " + inv + " technology" : ""}.`,
  (cap: string, door: string, inv: string) =>
    `A${cap ? " " + cap : ""}-litre${door ? " " + door : ""} fridge built for energy-efficient cooling.`,
  (cap: string, door: string, inv: string) =>
    `${cap ? cap + "L" : ""} capacity with${door ? " " + door : ""} design${inv ? " and " + inv + " compressor" : ""}.`,
];

const wmLine2Variants = [
  (cap: string, load: string, mode: string) =>
    `Offers${cap ? " " + cap : ""}${mode ? " " + mode : ""} washing${load ? " with " + load + " design" : ""}.`,
  (cap: string, load: string, mode: string) =>
    `A${cap ? " " + cap : ""}${load ? " " + load : ""} washer${mode ? ", " + mode : ""} for efficient laundry care.`,
  (cap: string, load: string, mode: string) =>
    `${cap ? cap + " " : ""}${load ? load + " " : ""}washer with powerful cleaning${mode ? " and " + mode + " operation" : ""}.`,
];

const acLine2Variants = [
  (ton: string, inv: string, form: string) =>
    `Powerful${ton ? " " + ton : ""} cooling${inv ? " with " + inv : ""}${form ? " " + form + " design" : ""}.`,
  (ton: string, inv: string, form: string) =>
    `Stay comfortable with${ton ? " " + ton : ""}${inv ? " " + inv : ""} cooling${form ? " in a " + form + " format" : ""}.`,
  (ton: string, inv: string, form: string) =>
    `${inv ? inv + " " : ""}${form ? form + " " : ""}AC${ton ? " with " + ton : ""} for efficient room cooling.`,
];

const unknownLine2Variants = [
  () => `Shop online for the best deals on this product.`,
  () => `High quality product available at the best price in Nepal.`,
  () => `Get the best price with reliable delivery across Nepal.`,
];

const layerWeights: Record<number, Record<string, number>> = {
  0: { L1: 5, L2: 5, L3: 4, L4: 3, L5: 3, L6: 3, L7: 5 },
  1: { L1: 5, L2: 3, L3: 5, L4: 2, L5: 2, L6: 2, L7: 7 },
  2: { L1: 4, L2: 6, L3: 3, L4: 4, L5: 2, L6: 4, L7: 4 },
  3: { L1: 3, L2: 3, L3: 3, L4: 5, L5: 5, L6: 5, L7: 3 },
};

const tvPluralPatterns: [RegExp, string][] = [
  [/\btelevisions\b/gi, 'television'],
  [/\btvs\b/gi, 'tv'],
  [/\bsmart tvs\b/gi, 'smart tv'],
  [/\bled tvs\b/gi, 'led tv'],
  [/\boled tvs\b/gi, 'oled tv'],
  [/\bqled tvs\b/gi, 'qled tv'],
  [/\bgoogle tvs\b/gi, 'google tv'],
  [/\bandroid tvs\b/gi, 'android tv'],
  [/\b4k tvs\b/gi, '4k tv'],
  [/\buhd tvs\b/gi, 'uhd tv'],
  [/\bfhd tvs\b/gi, 'fhd tv'],
  [/\bflat screen tvs\b/gi, 'flat screen tv'],
];

function extractModel(name: string): string | null {
  const brandMatch = name.match(BRAND_MODEL_REGEX);
  if (brandMatch) return brandMatch[0];
  const suffixMatch = name.match(MODEL_SUFFIX_REGEX);
  if (suffixMatch) return suffixMatch[1];
  const matches = name.match(MODEL_IN_NAME_REGEX);
  if (matches) {
    const filtered = matches.filter((m) => {
      const lower = m.toLowerCase();
      if (["4K", "8K", "UHD", "FHD", "HD", "LED", "LCD", "OLED", "QLED"].includes(m)) return false;
      if (lower === "tv" || lower === "ac" || lower === "kg" || lower === "l") return false;
      if (/^\d+$/.test(m) && parseInt(m) < 100) return false;
      return true;
    });
    if (filtered.length > 0) return filtered[0];
  }
  return null;
}

function extractScreenSize(name: string, highlights: string[], specs: ProductSpecificationGroup[]): string | null {
  const nameMatch = name.match(SCREEN_SIZE_REGEX);
  if (nameMatch) return `${nameMatch[1]} inch`;
  for (const h of highlights) {
    const m = h.match(SCREEN_SIZE_REGEX);
    if (m) return `${m[1]} inch`;
  }
  for (const group of specs) {
    for (const spec of group.specs) {
      const m = spec.value.match(/(\d+)\s*(?:["\u201C\u201D]|inch)/i);
      if (m) return `${m[1]} inch`;
      if (/screen|display|size/i.test(spec.label) && spec.value.match(/\d+/)) {
        const n = spec.value.match(/(\d+)/);
        if (n) return `${n[1]} inch`;
      }
    }
  }
  return null;
}

function extractCapacity(name: string, highlights: string[], specs: ProductSpecificationGroup[], category: string): string | null {
  const isFridge = CATEGORY_REFRIGERATOR.test(category);
  const isWasher = CATEGORY_WASHING_MACHINE.test(category);
  const isMicrowave = CATEGORY_MICROWAVE.test(category);
  const isCooktop = CATEGORY_COOKTOP.test(category);
  const isDispenser = CATEGORY_WATER_DISPENSER.test(category);

  if (isFridge || isMicrowave || isDispenser || isCooktop) {
    const nameMatch = name.match(CAPACITY_L_REGEX);
    if (nameMatch) return `${nameMatch[1]}L`;
    for (const h of highlights) {
      const m = h.match(CAPACITY_L_REGEX);
      if (m) return `${m[1]}L`;
    }
    for (const group of specs) {
      for (const spec of group.specs) {
        const m = spec.value.match(CAPACITY_L_REGEX);
        if (m) return `${m[1]}L`;
        if (/capacity|volume/i.test(spec.label) && spec.value.match(/\d+/)) {
          const n = spec.value.match(/(\d+)/);
          if (n) return `${n[1]}L`;
        }
      }
    }
  }

  if (isWasher) {
    const nameMatch = name.match(CAPACITY_KG_REGEX);
    if (nameMatch) return `${nameMatch[1]}KG`;
    for (const h of highlights) {
      const m = h.match(CAPACITY_KG_REGEX);
      if (m) return `${m[1]}KG`;
    }
    for (const group of specs) {
      for (const spec of group.specs) {
        const m = spec.value.match(CAPACITY_KG_REGEX);
        if (m) return `${m[1]}KG`;
        if (/capacity|wash/i.test(spec.label) && spec.value.match(/\d+/)) {
          const n = spec.value.match(/(\d+)/);
          if (n) return `${n[1]}KG`;
        }
      }
    }
  }

  return null;
}

function extractTonnage(name: string, highlights: string[], specs: ProductSpecificationGroup[]): string | null {
  const nameMatch = name.match(TONNAGE_REGEX);
  if (nameMatch) return `${nameMatch[1]} Ton`;
  for (const h of highlights) {
    const m = h.match(TONNAGE_REGEX);
    if (m) return `${m[1]} Ton`;
  }
  for (const group of specs) {
    for (const spec of group.specs) {
      const m = spec.value.match(TONNAGE_REGEX);
      if (m) return `${m[1]} Ton`;
      if (/tonnage|capacity|power/i.test(spec.label) && spec.value.match(/\d+\.?\d*\s*(?:ton|tr)/i)) {
        const n = spec.value.match(/(\d+(?:\.\d+)?)/);
        if (n) return `${n[1]} Ton`;
      }
    }
  }
  return null;
}

function extractFeatures(name: string, highlights: string[], specs: ProductSpecificationGroup[]): string[] {
  const features: string[] = [];
  const seen = new Set<string>();

  for (const keyword of RESOLUTION_KEYWORDS) {
    if (keyword.pattern.test(name) || highlights.some((h) => keyword.pattern.test(h))) {
      if (!seen.has(keyword.label)) {
        features.push(keyword.label);
        seen.add(keyword.label);
      }
    }
  }

  for (const keyword of SMART_PLATFORM_KEYWORDS) {
    if (keyword.pattern.test(name) || highlights.some((h) => keyword.pattern.test(h))) {
      if (!seen.has(keyword.label)) {
        features.push(keyword.label);
        seen.add(keyword.label);
      }
    }
  }

  for (const keyword of LOAD_TYPE_KEYWORDS) {
    if (keyword.pattern.test(name) || highlights.some((h) => keyword.pattern.test(h))) {
      if (!seen.has(keyword.label)) {
        features.push(keyword.label);
        seen.add(keyword.label);
      }
    }
  }

  for (const keyword of WASH_MODE_KEYWORDS) {
    if (keyword.pattern.test(name) || highlights.some((h) => keyword.pattern.test(h))) {
      if (!seen.has(keyword.label)) {
        features.push(keyword.label);
        seen.add(keyword.label);
      }
    }
  }

  for (const keyword of AC_TYPE_KEYWORDS) {
    if (keyword.pattern.test(name) || highlights.some((h) => keyword.pattern.test(h))) {
      if (!seen.has(keyword.label)) {
        features.push(keyword.label);
        seen.add(keyword.label);
      }
    }
  }

  for (const keyword of AC_FORM_KEYWORDS) {
    if (keyword.pattern.test(name) || highlights.some((h) => keyword.pattern.test(h))) {
      if (!seen.has(keyword.label)) {
        features.push(keyword.label);
        seen.add(keyword.label);
      }
    }
  }

  const doorType = DOOR_TYPE_KEYWORDS.find((dt) => {
    const lower = name.toLowerCase();
    return lower.includes(dt) || highlights.some((h) => h.toLowerCase().includes(dt));
  });
  if (doorType && !seen.has(doorType)) {
    features.push(doorType);
    seen.add(doorType);
  }

  for (const h of highlights) {
    const lower = h.toLowerCase();
    const short = h.length < 60 ? h : h.slice(0, 60).replace(/[,.:;!?].*$/, "");
    if (!seen.has(short) && !seen.has(lower)) {
      features.push(short);
      seen.add(short);
    }
  }

  return features;
}

function detectCategoryType(category: string): string {
  if (CATEGORY_TV.test(category)) return "tv";
  if (CATEGORY_REFRIGERATOR.test(category)) return "refrigerator";
  if (CATEGORY_WASHING_MACHINE.test(category)) return "washing_machine";
  if (CATEGORY_AC.test(category)) return "ac";
  if (CATEGORY_MICROWAVE.test(category)) return "microwave";
  if (CATEGORY_COOKTOP.test(category)) return "cooktop";
  if (CATEGORY_WATER_DISPENSER.test(category)) return "water_dispenser";
  if (CATEGORY_VACUUM.test(category)) return "vacuum_cleaner";
  if (CATEGORY_MIXER.test(category)) return "mixer_grinder";
  return "unknown";
}

function getAlternateCategoryNames(category: string): string[] {
  const lower = category.toLowerCase();
  for (const [key, alts] of Object.entries(CATEGORY_ALTERNATES)) {
    if (lower.includes(key) || key.includes(lower)) return alts;
  }
  return [lower];
}

export function normalizeSearchTerms(terms: string[]): string[] {
  return Array.from(
    new Set(
      terms
        .map((t) => t.toLowerCase().trim().replace(/\s+/g, " "))
        .filter((t) => t.length > 0),
    ),
  );
}

export function detectProductAttributes(input: ProductSeoInput): ProductAttributes {
  const name = input.name;
  const highlights = input.highlights ?? [];
  const specs = input.specifications ?? [];
  const category = input.category;

  return {
    model: extractModel(name),
    screenSize: extractScreenSize(name, highlights, specs),
    capacity: extractCapacity(name, highlights, specs, category),
    tonnage: extractTonnage(name, highlights, specs),
    features: extractFeatures(name, highlights, specs),
    categoryType: detectCategoryType(category),
    brand: input.brand,
  };
}

export function generateSeoTitle(input: ProductSeoInput, variationIndex = 0): string {
  const attrs = detectProductAttributes(input);
  const brand = attrs.brand || "";
  const model = attrs.model || "";
  const type = attrs.categoryType;
  const vi = variationIndex % MAX_VARIATIONS;

  let title = "";

  if (type === "tv") {
    const templates = TV_TITLE_TEMPLATES;
    const tpl = templates[vi % templates.length];
    const resolution = attrs.features.find((f) => /^(8K|4K|UHD|FHD|HD)$/i.test(f)) || "";
    const platform = attrs.features.find((f) => /google tv|android tv|smart tv|fire tv/i.test(f)) || "";
    title = tpl(brand, model, attrs.screenSize || "", resolution, platform);
  } else if (type === "refrigerator") {
    const templates = FRIDGE_TITLE_TEMPLATES;
    const tpl = templates[vi % templates.length];
    const doorType = attrs.features.find((f) => DOOR_TYPE_KEYWORDS.includes(f.toLowerCase())) || "";
    const door = doorType ? doorType.charAt(0).toUpperCase() + doorType.slice(1) : "";
    const inv = attrs.features.some((f) => /inverter/i.test(f)) ? "Inverter" : "";
    title = tpl(brand, model, attrs.capacity?.replace(/L$/, "") || "", door, inv);
  } else if (type === "washing_machine") {
    const templates = WM_TITLE_TEMPLATES;
    const tpl = templates[vi % templates.length];
    const loadType = attrs.features.find((f) => /front load|top load/i.test(f)) || "";
    const load = loadType ? loadType.charAt(0).toUpperCase() + loadType.slice(1) : "";
    const mode = attrs.features.find((f) => /automatic/i.test(f)) || "";
    const washMode = mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "";
    title = tpl(brand, model, attrs.capacity || "", load, washMode);
  } else if (type === "ac") {
    const templates = AC_TITLE_TEMPLATES;
    const tpl = templates[vi % templates.length];
    const inv = attrs.features.some((f) => /inverter/i.test(f)) ? "Inverter" : "";
    const acForm = attrs.features.find((f) => /split|window|cassette/i.test(f)) || "";
    const form = acForm ? acForm.charAt(0).toUpperCase() + acForm.slice(1) : "";
    title = tpl(brand, model, attrs.tonnage || "", inv, form);
  } else {
    const templates = UNKNOWN_TITLE_TEMPLATES;
    const tpl = templates[vi % templates.length];
    title = tpl(brand, model, attrs.capacity || "", input.category);
  }

  title = title.replace(/\s+/g, " ").trim();
  if (title.length > 65) {
    const words = title.split(" ");
    while (title.length > 65 && words.length > 3) {
      words.pop();
      title = words.join(" ").trim();
    }
    if (title.length > 65) title = title.slice(0, 62) + "...";
  }

  return title;
}

export function generateSeoDescription(input: ProductSeoInput, variationIndex = 0): string {
  const attrs = detectProductAttributes(input);
  const brand = attrs.brand || "";
  const name = input.name;
  const type = attrs.categoryType;
  const vi = variationIndex % MAX_VARIATIONS;

  const line3 = "Best price with fast delivery. Order now!";

  let phrasedName = name;
  if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
    phrasedName = name;
  }
  phrasedName = phrasedName.replace(/\s+/g, " ").trim();

  let line1 = `Buy ${phrasedName} in Nepal.`;
  if (line1.length > 110) {
    const shortened = phrasedName.length > 60 ? phrasedName.slice(0, 57) + "..." : phrasedName;
    line1 = `Buy ${shortened} in Nepal.`;
  }

  let line2 = "";
  const sz = attrs.screenSize || "";
  const res = attrs.features.find((f) => /^(8K|4K|UHD|FHD|HD)$/i.test(f)) || "";
  const plat = attrs.features.find((f) => /google tv|android tv|smart tv|fire tv/i.test(f)) || "";
  const cap = (attrs.capacity || "").replace(/L$|KG$/i, "");
  const door = attrs.features.find((f) => DOOR_TYPE_KEYWORDS.includes(f.toLowerCase())) || "";
  const inv = attrs.features.some((f) => /inverter/i.test(f)) ? "Inverter" : "";
  const load = attrs.features.find((f) => /front load|top load/i.test(f)) || "";
  const mode = attrs.features.find((f) => /automatic/i.test(f)) || "";
  const ton = attrs.tonnage || "";
  const form = attrs.features.find((f) => /split|window|cassette/i.test(f)) || "";
  const acInv = attrs.features.some((f) => /inverter/i.test(f)) ? "Inverter" : "";

  if (type === "tv") {
    const variants = tvLine2Variants;
    line2 = variants[vi % variants.length](sz, res, plat);
  } else if (type === "refrigerator") {
    const variants = fridgeLine2Variants;
    line2 = variants[vi % variants.length](cap, door, inv);
  } else if (type === "washing_machine") {
    const variants = wmLine2Variants;
    line2 = variants[vi % variants.length](cap, load, mode);
  } else if (type === "ac") {
    const variants = acLine2Variants;
    line2 = variants[vi % variants.length](ton, acInv, form);
  } else {
    const variants = unknownLine2Variants;
    line2 = variants[vi % variants.length]();
  }

  let full = `${line1} ${line2} ${line3}`;

  if (full.length > 160) {
    if (line2.length > 60) {
      line2 = line2.slice(0, 57) + "...";
    }
    full = `${line1} ${line2} ${line3}`;
  }

  if (full.length > 160) {
    const overflow = full.length - 160;
    if (line2.length > overflow + 5) {
      line2 = line2.slice(0, -overflow - 3) + "...";
    } else {
      line1 = line1.slice(0, -overflow - 3) + "...";
    }
    full = `${line1} ${line2} ${line3}`;
  }

  if (full.length > 160) {
    full = full.slice(0, 157) + "...";
  }

  return full;
}

function generateLayer1(attrs: ProductAttributes, input: ProductSeoInput, max: number): string[] {
  const terms: string[] = [];
  const name = input.name.toLowerCase().trim();
  const brand = attrs.brand.toLowerCase();
  const model = attrs.model || "";

  terms.push(name);
  if (model) {
    const bm = `${brand} ${model}`;
    terms.push(bm);
    terms.push(`${bm} price in nepal`);
    terms.push(`${bm} nepal`);
  }
  return terms.slice(0, max);
}

function generateLayer2(attrs: ProductAttributes, input: ProductSeoInput, max: number): string[] {
  const terms: string[] = [];
  const brand = attrs.brand.toLowerCase();
  const category = input.category.toLowerCase();
  const size = attrs.screenSize || attrs.capacity || "";

  terms.push(`${brand} ${category}`);

  if (size) {
    const sizeClean = size.toLowerCase().replace(/\s+/g, " ");
    terms.push(`${brand} ${sizeClean} ${category}`);
    terms.push(`${sizeClean} ${category} nepal`);
    terms.push(`${sizeClean} ${category} price in nepal`);
  }

  return terms.slice(0, max);
}

function generateLayer3(attrs: ProductAttributes, input: ProductSeoInput, max: number): string[] {
  const terms: string[] = [];
  const category = input.category.toLowerCase();
  const brand = attrs.brand.toLowerCase();

  for (const feature of attrs.features) {
    if (terms.length >= max) break;
    const f = feature.toLowerCase().trim();
    if (f.length > 30) continue;
    terms.push(`${f} ${category}`);
    terms.push(`${f} ${category} nepal`);
    terms.push(`${f} price in nepal`);
    if (brand && f.length < 20) {
      terms.push(`${brand} ${f} ${category}`);
    }
  }

  return terms.slice(0, max);
}

function generateLayer4(attrs: ProductAttributes, input: ProductSeoInput, max: number): string[] {
  const terms: string[] = [];
  const category = input.category.toLowerCase();

  terms.push(category);
  terms.push(`${category} nepal`);
  terms.push(`${category} price in nepal`);
  terms.push(`buy ${category} online nepal`);
  terms.push(`best ${category} nepal`);

  const alternates = getAlternateCategoryNames(input.category);
  for (const alt of alternates) {
    if (terms.length >= max) break;
    if (alt !== category) {
      terms.push(alt);
      terms.push(`${alt} nepal`);
    }
  }

  return terms.slice(0, max);
}

function generateLayer5(attrs: ProductAttributes, input: ProductSeoInput, max: number): string[] {
  const terms: string[] = [];
  const brand = attrs.brand.toLowerCase();
  const category = input.category.toLowerCase();
  const model = attrs.model || "";

  terms.push(`${brand} ${category} buy online`);
  terms.push(`${brand} ${category} online shopping nepal`);

  if (model && model.length <= 12) {
    terms.push(model.toLowerCase());
  }

  return terms.slice(0, max);
}

function generateLayer6(attrs: ProductAttributes, input: ProductSeoInput, max: number): string[] {
  const terms: string[] = [];
  const brand = attrs.brand.toLowerCase();
  const alternates = getAlternateCategoryNames(input.category);

  for (const alt of alternates) {
    if (terms.length >= max) break;
    if (alt !== input.category.toLowerCase()) {
      terms.push(`${alt} nepal`);
      terms.push(`${alt} ${brand}`);
    }
  }

  return terms.slice(0, max);
}

function generateLayer7(attrs: ProductAttributes, input: ProductSeoInput, max: number): string[] {
  const terms: string[] = [];
  const category = input.category.toLowerCase();
  const brand = attrs.brand.toLowerCase();
  const size = attrs.screenSize || "";
  const capacity = attrs.capacity || "";
  const tonnage = attrs.tonnage || "";

  const cleanFeatures = attrs.features
    .filter((f) => f.length < 30)
    .map((f) => f.toLowerCase().trim());

  if (size && cleanFeatures.length > 0) {
    terms.push(`${size} ${cleanFeatures[0]} ${category}`);
    if (cleanFeatures.length > 1) {
      terms.push(`${cleanFeatures[0]} ${cleanFeatures[1]} ${category} nepal`);
    }
  }

  if (capacity) {
    const doorType = cleanFeatures.find((f) => DOOR_TYPE_KEYWORDS.some((dt) => f.includes(dt)));
    if (doorType) {
      terms.push(`${capacity} ${doorType} ${category}`);
    }
  }

  if (tonnage) {
    const isInverter = cleanFeatures.some((f) => f.includes("inverter"));
    const acForm = cleanFeatures.find((f) => /split|window|cassette/i.test(f));
    if (isInverter && acForm) {
      terms.push(`${tonnage} inverter ${acForm} ${category}`);
    } else if (isInverter) {
      terms.push(`${tonnage} inverter ${category}`);
    }
  }

  if (brand && size && cleanFeatures.length > 0) {
    terms.push(`${brand} ${size} ${cleanFeatures[0]} ${category}`);
  }

  return terms.slice(0, max);
}

export function applyTVSingularRule(terms: string[], categoryType: string): string[] {
  if (categoryType !== "tv") return terms;

  const result = terms.map((term) => {
    let t = term;
    for (const [pattern, replacement] of tvPluralPatterns) {
      t = t.replace(pattern, replacement);
    }
    return t;
  });

  return normalizeSearchTerms(result);
}

export function generateSearchTerms(input: ProductSeoInput, variationIndex = 0): string[] {
  const attrs = detectProductAttributes(input);
  const vi = variationIndex % MAX_VARIATIONS;
  const weights = layerWeights[vi] ?? layerWeights[0];
  const existingSet = new Set(
    (input.existingSearchTerms ?? []).map((t) => t.toLowerCase().trim()),
  );

  const layerResults: string[][] = [];

  layerResults.push(generateLayer1(attrs, input, weights.L1));
  layerResults.push(generateLayer2(attrs, input, weights.L2));
  layerResults.push(generateLayer3(attrs, input, weights.L3));
  layerResults.push(generateLayer4(attrs, input, weights.L4));
  layerResults.push(generateLayer5(attrs, input, weights.L5));
  layerResults.push(generateLayer6(attrs, input, weights.L6));

  if (attrs.categoryType !== "unknown") {
    layerResults.push(generateLayer7(attrs, input, weights.L7));
  }

  const allTerms = normalizeSearchTerms(layerResults.flat());

  const uniqueTerms = allTerms.filter((t) => !existingSet.has(t));

  const ranked = uniqueTerms.sort((a, b) => {
    const aWords = a.split(" ").length;
    const bWords = b.split(" ").length;
    if (aWords !== bWords) return bWords - aWords;
    const aSpecific = a.includes("price") || a.includes("buy") ? 1 : 0;
    const bSpecific = b.includes("price") || b.includes("buy") ? 1 : 0;
    return bSpecific - aSpecific;
  });

  const singleWords = ranked.filter((t) => {
    const words = t.split(/\s+/);
    if (words.length === 1) {
      const lower = words[0];
      return attrs.brand.toLowerCase() === lower;
    }
    return true;
  });

  const afterSingular = applyTVSingularRule(singleWords, attrs.categoryType);

  const reDeduped = afterSingular.filter((t) => !existingSet.has(t));

  return reDeduped.slice(0, 25);
}

export function generateProductSeo(input: ProductSeoInput, variationIndex = 0): ProductSeoSuggestion {
  const title = generateSeoTitle(input, variationIndex);
  const description = generateSeoDescription(input, variationIndex);
  const searchTerms = generateSearchTerms(input, variationIndex);

  const sourceFields: string[] = ["name"];
  if (input.brand) sourceFields.push("brand");
  if (input.category) sourceFields.push("category");
  if (input.shortDescription) sourceFields.push("shortDescription");
  if ((input.highlights ?? []).length > 0) sourceFields.push("highlights");
  if ((input.specifications ?? []).length > 0) sourceFields.push("specifications");

  const attrs = detectProductAttributes(input);
  if (attrs.model) sourceFields.push("model");
  if (attrs.screenSize) sourceFields.push("screenSize");
  if (attrs.capacity) sourceFields.push("capacity");
  if (attrs.tonnage) sourceFields.push("tonnage");

  return { title, description, searchTerms, sourceFields, variationIndex: variationIndex % MAX_VARIATIONS };
}

export function validateSeoSuggestion(
  suggestion: ProductSeoSuggestion,
  input: ProductSeoInput,
): SeoValidation {
  const warnings: SeoWarning[] = [];

  if (suggestion.title.length > 60) {
    warnings.push({
      type: "warning",
      message: "Title is too long for Google preview",
    });
  }

  if (suggestion.description.length < 120) {
    warnings.push({
      type: "warning",
      message: "Description may be too short",
    });
  }

  if (suggestion.description.length > 160) {
    warnings.push({
      type: "error",
      message: "Description exceeds Google limit",
    });
  }

  const allWords = `${suggestion.title} ${suggestion.description}`
    .toLowerCase()
    .split(/\s+/);
  const wordFreq: Record<string, number> = {};
  for (const w of allWords) {
    if (w.length > 3) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  }
  const repeated = Object.entries(wordFreq).filter(([, count]) => count >= 3);
  if (repeated.length > 0) {
    warnings.push({
      type: "warning",
      message: "Possible keyword stuffing detected",
    });
  }

  const missingFields: string[] = [];
  if (!input.brand) missingFields.push("brand");
  if (!input.name) missingFields.push("name");
  if (!input.category) missingFields.push("category");

  if (missingFields.length > 0) {
    warnings.push({
      type: "info",
      message: `Some fields missing — results may be limited: ${missingFields.join(", ")}`,
    });
  }

  return { valid: warnings.filter((w) => w.type === "error").length === 0, warnings };
}
