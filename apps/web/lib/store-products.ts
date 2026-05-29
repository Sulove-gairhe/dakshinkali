export type StoreProductStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type ProductImage = {
  id: string;
  src: string;
  alt: string;
};

export type ProductDescriptionSection = {
  id: string;
  title: string;
  subtitle?: string;
  body?: string[];
  bullets?: string[];
  image?: ProductImage;
};

export type ProductSpecification = {
  label: string;
  value: string;
};

export type ProductSpecificationGroup = {
  title: string;
  specs: ProductSpecification[];
};

export type ProductVariantGroup = {
  label: string;
  options: { label: string; value: string; selected?: boolean }[];
};

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  currentPrice: string;
  oldPrice?: string;
  warranty: string;
  badge?: string;
  badges?: string[];
  ratingText?: string;
  href: string;
  brand: string;
  category: string;
  collection?: string;
  status?: StoreProductStatus;
  searchTerms?: string[];
  galleryImages?: ProductImage[];
  highlights?: string[];
  descriptionSections?: ProductDescriptionSection[];
  specifications?: ProductSpecificationGroup[];
  boxContents?: string[];
  deliveryInfo?: string[];
  relatedProductSlugs?: string[];
  variants?: ProductVariantGroup[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isActive?: boolean;
};

type StoreProductRecord = Omit<StoreProduct, "href"> & { href?: string };

export function getProductHref(product: Pick<StoreProduct, "slug">) {
  return `/products/${product.slug}`;
}

function withProductHrefs(
  products: StoreProductRecord[],
  defaults: Partial<
    Pick<StoreProduct, "isFeatured" | "isBestSeller" | "isNewArrival" | "isActive">
  > = {},
): StoreProduct[] {
  return products.map((product) => ({
    ...defaults,
    ...product,
    href: getProductHref(product),
  }));
}

export const trendingProducts: StoreProduct[] = withProductHrefs([
  {
    id: "1",
    slug: "samsung-253l-double-door-refrigerator",
    name: "Samsung 253L Double Door Frost Free Refrigerator RT28A3022GS/IM",
    shortDescription: "Digital Inverter | Energy Efficient | 10 Year Warranty",
    image: "/images/trending products/Samsung Double door 245 Litres.png",
    currentPrice: "Rs 51,999",
    oldPrice: "Rs 56,000",
    warranty: "10 Year Warranty",
    badge: "Rs 4,001 Off",
    href: "/products/samsung-253l-double-door-refrigerator",
    brand: "Samsung",
    category: "Double-Door Refrigerators",
    status: "In Stock",
    searchTerms: ["fridge", "frost free", "double door refrigerator"],
  },
  {
    id: "2",
    slug: "samsung-192l-single-door-refrigerator",
    name: "Samsung 192L Single Door Refrigerator RR20M282ZS8",
    shortDescription:
      "Digital Inverter | Fast Direct Cooling | Stabilizer Free",
    image: "/images/trending products/Samsung 192Litre Single door refrigerator.jpeg",
    currentPrice: "Rs 32,980",
    oldPrice: "Rs 36,500",
    warranty: "Warranty support available",
    badge: "New Arrival / Rs 3,520 Off",
    href: "/products/samsung-192l-single-door-refrigerator",
    brand: "Samsung",
    category: "Refrigerators",
    status: "In Stock",
    searchTerms: ["fridge", "single door refrigerator"],
  },
  {
    id: "3",
    slug: "himstar-chest-freezer-170",
    name: "Himstar Chest Freezer 170 Ltr HC-17H55SWG/WB",
    shortDescription: "High Capacity | Energy Efficient | Reliable Cooling",
    image: "/images/trending products/himstal 165 Litre deepfreezer.png",
    currentPrice: "Rs 37,900",
    oldPrice: "Rs 41,200",
    warranty: "Warranty support available",
    badge: "Rs 3,300 Off",
    href: "/products/himstar-chest-freezer-170",
    brand: "Himstar",
    category: "Freezers",
    status: "In Stock",
    searchTerms: ["deep freezer", "chest freezer", "himista"],
  },
  {
    id: "4",
    slug: "samsung-65-crystal-uhd-tv",
    name: "Samsung 65 inch Crystal UHD 4K Smart TV UA65U8500F",
    shortDescription: "Metal Stream Design | 4K Resolution | Smart Features",
    image: "/images/trending products/Samsung 65 inch tv.png",
    currentPrice: "Rs 1,29,000",
    oldPrice: "Rs 1,35,000",
    warranty:
      "3 years warranty: 1 year full warranty + 2 years service warranty",
    badge: "New Arrival / Rs 6,000 Off",
    href: "/products/samsung-65-crystal-uhd-tv",
    brand: "Samsung",
    category: "Smart TVs",
    status: "In Stock",
    searchTerms: ["tv", "television", "4k tv"],
  },
], { isFeatured: true });

export const bestSellingProducts: StoreProduct[] = withProductHrefs([
  {
    id: "bestseller-1",
    slug: "samsung-ww90dg5u24axim-9kg-ai-eco-bubble-wifi-washing-machine",
    name: "SAMSUNG 9 Kg Washing Machine With AI Eco Bubble WiFi Embedded WW90DG5U24AXIM",
    shortDescription:
      "9 Kg capacity | 1400 RPM | AI Eco Bubble | WiFi Embedded | Hygiene Steam Wash",
    image: "/images/bestseller/Samsung 9kg washing machine( Best Sellers-1).png",
    currentPrice: "Rs. 79,998",
    oldPrice: "Rs. 102,990",
    warranty: "10 Years Motor Warranty",
    badge: "22% Off",
    href: "/products/samsung-ww90dg5u24axim-9kg-ai-eco-bubble-wifi-washing-machine",
    brand: "Samsung",
    category: "Washing Machines",
    status: "In Stock",
    searchTerms: ["washer", "laundry", "front load", "ai eco bubble", "wifi"],
  },
  {
    id: "bestseller-2",
    slug: "samsung-ua55u8500f-55-inch-crystal-uhd-4k-smart-tv",
    name: "SAMSUNG 55 Inch Crystal UHD 4K Smart TV UA55U8500F",
    shortDescription:
      "Crystal Processor 4K | Samsung Knox Security | Solar Cell Remote | Metal Stream Design",
    image: "/images/bestseller/samsung 55 inch tv (bestseller-2).png",
    currentPrice: "Rs. 91,999",
    oldPrice: "Rs. 139,990",
    warranty: "3 Years Full Parts Warranty",
    badge: "34% Off",
    href: "/products/samsung-ua55u8500f-55-inch-crystal-uhd-4k-smart-tv",
    brand: "Samsung",
    category: "Smart TVs",
    status: "In Stock",
    searchTerms: ["tv", "television", "4k tv", "crystal uhd"],
  },
  {
    id: "bestseller-3",
    slug: "samsung-rr20c20c2gs-192-litres-single-door-refrigerator",
    name: "SAMSUNG 192 Litres Single Door Refrigerator RR20C20C2GS/IM",
    shortDescription:
      "192 Litres Capacity | Silver Grey Color | Digital Inverter Technology | Toughened Glass Shelves",
    image: "/images/bestseller/Samsung double door 192 Litres single door refrigerators( Best Sellers-3).png",
    currentPrice: "Rs. 29,500",
    oldPrice: "Rs. 34,990",
    warranty: "1 Year Full Product Warranty | 10 Years Compressor Warranty",
    badge: "15% Off",
    href: "/products/samsung-rr20c20c2gs-192-litres-single-door-refrigerator",
    brand: "Samsung",
    category: "Refrigerators",
    status: "In Stock",
    searchTerms: ["fridge", "single door refrigerator", "digital inverter"],
  },
  {
    id: "bestseller-4",
    slug: "cg-cgwd15a02hn-hot-normal-water-dispenser",
    name: "CG Hot & Normal Water Dispenser - CGWD15A02HN",
    shortDescription:
      "Over heating protector | SS heating water tank | 500W heating power | 5 L/hr hot water",
    image: "/images/bestseller/CG hot and cold water dispenser (bestseller-4).png",
    currentPrice: "Rs. 3,400",
    oldPrice: "Rs. 4,190",
    warranty: "1 Year Warranty",
    badge: "12% Off",
    href: "/products/cg-cgwd15a02hn-hot-normal-water-dispenser",
    brand: "CG",
    category: "Water Dispensers",
    status: "In Stock",
    searchTerms: ["water dispenser", "hot water", "kitchen appliance"],
  },
  {
    id: "bestseller-5",
    slug: "himstar-ht-43f4ksdj-43-inch-4k-smart-tv",
    name: "Himstar 43 inch 4k smart TV HT-43F4KSDJ",
    shortDescription:
      "43 Inches | 4K Ultra HD | Google Android 14 | Voice-enabled Bluetooth remote",
    image: "/images/bestseller/Himstar 43 inch tv( Best Sellers-5).png",
    currentPrice: "Rs. 42,000",
    oldPrice: "Rs. 49,000",
    warranty:
      "3-year warranty package: 1 year full coverage + 2 years extended service warranty",
    badge: "Top Pick",
    href: "/products/himstar-ht-43f4ksdj-43-inch-4k-smart-tv",
    brand: "Himstar",
    category: "Smart TVs",
    status: "In Stock",
    searchTerms: ["tv", "television", "4k tv", "android tv", "himista"],
  },
  {
    id: "bestseller-6",
    slug: "samsung-rr20c2722cr-192-litres-direct-cooling-single-door-refrigerator",
    name: "SAMSUNG RR20C2722CR/IM - 192 Litres Direct Cooling Single Door Refrigerator",
    shortDescription:
      "192 Litres Capacity | Bar Chrome Handle | Toughened Glass Shelves | Inverter Compressor",
    image: "/images/bestseller/samsung single door 192 liters (bestseller-6).png",
    currentPrice: "Rs. 33,799",
    oldPrice: "Rs. 38,990",
    warranty: "1 Year Full Product Warranty | 10 Years Compressor Warranty",
    badge: "13% Off",
    href: "/products/samsung-rr20c2722cr-192-litres-direct-cooling-single-door-refrigerator",
    brand: "Samsung",
    category: "Refrigerators",
    status: "In Stock",
    searchTerms: ["fridge", "single door refrigerator", "direct cooling"],
  },
  {
    id: "bestseller-7",
    slug: "samsung-wt70c3200ll-7kg-semi-automatic-washing-machine",
    name: "Samsung WT70C3200LL/TL 7Kg Semi Automatic washing Machine",
    shortDescription:
      "7 kg capacity | Semi-Automatic top load | 5 Star rating | Air Turbo Drying | Magic Filter",
    image: "/images/bestseller/samsung 7kg semi automatic washingmachine(best sellers-7).png",
    currentPrice: "Rs. 22,800",
    oldPrice: "Rs. 25,990",
    warranty: "1 Year Comprehensive Warranty | 5 Years Motor Warranty",
    badge: "14% Off",
    href: "/products/samsung-wt70c3200ll-7kg-semi-automatic-washing-machine",
    brand: "Samsung",
    category: "Washing Machines",
    status: "In Stock",
    searchTerms: ["washer", "laundry", "semi automatic", "top load"],
  },
  {
    id: "bestseller-8",
    slug: "samsung-ua43f5550fuxxl-43-inch-full-hd-smart-tv",
    name: "Samsung 43 Inch Full HD Smart TV UA43F5550FUXXL",
    shortDescription:
      '43" Full HD Smart TV | HDR 10+ | Tizen OS | WiFi & Bluetooth | 2 HDMI, 1 USB',
    image: "/images/bestseller/Samsung 43 inch tv 2k( Best Sellers-8).png",
    currentPrice: "Rs. 49,000",
    oldPrice: "Rs. 68,000",
    warranty: "3 Year Full Warranty",
    badge: "29% Off",
    href: "/products/samsung-ua43f5550fuxxl-43-inch-full-hd-smart-tv",
    brand: "Samsung",
    category: "Smart TVs",
    status: "In Stock",
    searchTerms: ["tv", "television", "full hd tv", "tizen", "hdr"],
  },
], { isBestSeller: true });

export const clearanceProducts: StoreProduct[] = withProductHrefs([
  {
    id: "clearance-1",
    slug: "samsung-rt40h30wnpim-275l",
    name: "RT40H30WNPIM Samsung Double Door Refrigerator, 275L",
    shortDescription:
      "275L | Frost-Free | Digital Inverter | 10-Year Compressor Warranty | Adjustable Toughened Glass Shelves | Power Cool | Inox Silver Finish",
    image: "/images/clearance/Samsung double door 275L RT40H30W2PHL(clearance-1).png",
    currentPrice: "Rs. 56,000",
    oldPrice: "Rs. 68,990",
    warranty: "10 Years Compressor Warranty",
    badge: "17% Off",
    href: "/products/samsung-rt40h30wnpim-275l",
    brand: "Samsung",
    category: "Double-Door Refrigerators",
    status: "Low Stock",
    searchTerms: [
      "fridge",
      "double door refrigerator",
      "frost free",
      "digital inverter",
      "power cool",
      "inox silver"
    ],
    highlights: [
      "275 Litres Gross Capacity (255L Net Storage)",
      "Frost-Free Cooling Technology",
      "Digital Inverter Technology",
      "10-Year Compressor Warranty",
      "Adjustable Toughened Glass Shelves",
      "Movable Twist Ice Maker",
      "Power Cool Rapid Cooling Function",
      "Deodorization System",
      "Elegant Inox Silver Finish"
    ],
    specifications: [
      {
        title: "Capacity",
        specs: [
          { label: "Capacity (Ltr)", value: "275 Ltr" }
        ]
      },
      {
        title: "General Feature",
        specs: [
          { label: "Cooling Features", value: "Frost Free Cooling, Power Cool" },
          { label: "Compressor", value: "Digital Inverter Compressor" },
          { label: "Deodorizing Filter", value: "Yes" }
        ]
      },
      {
        title: "Freezer Feature",
        specs: [
          { label: "Manual Twist Ice Maker", value: "Yes" },
          { label: "2-Door Pockets", value: "Yes" },
          { label: "1-Plastic Shelf", value: "Yes" }
        ]
      },
      {
        title: "Refrigerator Features",
        specs: [
          { label: "2-Glass Shelf", value: "Yes" },
          { label: "1-Vegetable Box", value: "Yes" },
          { label: "Egg Tray", value: "Yes" },
          { label: "Toughened Glass", value: "Yes" }
        ]
      },
      {
        title: "Design and Material",
        specs: [
          { label: "Design", value: "Refined Inox Color, Bar Door Handle, Slim Mold Design" }
        ]
      }
    ],
    boxContents: [
      "1 Refrigerator",
      "1 Manual",
      "1 Egg Tray",
      "1 Ice Maker"
    ],
    deliveryInfo: [
      "Delivery and installation support available in serviceable areas.",
      "Warranty support available through Dakshinkali Electronics."
    ]
  },
  {
    id: "clearance-2",
    slug: "himstar-hr-21d92brj-190l",
    name: "Himstar 190 Ltr Refrigerator HR-21D92BRJ",
    shortDescription:
      "Maroon finish | 190L capacity | Stabilizer free operation | 10 years compressor warranty",
    image: "/images/clearance/Himstar 210BHN (clearance-5)png.png",
    currentPrice: "Rs. 24,990",
    oldPrice: "Rs. 30,490",
    warranty: "10 Years Compressor Warranty",
    badge: "18% Off",
    href: "/products/himstar-hr-21d92brj-190l",
    brand: "Himstar",
    category: "Refrigerators",
    status: "Low Stock",
    searchTerms: ["fridge", "himista"],
  },
  {
    id: "clearance-3",
    slug: "samsung-rr20c2z226u-192l",
    name: "Samsung RR20C2Z226U/IM 192 Litres Single Door Refrigerator",
    shortDescription:
      "Stylish Grande design | Mystic Overlay Blue | Digital inverter compressor | Fast ice making",
    image: "/images/clearance/samsung 6U (clearance-4).png",
    currentPrice: "Rs. 34,000",
    oldPrice: "Rs. 39,590",
    warranty: "Warranty support available",
    badge: "14% Off",
    href: "/products/samsung-rr20c2z226u-192l",
    brand: "Samsung",
    category: "Refrigerators",
    status: "Low Stock",
    searchTerms: ["fridge", "single door refrigerator"],
  },
  {
    id: "clearance-4",
    slug: "godrej-rdemarvel-207c-190l",
    name: "Godrej 190 Liter Single Door Refrigerator - RDEMARVEL 207C THF FU WN",
    shortDescription:
      "Anti-bacteria technology | Curve door | Large veg box | 3 toughened glass shelves",
    image: "/images/clearance/godrej 184 L(clearance-4).png",
    currentPrice: "Rs. 31,790",
    oldPrice: "Rs. 40,090",
    warranty: "Warranty support available",
    badge: "21% Off",
    href: "/products/godrej-rdemarvel-207c-190l",
    brand: "Godrej",
    category: "Refrigerators",
    status: "Low Stock",
    searchTerms: ["fridge", "direct cool"],
  },
  {
    id: "clearance-5",
    slug: "himstar-hr-210bhn",
    name: "Himstar HR-210BHN Refrigerator",
    shortDescription:
      "192L capacity | Diamond Edge Freezing | 5-star rating | Toughened glass shelves",
    image: "/images/clearance/himstat 192 litres(clerance-2).png",
    currentPrice: "Rs. 27,000",
    oldPrice: "Rs. 32,990",
    warranty: "Warranty support available",
    badge: "22% Off",
    href: "/products/himstar-hr-210bhn",
    brand: "Himstar",
    category: "Refrigerators",
    status: "Low Stock",
    searchTerms: ["fridge", "himista"],
  },
  {
    id: "clearance-6",
    slug: "samsung-rt40h28wnpim-253l",
    name: "RT40H28WNPIM Samsung Double Door Refrigerator, 253L",
    shortDescription:
      "236L net capacity | Top mount freezer | Digital inverter | Toughened glass shelves",
    image: "/images/clearance/samsung NPIM 256L double door(clearance-6).png",
    currentPrice: "Rs. 51,000",
    oldPrice: "Rs. 60,990",
    warranty: "Warranty support available",
    badge: "15% Off",
    href: "/products/samsung-rt40h28wnpim-253l",
    brand: "Samsung",
    category: "Double-Door Refrigerators",
    status: "Low Stock",
    searchTerms: ["fridge", "frost free", "double door refrigerator"],
  },
  {
    id: "clearance-7",
    slug: "himstar-hw-80fs8btkgz-8kg",
    name: "Himstar 8KG Front Load Fully Automatic Washing Machine HW-80FS8BTKGZ",
    shortDescription:
      "Inverter motor | 1400 RPM | Built-in heater | LED display | 10 years motor warranty",
    image: "/images/clearance/Himstar 8kg washing machine (clearance-7).png",
    currentPrice: "Rs. 44,990",
    oldPrice: "Rs. 74,990",
    warranty: "10 Years Motor Warranty",
    badge: "41% Off",
    href: "/products/himstar-hw-80fs8btkgz-8kg",
    brand: "Himstar",
    category: "Washing Machines",
    status: "Low Stock",
    searchTerms: ["washer", "laundry", "front load", "himista"],
  },
  {
    id: "clearance-8",
    slug: "tcl-43v6b-43-inch-4k-smart-tv",
    name: "TCL 43V6B 43 inch 4K Smart TV",
    shortDescription:
      "Google TV | HDR10/HLG | Metallic bezel-less design | HDMI 2.1 with eARC",
    image: "/images/clearance/TCL 43 inch 43V6B 4k(clearance-8).png",
    currentPrice: "Rs. 45,000",
    oldPrice: "Rs. 56,000",
    warranty:
      "3 years warranty: 1 year full warranty + 2 years service warranty",
    badges: ["2024 Model", "20% Off"],
    href: "/products/tcl-43v6b-43-inch-4k-smart-tv",
    brand: "TCL",
    category: "Smart TVs",
    status: "In Stock",
    searchTerms: ["tv", "television", "google tv", "4k tv"],
  },
]);

const kitchenImage = (fileName: string) => `/images/kitchen/${fileName}`;

export const kitchenApplianceProducts: StoreProduct[] = withProductHrefs([
  {
    id: "kitchen-1",
    slug: "samsung-23l-grill-microwave-mg23a3515ak-tl",
    name: "Samsung 23L Grill Microwave MG23A3515AK/TL",
    shortDescription:
      "23L grill microwave | Tact and dial controls | Ceramic enamel cavity | Quick Defrost",
    image: kitchenImage("samsung 23 L grill microwave(kitchen-1).png"),
    currentPrice: "Rs. 25,500",
    oldPrice: "Rs. 31,270",
    warranty: "Warranty support available",
    badge: "18% Off",
    brand: "Samsung",
    category: "Microwave Oven",
    collection: "Kitchen Appliances",
    status: "In Stock",
    ratingText: "No ratings yet",
    searchTerms: [
      "kitchen appliance",
      "microwave",
      "grill microwave",
      "quick defrost",
      "ceramic enamel",
    ],
    galleryImages: [
      {
        id: "samsung-mg23-main",
        src: kitchenImage("samsung 23 L grill microwave(kitchen-1).png"),
        alt: "Samsung 23L Grill Microwave front view",
      },
      {
        id: "samsung-mg23-a",
        src: kitchenImage("samsung 23 L grill microwave(kitchen-1.a).png"),
        alt: "Samsung 23L Grill Microwave angled view",
      },
      {
        id: "samsung-mg23-b",
        src: kitchenImage("samsung 23 L grill microwave(kitchen-1.b).png"),
        alt: "Samsung 23L Grill Microwave door open",
      },
      {
        id: "samsung-mg23-c",
        src: kitchenImage("samsung 23 L grill microwave(kitchen-1.c).png"),
        alt: "Samsung 23L Grill Microwave control panel",
      },
      {
        id: "samsung-mg23-d",
        src: kitchenImage("samsung 23 L grill microwave(kitchen-1.d).png"),
        alt: "Samsung 23L Grill Microwave detail",
      },
    ],
    highlights: [
      "23L capacity suitable for 3 to 4 members",
      "Grill microwave for reheating, defrosting, grilling, and everyday cooking",
      "Tact and dial control method with LED display",
      "Eco Mode, Quick Defrost, Keep Warm, and Deodorization",
      "Ceramic enamel cavity for easier cleaning and hygienic use",
      "Child Safety Lock for safer family use",
    ],
    descriptionSections: [
      {
        id: "everyday-family-cooking",
        title: "Ideal for everyday family cooking",
        body: [
          "The Samsung MG23A3515AK/TL combines microwave heating with grill cooking in a practical 23L size, making it suitable for small to medium families. It handles reheating, defrosting, grilling, and quick daily meals without taking over the kitchen counter.",
        ],
      },
      {
        id: "clean-safe-controls",
        title: "Easy to clean and safer to use",
        body: [
          "A ceramic enamel cavity helps resist stains and supports easier cleaning after daily use. The child safety lock, deodorization mode, and keep warm function make it a reliable fit for busy family routines.",
        ],
        bullets: [
          "6 power levels with microwave, grill, combination, and quick defrost modes",
          "Browning Plus for improved grill results",
          "Wire rack included for grilling",
        ],
      },
    ],
    specifications: [
      {
        title: "General",
        specs: [
          { label: "Brand", value: "Samsung" },
          { label: "Model", value: "MG23A3515AK/TL" },
          { label: "Type", value: "Grill Microwave Oven" },
          { label: "Capacity", value: "23L" },
          { label: "Color", value: "Black" },
        ],
      },
      {
        title: "Controls and Cooking",
        specs: [
          { label: "Control Method", value: "Tact + Dial" },
          { label: "Display", value: "LED Display" },
          { label: "Power Levels", value: "6" },
          { label: "Cavity", value: "Ceramic Enamel" },
          { label: "Programs", value: "Micro, Grill, Combi, Quick Defrost" },
        ],
      },
      {
        title: "Power",
        specs: [
          { label: "Microwave Output", value: "800W" },
          { label: "Microwave Consumption", value: "1,250W" },
          { label: "Grill Consumption", value: "1,100W" },
          { label: "Maximum Consumption", value: "2,300W" },
        ],
      },
    ],
    boxContents: ["Microwave oven", "Wire rack", "User manual"],
    deliveryInfo: [
      "Delivery support available in serviceable areas.",
      "Warranty support available through Dakshinkali Electronics.",
    ],
    relatedProductSlugs: [
      "godrej-23l-convection-microwave-gme-523-cf1-rm",
      "himstar-8l-electric-pressure-cooker-hk-8k1epj-za",
      "cg-2000w-induction-cooktop-cgic20a03",
    ],
  },
  {
    id: "kitchen-2",
    slug: "samsung-universal-tv-remote",
    name: "Samsung Universal TV Remote",
    shortDescription:
      "Universal Samsung TV remote | Smart and non-smart TV support | Netflix and Prime buttons",
    image: kitchenImage("samsung remote(kitechen-2).png"),
    currentPrice: "Rs. 500",
    oldPrice: "Rs. 1,200",
    warranty: "Replacement support available",
    badge: "62% Off",
    brand: "Samsung",
    category: "TV Accessories",
    collection: "Kitchen Appliances",
    status: "In Stock",
    searchTerms: [
      "kitchen appliance",
      "tv remote",
      "samsung remote",
      "tv accessories",
      "universal remote",
    ],
    // TODO: Move this product out of Kitchen Appliances if a TV Accessories section is created.
    galleryImages: [
      {
        id: "samsung-remote-main",
        src: kitchenImage("samsung remote(kitechen-2).png"),
        alt: "Samsung Universal TV Remote front view",
      },
      {
        id: "samsung-remote-a",
        src: kitchenImage("samsung remote(kitechen-2.a).png"),
        alt: "Samsung Universal TV Remote button layout",
      },
      {
        id: "samsung-remote-b",
        src: kitchenImage("samsung remote(kitechen-2.b).png"),
        alt: "Samsung Universal TV Remote side view",
      },
      {
        id: "samsung-remote-c",
        src: kitchenImage("samsung remote(kitechen-2.c).png"),
        alt: "Samsung Universal TV Remote detail",
      },
      {
        id: "samsung-remote-d",
        src: kitchenImage("samsung remote(kitechen-2.d).png"),
        alt: "Samsung Universal TV Remote back view",
      },
    ],
    highlights: [
      "Compatible with Samsung smart and non-smart TVs",
      "Supports Samsung TVs from 24 inch to 75 inch",
      "Dedicated Netflix and Amazon Prime buttons",
      "Soft responsive keys for daily use",
      "Lightweight body with comfortable grip",
      "Works with AAA batteries, not included",
    ],
    descriptionSections: [
      {
        id: "simple-replacement-remote",
        title: "Simple replacement for Samsung TVs",
        body: [
          "This universal Samsung TV remote is a practical replacement or spare remote for Samsung smart and non-smart TVs. It is designed for easy daily control without a complicated setup process.",
        ],
      },
      {
        id: "streaming-shortcuts",
        title: "Quick streaming shortcuts",
        body: [
          "Dedicated Netflix and Amazon Prime buttons help you jump straight to common streaming apps, while the soft key layout keeps channel, volume, and menu control straightforward for every age group.",
        ],
      },
    ],
    specifications: [
      {
        title: "Compatibility",
        specs: [
          { label: "Product Type", value: "Universal TV Remote Control" },
          { label: "Compatible Brand", value: "Samsung" },
          { label: "TV Support", value: "Smart and non-smart Samsung TVs" },
          { label: "Supported TV Size", value: "24 inch to 75 inch" },
        ],
      },
      {
        title: "Build",
        specs: [
          { label: "Special Buttons", value: "Netflix, Amazon Prime" },
          { label: "Material", value: "High-quality plastic with soft keys" },
          { label: "Power Source", value: "AAA batteries, not included" },
        ],
      },
    ],
    boxContents: ["1 universal remote control"],
    deliveryInfo: ["Batteries are not included."],
  },
  {
    id: "kitchen-3",
    slug: "samsung-vcc4540s36-sml-bagless-vacuum-cleaner",
    name: "Samsung VCC4540S36/SML Bagless Vacuum Cleaner",
    shortDescription:
      "1.3L twin chamber dust capacity | 1800W motor | 360W suction | HEPA exhaust filter",
    image: kitchenImage("samsung vaccum cleaner airtrack(kitchen-3).png"),
    currentPrice: "Rs. 13,490",
    warranty: "Warranty support available",
    badge: "Bagless",
    brand: "Samsung",
    category: "Vacuum Cleaner",
    collection: "Kitchen Appliances",
    status: "In Stock",
    ratingText: "0 customer ratings",
    searchTerms: [
      "kitchen appliance",
      "vacuum cleaner",
      "bagless vacuum",
      "samsung vacuum",
      "home cleaning",
    ],
    galleryImages: [
      {
        id: "samsung-vacuum-main",
        src: kitchenImage("samsung vaccum cleaner airtrack(kitchen-3).png"),
        alt: "Samsung VCC4540S36/SML vacuum cleaner",
      },
      {
        id: "samsung-vacuum-a",
        src: kitchenImage("samsung vaccum cleaner airtrack(kitchen-3.a).png"),
        alt: "Samsung vacuum cleaner front detail",
      },
      {
        id: "samsung-vacuum-b",
        src: kitchenImage("samsung vaccum cleaner airtrack(kitchen-3.b).png"),
        alt: "Samsung vacuum cleaner accessories",
      },
      {
        id: "samsung-vacuum-c",
        src: kitchenImage("samsung vaccum cleaner airtrack(kitchen-3.c).png"),
        alt: "Samsung vacuum cleaner side view",
      },
      {
        id: "samsung-vacuum-d",
        src: kitchenImage("samsung vaccum cleaner airtrack(kitchen-3.d).png"),
        alt: "Samsung vacuum cleaner body detail",
      },
    ],
    highlights: [
      "Bagless twin chamber dust collection system",
      "1.3L dust capacity for regular home cleaning",
      "1800W maximum power consumption with 360W suction power",
      "HEPA exhaust filter with pre-motor filtration",
      "Auto cord rewinder for easier storage",
      "2-step NB250 main brush and 2-in-1 accessory",
    ],
    descriptionSections: [
      {
        id: "cleaning-performance",
        title: "Reliable everyday home cleaning",
        body: [
          "The Samsung VCC4540S36/SML is built for routine household cleaning with a bagless 1.3L twin chamber dust system, strong suction, and practical accessories for floors, corners, and furniture.",
        ],
      },
      {
        id: "storage-and-filtration",
        title: "Designed for easier storage and cleaner exhaust",
        body: [
          "An auto cord rewinder keeps the cleaner tidy between uses, while HEPA exhaust filtration helps manage dust release during cleaning.",
        ],
      },
    ],
    specifications: [
      {
        title: "Performance",
        specs: [
          { label: "Model", value: "VCC4540S36/SML" },
          { label: "Dust Collection", value: "Bagless Twin Chamber" },
          { label: "Dust Capacity", value: "1.3L" },
          { label: "Max Consumption Power", value: "1800W" },
          { label: "Suction Power", value: "360W" },
          { label: "Noise Level", value: "83 dBA" },
        ],
      },
      {
        title: "Accessories and Filters",
        specs: [
          { label: "Main Brush", value: "2-Step NB250" },
          { label: "Accessory", value: "2-in-1 accessory" },
          { label: "Filter", value: "HEPA exhaust filter with pre-motor" },
          { label: "Pipe", value: "Stainless pipe" },
          { label: "Cord", value: "Auto cord rewinder" },
        ],
      },
    ],
    boxContents: ["Vacuum cleaner", "Main brush", "2-in-1 accessory", "Stainless pipe"],
    deliveryInfo: ["Delivery support available in serviceable areas."],
  },
  {
    id: "kitchen-4",
    slug: "godrej-23l-convection-microwave-gme-523-cf1-rm",
    name: "Godrej 23L Convection Microwave Oven GME 523 CF1 RM",
    shortDescription:
      "23L convection microwave | 205 Instacook recipes | Air Fry mode | Stainless steel cavity",
    image: kitchenImage("godrej 23ltr oven (kitchen-4).png"),
    currentPrice: "Rs. 17,990",
    oldPrice: "Rs. 22,400",
    warranty: "1 Year Comprehensive Warranty",
    badge: "21% Off",
    brand: "Godrej",
    category: "Microwave Oven",
    collection: "Kitchen Appliances",
    status: "In Stock",
    searchTerms: [
      "kitchen appliance",
      "convection microwave",
      "godrej microwave",
      "air fry",
      "instacook",
    ],
    galleryImages: [
      {
        id: "godrej-oven-main",
        src: kitchenImage("godrej 23ltr oven (kitchen-4).png"),
        alt: "Godrej 23L Convection Microwave Oven front view",
      },
      {
        id: "godrej-oven-a",
        src: kitchenImage("godrej 23ltr oven (kitchen-4.a).png"),
        alt: "Godrej 23L convection microwave angled view",
      },
      {
        id: "godrej-oven-b",
        src: kitchenImage("godrej 23ltr oven (kitchen-4.b).png"),
        alt: "Godrej 23L convection microwave door open",
      },
      {
        id: "godrej-oven-c",
        src: kitchenImage("godrej 23ltr oven (kitchen-4.c).png"),
        alt: "Godrej 23L convection microwave control panel",
      },
      {
        id: "godrej-oven-d",
        src: kitchenImage("godrej 23ltr oven (kitchen-4.d).png"),
        alt: "Godrej 23L convection microwave interior",
      },
      {
        id: "godrej-oven-e",
        src: kitchenImage("godrej 23ltr oven (kitchen-4.e).png"),
        alt: "Godrej 23L convection microwave detail",
      },
      {
        id: "godrej-oven-f",
        src: kitchenImage("godrej 23ltr oven (kitchen-4.f).png"),
        alt: "Godrej 23L convection microwave side view",
      },
      {
        id: "godrej-oven-g",
        src: kitchenImage("godrej 23ltr oven (kitchen-4.g).png"),
        alt: "Godrej 23L convection microwave feature detail",
      },
      {
        id: "godrej-oven-h",
        src: kitchenImage("godrej 23ltr oven (kitchen-4.h).png"),
        alt: "Godrej 23L convection microwave cooking modes",
      },
      {
        id: "godrej-oven-i",
        src: kitchenImage("godrej 23ltr oven (kitchen-4.i).png"),
        alt: "Godrej 23L convection microwave accessory view",
      },
    ],
    highlights: [
      "23L capacity suitable for 3 to 4 members",
      "Convection microwave for baking, grilling, reheating, defrosting, and cooking",
      "205 Instacook recipes for guided everyday cooking",
      "Healthy Air Fry mode and oil-free recipe support",
      "Steam clean, deodoriser, defrost, and express cooking modes",
      "Stainless steel cavity with pull door design",
    ],
    descriptionSections: [
      {
        id: "guided-cooking",
        title: "Guided cooking for busy kitchens",
        body: [
          "The Godrej GME 523 CF1 RM combines convection, grill, and microwave cooking in a 23L format. Its recipe programs help families prepare snacks, breakfasts, Indian dishes, desserts, soups, paneer, ghee, curd, and fermented foods with less guesswork.",
        ],
      },
      {
        id: "healthy-modes",
        title: "Healthier cooking modes",
        body: [
          "Healthy Air Fry, oil-free recipes, steam clean, deodoriser, and 4-step cooking give this microwave more flexibility than a basic reheating appliance.",
        ],
      },
    ],
    specifications: [
      {
        title: "General",
        specs: [
          { label: "Brand", value: "Godrej" },
          { label: "Model", value: "GME 523 CF1 RM" },
          { label: "Type", value: "Convection Microwave Oven" },
          { label: "Capacity", value: "23L" },
          { label: "Color", value: "Floral Black" },
        ],
      },
      {
        title: "Cooking Features",
        specs: [
          { label: "Programs", value: "205 Instacook recipes" },
          { label: "Cooking Modes", value: "Solo, grill, convection, combination, express cooking" },
          { label: "Special Modes", value: "Healthy Air Fry, steam clean, deodoriser, defrost, 4-step cooking" },
          { label: "Power Levels", value: "5" },
        ],
      },
      {
        title: "Build and Power",
        specs: [
          { label: "Output Power", value: "800W" },
          { label: "Listed Power", value: "1200W" },
          { label: "Cavity Type", value: "Stainless Steel" },
          { label: "Door Type", value: "Pull" },
          { label: "Glass Finish", value: "Plain" },
        ],
      },
    ],
    boxContents: ["Microwave oven", "User manual"],
    deliveryInfo: ["Warranty support available through Dakshinkali Electronics."],
    relatedProductSlugs: [
      "samsung-23l-grill-microwave-mg23a3515ak-tl",
      "cg-2000w-induction-cooktop-cgic20a03",
    ],
  },
  {
    id: "kitchen-5",
    slug: "himstar-8l-electric-pressure-cooker-hk-8k1epj-za",
    name: "Himstar 8L Electric Pressure Cooker HK-8K1EPJ/ZA",
    shortDescription:
      "8L capacity | 1200W power | Preset cooking modes | Temperature control",
    image: kitchenImage("Himstar electric pressure cooker(kitchen-5).png"),
    currentPrice: "Rs. 7,500",
    oldPrice: "Rs. 10,990",
    warranty: "1 Year Brand Warranty",
    badge: "30% Off",
    brand: "Himstar",
    category: "Electric Pressure Cooker",
    collection: "Kitchen Appliances",
    status: "In Stock",
    ratingText: "No ratings yet",
    searchTerms: [
      "kitchen appliance",
      "pressure cooker",
      "electric cooker",
      "rice cooker",
      "himstar cooker",
    ],
    galleryImages: [
      {
        id: "himstar-cooker-main",
        src: kitchenImage("Himstar electric pressure cooker(kitchen-5).png"),
        alt: "Himstar 8L Electric Pressure Cooker",
      },
      {
        id: "himstar-cooker-a",
        src: kitchenImage("Himstar electric pressure cooker(kitchen-5.a).png"),
        alt: "Himstar pressure cooker control panel",
      },
      {
        id: "himstar-cooker-b",
        src: kitchenImage("Himstar electric pressure cooker(kitchen-5.b).png"),
        alt: "Himstar pressure cooker detail",
      },
    ],
    highlights: [
      "Large 8L capacity for family meals",
      "1200W power with intelligent temperature control",
      "Preset modes for rice, cake, soup, chicken, stew, fry, and more",
      "Auto keep warm function for ready-to-serve meals",
      "Includes pot, steamer, measuring cup, spatula, and power cord",
      "Detachable power cord for easier storage",
    ],
    descriptionSections: [
      {
        id: "family-capacity",
        title: "Large capacity for family cooking",
        body: [
          "This 8L Himstar electric pressure cooker is built for larger family meals, batch cooking, and everyday rice, soup, porridge, stew, steaming, and warming needs.",
        ],
      },
      {
        id: "preset-controls",
        title: "Preset cooking with accurate control",
        body: [
          "Preset cooking modes and temperature control help simplify common recipes while reducing the manual attention needed during pressure cooking.",
        ],
      },
    ],
    specifications: [
      {
        title: "General",
        specs: [
          { label: "Brand", value: "Himstar" },
          { label: "Model", value: "HK-8K1EPJ/ZA" },
          { label: "Capacity", value: "8L" },
          { label: "Color", value: "Steel / Silver" },
          { label: "Body Material", value: "Metal" },
        ],
      },
      {
        title: "Cooking Features",
        specs: [
          { label: "Preset Modes", value: "Rice, cake, steam fish, heating rice, porridge, soup, steam bone, steam chicken, stew, fry, preset, intelligent cook" },
          { label: "Controls", value: "Temperature control, timer, taste selection, warm/cancel" },
          { label: "Auto Keep Warm", value: "Yes" },
          { label: "Steamer", value: "Yes" },
          { label: "Soup Making", value: "Yes" },
        ],
      },
      {
        title: "Power",
        specs: [
          { label: "Power Requirement", value: "220-240V AC, 50-60Hz" },
          { label: "Power Consumption", value: "1200W" },
          { label: "Installation and Demo", value: "Not required" },
        ],
      },
    ],
    boxContents: [
      "Pressure cooker",
      "Pot",
      "Steamer",
      "Power cord",
      "Measuring cup",
      "Spatula",
    ],
    deliveryInfo: ["Free shipping where applicable.", "Warranty support available."],
  },
  {
    id: "kitchen-6",
    slug: "cg-550w-mixer-grinder-cgmg5505a",
    name: "CG 550W Mixer Grinder CGMG5505A",
    shortDescription:
      "550W mixer grinder | 3 stainless steel jars | 3-speed control | Overload protection",
    image: kitchenImage("CG mixer(kitchen-7).png"),
    currentPrice: "Rs. 3,800",
    oldPrice: "Rs. 4,260",
    warranty: "2 Years Warranty on Motor",
    badge: "12% Off",
    brand: "CG",
    category: "Mixer Grinder",
    collection: "Kitchen Appliances",
    status: "In Stock",
    searchTerms: [
      "kitchen appliance",
      "mixer grinder",
      "cg mixer",
      "grinder",
      "blender",
    ],
    galleryImages: [
      {
        id: "cg-mixer-main",
        src: kitchenImage("CG mixer(kitchen-7).png"),
        alt: "CG 550W Mixer Grinder front view",
      },
      {
        id: "cg-mixer-a",
        src: kitchenImage("CG mixer(kitchen-7.a).png"),
        alt: "CG 550W Mixer Grinder with jars",
      },
    ],
    highlights: [
      "550W motor for grinding, blending, and mixing",
      "3 jars for liquidizing, dry/wet grinding, and chutney preparation",
      "3-speed control with incher for better texture control",
      "High-grade stainless steel jars with flow breakers",
      "Shock-proof ABS and unbreakable polycarbonate body",
      "Overload protection helps safeguard the motor",
    ],
    descriptionSections: [
      {
        id: "everyday-prep",
        title: "Built for everyday food preparation",
        body: [
          "The CGMG5505A mixer grinder helps with everyday blending, wet grinding, dry grinding, chutney preparation, and ingredient prep. Its 550W motor and three-jar setup cover the common needs of a family kitchen.",
        ],
      },
      {
        id: "durable-safe-build",
        title: "Durable jars and safer operation",
        body: [
          "Stainless steel jars, flow breakers, overload protection, and a shock-proof body make it practical for repeated daily use.",
        ],
      },
    ],
    specifications: [
      {
        title: "General",
        specs: [
          { label: "Brand", value: "CG" },
          { label: "Model", value: "CGMG5505A" },
          { label: "Power", value: "550W" },
          { label: "Voltage", value: "220V - 50Hz" },
          { label: "Color", value: "White" },
        ],
      },
      {
        title: "Jars",
        specs: [
          { label: "Liquidizing Jar", value: "1.3L stainless steel" },
          { label: "Dry/Wet Jar", value: "1.0L stainless steel" },
          { label: "Chutney Jar", value: "400g" },
          { label: "Jar Material", value: "High-grade stainless steel" },
        ],
      },
      {
        title: "Controls and Safety",
        specs: [
          { label: "Speed Control", value: "3 speed with incher" },
          { label: "Grinding System", value: "Flow breakers in jars" },
          { label: "Body", value: "Unbreakable polycarbonate and shock-proof ABS" },
          { label: "Motor Protection", value: "Overload protection" },
        ],
      },
    ],
    boxContents: ["Mixer grinder unit", "Liquidizing jar", "Dry/wet jar", "Chutney jar"],
    deliveryInfo: ["Warranty support available through Dakshinkali Electronics."],
  },
  {
    id: "kitchen-7",
    slug: "cg-2000w-induction-cooktop-cgic20a03",
    name: "CG 2000W Induction Cooktop CGIC20A03",
    shortDescription:
      "2000W induction cooktop | Crystal glass plate | Digital display | Timer and child lock",
    image: kitchenImage("CG induction cooktop(kitchen-7).png"),
    currentPrice: "Rs. 3,500",
    oldPrice: "Rs. 5,490",
    warranty: "1 Year Comprehensive Warranty | 2 Years Glass Plate Warranty",
    badge: "31% Off",
    brand: "CG",
    category: "Induction Cooktop",
    collection: "Kitchen Appliances",
    status: "In Stock",
    ratingText: "No ratings yet",
    searchTerms: [
      "kitchen appliance",
      "induction cooktop",
      "induction cooker",
      "cg induction",
      "electric cooking",
    ],
    galleryImages: [
      {
        id: "cg-induction-main",
        src: kitchenImage("CG induction cooktop(kitchen-7).png"),
        alt: "CG 2000W Induction Cooktop",
      },
      {
        id: "cg-induction-a",
        src: kitchenImage("CG induction cooktop(kitchen-7.a).png"),
        alt: "CG induction cooktop control panel",
      },
      {
        id: "cg-induction-b",
        src: kitchenImage("CG induction cooktop(kitchen-7.b).png"),
        alt: "CG induction cooktop side view",
      },
    ],
    highlights: [
      "2000W power for fast electric cooking",
      "Super A Grade crystal glass surface",
      "Touch controls with clear 4-digit LED display",
      "Adjustable wattage and temperature",
      "Built-in timer, automatic cookware detection, and child lock",
      "Cooling fan for internal protection",
    ],
    descriptionSections: [
      {
        id: "fast-smoke-free-cooking",
        title: "Fast, clean electric cooking",
        body: [
          "The CGIC20A03 induction cooktop is a compact 2000W cooking solution for modern kitchens. It heats compatible cookware quickly while keeping the surface easy to wipe clean after use.",
        ],
      },
      {
        id: "precise-controls",
        title: "Controls for everyday meals",
        body: [
          "Preset cooking modes, adjustable temperature, a digital display, and timer support make it easy to manage boiling, frying, heating, and regular meal preparation.",
        ],
      },
    ],
    specifications: [
      {
        title: "General",
        specs: [
          { label: "Brand", value: "CG" },
          { label: "Model", value: "CGIC20A03" },
          { label: "Power", value: "2000W" },
          { label: "Surface", value: "Super A Grade crystal glass" },
          { label: "Color", value: "Black" },
        ],
      },
      {
        title: "Controls and Safety",
        specs: [
          { label: "Display", value: "4-digit LED display" },
          { label: "Controls", value: "Touch / push button control" },
          { label: "Cooking Functions", value: "8 functions listed" },
          { label: "Preset Modes", value: "6 preset cooking modes listed" },
          { label: "Timer", value: "Up to 4 hours" },
          { label: "Safety", value: "Child lock and automatic cookware detection" },
        ],
      },
    ],
    boxContents: ["Induction cooktop", "User manual"],
    deliveryInfo: ["Use only induction-compatible cookware."],
    relatedProductSlugs: [
      "cg-550w-mixer-grinder-cgmg5505a",
      "himstar-8l-electric-pressure-cooker-hk-8k1epj-za",
    ],
  },
  {
    id: "kitchen-8",
    slug: "cg-5l-bottom-loading-water-dispenser-cgwdb-lec",
    name: "CG 5L Bottom Loading Water Dispenser CGWDBLEC",
    shortDescription:
      "Bottom loading dispenser | Hot, cold and normal water | 304 stainless steel tank | Child lock",
    image: kitchenImage("cg water dispensor(kitchen-8).png"),
    currentPrice: "Rs. 15,490",
    oldPrice: "Rs. 19,990",
    warranty: "1 Year Warranty",
    badge: "24% Off",
    brand: "CG",
    category: "Water Dispenser",
    collection: "Kitchen Appliances",
    status: "In Stock",
    ratingText: "3 ratings",
    searchTerms: [
      "kitchen appliance",
      "water dispenser",
      "bottom loading dispenser",
      "hot cold normal water",
      "cgwdb lec",
      "cgwdb",
    ],
    galleryImages: [
      {
        id: "cg-dispenser-main",
        src: kitchenImage("cg water dispensor(kitchen-8).png"),
        alt: "CG 5L Bottom Loading Water Dispenser",
      },
      {
        id: "cg-dispenser-a",
        src: kitchenImage("cg water dispensor(kitchen-8.a).png"),
        alt: "CG bottom loading water dispenser detail",
      },
    ],
    highlights: [
      "Bottom loading design for easier bottle changes",
      "Hot, cold, and normal water dispensing",
      "Food-grade 304 stainless steel water tank",
      "Child lock safety tap for hot water",
      "Overheating protection for safer operation",
      "ABS plastic body with compact 33 x 32 x 105 cm footprint",
    ],
    descriptionSections: [
      {
        id: "easy-bottom-loading",
        title: "Easier bottle changes",
        body: [
          "The CGWDBLEC bottom loading water dispenser keeps the bottle hidden in the lower cabinet, reducing lifting effort and keeping the setup cleaner for homes and offices.",
        ],
      },
      {
        id: "hot-cold-normal",
        title: "Hot, cold, and normal water",
        body: [
          "Three tap functionality gives quick access to hot, cold, and normal water. A child lock safety tap and overheating protection add confidence for everyday use.",
        ],
      },
    ],
    specifications: [
      {
        title: "General",
        specs: [
          { label: "Brand", value: "CG" },
          { label: "Model", value: "CGWDBLEC" },
          { label: "Type", value: "Bottom Loading" },
          { label: "Function", value: "Hot, cold and normal" },
          { label: "Color", value: "Black" },
          { label: "Body Material", value: "ABS Plastic" },
        ],
      },
      {
        title: "Water and Safety",
        specs: [
          { label: "Water Tank", value: "304 stainless steel food-grade tank" },
          { label: "Tap Type", value: "3 taps with hot tap safety" },
          { label: "Overheating Protector", value: "Yes" },
          { label: "Hot Water Temperature", value: "85-95 degree C" },
          { label: "Cold Water Temperature", value: "12-15 degree C" },
        ],
      },
      {
        title: "Capacity and Power",
        specs: [
          { label: "Hot Water Output", value: "5L per hour" },
          { label: "Cold Water Output", value: "0.7L per hour" },
          { label: "Hot Tank Capacity", value: "1L" },
          { label: "Cold Tank Capacity", value: "0.68L" },
          { label: "Heating Power", value: "500W" },
          { label: "Cooling Power", value: "70W" },
          { label: "Voltage", value: "220-240V, 50-60Hz" },
        ],
      },
      {
        title: "Dimensions",
        specs: [
          { label: "Net Weight", value: "8 kg" },
          { label: "Gross Weight", value: "9.5 kg" },
          { label: "Dimensions", value: "33 x 32 x 105 cm (W x D x H)" },
        ],
      },
    ],
    boxContents: ["Water dispenser", "User manual"],
    deliveryInfo: ["Delivery support available in serviceable areas."],
  },
  // Future kitchen appliance products 9-12 can be added here.
]);

export const detailProducts: StoreProduct[] = withProductHrefs([
  {
    id: "samsung-ua55cu7700",
    slug: "samsung-ua55cu7700-55-inch-crystal-ultra-hd-4k-smart-tv",
    name: "Samsung 55-inch Crystal Ultra HD 4K Smart TV | UA55CU7700",
    shortDescription: "55-inch Crystal Ultra HD 4K display with Tizen OS",
    image:
      "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop",
    currentPrice: "Rs 89,000",
    oldPrice: "Rs 95,000",
    warranty:
      "3 years warranty: 1 year full warranty + 2 years service warranty",
    badge: "Global No.1 TV",
    href: "/products/samsung-ua55cu7700-55-inch-crystal-ultra-hd-4k-smart-tv",
    brand: "Samsung",
    category: "Televisions",
    status: "In Stock",
    searchTerms: ["tv", "television", "smart tv", "4k tv"],
    galleryImages: [
      {
        id: "img-1",
        src: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop",
        alt: "Samsung UA55CU7700 - Front View",
      },
      {
        id: "img-2",
        src: "https://images.unsplash.com/photo-1559720595-4b7b2c0f0b0a?w=600&h=600&fit=crop",
        alt: "Samsung UA55CU7700 - Side View",
      },
      {
        id: "img-3",
        src: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop",
        alt: "Samsung UA55CU7700 - Detail View",
      },
      {
        id: "img-4",
        src: "https://images.unsplash.com/photo-1559720595-4b7b2c0f0b0a?w=600&h=600&fit=crop",
        alt: "Samsung UA55CU7700 - Top View",
      },
      {
        id: "img-5",
        src: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop",
        alt: "Samsung UA55CU7700 - Back View",
      },
      {
        id: "img-6",
        src: "https://images.unsplash.com/photo-1559720595-4b7b2c0f0b0a?w=600&h=600&fit=crop",
        alt: "Samsung UA55CU7700 - In Use",
      },
    ],
    highlights: [
      "55-inch Crystal Ultra HD 4K display",
      "3840 x 2160 screen resolution",
      "Crystal Processor 4K with UHD upscaling",
      "PurColor with 1 Billion Color Shades",
      "HDR and HDR 10+ support",
      "Tizen OS Smart TV platform",
      "Bixby, Alexa, and Google Assistant support, availability varies by region",
      "SmartThings App support",
      "HDMI x3, USB x1, Digital Audio Out Optical x1, RF In",
      "HDMI eARC and Bluetooth v5.2",
      "Game Mode with Auto Low Latency Mode",
      "Adaptive Sound, OTS Lite, and Q-Symphony",
      "20W 2CH stereo sound",
      "Mobile to TV Mirroring, Sound Mirroring, and TV Sound to Mobile",
      "DVB-T2 Digital Broadcasting and Analog Tuner",
    ],
    descriptionSections: [
      {
        id: "intro",
        title: "Samsung UA55CU7700 55-inch Crystal Ultra HD 4K Smart TV",
        body: [
          "Introducing the Samsung UA55CU7700 55-inch Crystal Ultra HD 4K Smart TV, a cutting-edge addition to your home entertainment setup. With a stunning 4K Ultra HD resolution of 3840 x 2160, this TV delivers crystal-clear visuals that bring your favorite content to life. Its Tizen OS ensures smooth navigation and access to smart entertainment features, making it a true smart TV for modern homes.",
        ],
      },
      {
        id: "visuals",
        title: "Immersive Visuals",
        body: [
          "The UA55CU7700 offers an impressive 55-inch screen size, perfect for immersive and cinematic viewing experiences. With a screen resolution of 3840 x 2160, this TV delivers sharp, vivid, and detailed visuals. The slim look and bezel-less design provide an edge-to-edge viewing experience while adding a premium touch to your living space.",
        ],
        bullets: [
          "55-inch display size",
          "4K Ultra HD resolution",
          "Crystal Processor 4K",
          "1 Billion Color Shades",
          "HDR and HDR 10+ support",
          "PurColor technology",
          "Contrast Enhancer",
          "Motion Xcelerator",
          "Filmmaker Mode",
        ],
      },
      {
        id: "connectivity",
        title: "Seamless Connectivity",
        bullets: [
          "HDMI x3",
          "USB x1",
          "Digital Audio Out Optical x1",
          "RF In",
          "HDMI eARC",
          "Bluetooth v5.2",
        ],
      },
      {
        id: "smart-features",
        title: "Smart Features Galore",
        body: [
          "Powered by Tizen OS, the Samsung UA55CU7700 gives users access to smart entertainment, voice assistants, and connected home features. With Bixby, Alexa, Google Assistant support, SmartThings App support, Mobile to TV Mirroring, Sound Mirroring, and Easy Setup, this TV is built for convenience and connected living.",
        ],
        bullets: [
          "Tizen OS",
          "Bixby support",
          "Alexa and Google Assistant support",
          "SmartThings App support",
          "Mobile to TV Mirroring",
          "TV Sound to Mobile",
          "Sound Mirroring",
          "Easy Setup",
          "Samsung TV Plus support where available",
        ],
      },
      {
        id: "gaming",
        title: "Enhanced Gaming",
        body: [
          "For gamers, the UA55CU7700 includes Game Mode with Auto Game Mode and ALLM support. This helps reduce input lag and gives a more responsive gaming experience, making it suitable for casual console gaming and entertainment use.",
        ],
        bullets: [
          "Game Mode",
          "Auto Game Mode",
          "ALLM support",
          "Motion Xcelerator",
          "Smooth 4K gaming visuals",
        ],
      },
      {
        id: "audio",
        title: "Immersive Audio",
        body: [
          "The TV delivers rich and clear sound with Adaptive Sound, OTS Lite, Q-Symphony, and 20W 2CH stereo output. Bluetooth Audio, Bluetooth Two-Way Audio, and Multiroom Link make the sound experience more flexible for home entertainment setups.",
        ],
        bullets: [
          "Q-Symphony",
          "Adaptive Sound",
          "OTS Lite",
          "20W 2CH stereo sound",
          "Multiroom Link",
          "Bluetooth Audio",
          "Bluetooth Two-Way Audio",
        ],
      },
    ],
    specifications: [
      {
        title: "Display",
        specs: [
          { label: "Series", value: "CU Series" },
          { label: "Screen Size", value: "55 inch" },
          { label: "Screen Resolution", value: "3840 x 2160" },
          { label: "TV Resolution", value: "4K Ultra HD 2160p" },
          { label: "Design", value: "Slim Look, 3-side bezel-less" },
        ],
      },
      {
        title: "Video",
        specs: [
          { label: "Processor", value: "Crystal Processor 4K" },
          { label: "Color", value: "1 Billion Color Shades" },
          { label: "HDR", value: "HDR, HDR 10+, Hybrid Gamma Log" },
          {
            label: "Enhancements",
            value:
              "Mega Contrast, PurColor, Contrast Enhancer, Film Mode, Motion Xcelerator, Filmmaker Mode",
          },
        ],
      },
      {
        title: "Smart Features",
        specs: [
          { label: "Smart TV", value: "Yes" },
          { label: "Smart TV OS", value: "Tizen OS" },
          { label: "Voice Assistants", value: "Bixby, Alexa, Google Assistant" },
          { label: "Connected Home", value: "SmartThings App support" },
        ],
      },
      {
        title: "Connectivity",
        specs: [
          { label: "HDMI", value: "3" },
          { label: "USB", value: "1" },
          { label: "Audio Out", value: "Digital Audio Out Optical x1" },
          { label: "RF In", value: "1" },
          { label: "HDMI eARC", value: "Yes" },
          { label: "Bluetooth", value: "v5.2" },
        ],
      },
      {
        title: "Audio",
        specs: [
          { label: "Sound Output", value: "20W 2CH Stereo Sound" },
          { label: "Audio Features", value: "Q-Symphony, Adaptive Sound, OTS Lite" },
          {
            label: "Wireless Audio",
            value: "Multiroom Link, Bluetooth Audio, Bluetooth Two-Way Audio",
          },
        ],
      },
    ],
    boxContents: ["1 cable", "1 remote", "1 manual", "1 LED TV"],
    deliveryInfo: [
      "Delivery and installation support available in serviceable areas.",
      "Warranty support available through Dakshinkali Electronics.",
    ],
    relatedProductSlugs: [
      "samsung-ua55u8500f-55-inch-crystal-uhd-4k-smart-tv",
      "samsung-65-crystal-uhd-tv",
      "tcl-43v6b-43-inch-4k-smart-tv",
      "himstar-ht-43f4ksdj-43-inch-4k-smart-tv",
    ],
  },
], { isFeatured: true });

export const storeProducts: StoreProduct[] = dedupeBySlug([
  ...trendingProducts,
  ...bestSellingProducts,
  ...clearanceProducts,
  ...kitchenApplianceProducts,
  ...detailProducts,
]);

export function getProductBySlug(slug: string) {
  return storeProducts.find(
    (product) => product.slug === slug && product.isActive !== false,
  );
}

export function getActiveProducts() {
  return storeProducts.filter((product) => product.isActive !== false);
}

export function getFeaturedProducts() {
  return getActiveProducts().filter((product) => product.isFeatured);
}

export function getBestSellerProducts() {
  return getActiveProducts().filter((product) => product.isBestSeller);
}

export function getRelatedProducts(product: StoreProduct, limit = 4) {
  const relatedBySlug =
    product.relatedProductSlugs
      ?.map((slug) => getProductBySlug(slug))
      .filter((relatedProduct): relatedProduct is StoreProduct =>
        Boolean(relatedProduct),
      ) ?? [];

  const relatedSlugs = new Set(relatedBySlug.map((relatedProduct) => relatedProduct.slug));
  const fallbackProducts = getActiveProducts().filter(
    (candidate) =>
      candidate.slug !== product.slug &&
      !relatedSlugs.has(candidate.slug) &&
      (candidate.category === product.category || candidate.brand === product.brand),
  );

  return [...relatedBySlug, ...fallbackProducts].slice(0, limit);
}

function dedupeBySlug(products: StoreProduct[]) {
  return [...new Map(products.map((product) => [product.slug, product])).values()];
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely parse a price string like "Rs 51,999" or "NPR 85,000" to a number.
 * Returns 0 if the value is missing or unparseable.
 */
export function parseProductPrice(value: number | string | undefined | null): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const numericPrice = Number(String(value).match(/\d+(?:\.\d+)?/g)?.join("") ?? "");
  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

/** Normalize a category string for comparison (lowercase, trimmed). */
function normalizeCategory(value: string | undefined | null): string {
  return (value ?? "").toLowerCase().trim();
}

/** Normalize a brand string for comparison. */
function normalizeBrand(value: string | undefined | null): string {
  return (value ?? "").toLowerCase().trim();
}

/** Return all searchable keywords for a product. */
function getProductKeywords(product: StoreProduct): string[] {
  return (product.searchTerms ?? []).map((t) => t.toLowerCase().trim());
}

export type RecommendedProduct = StoreProduct & {
  /** Human-readable reason for the recommendation (max 2). */
  reasons: string[];
};

export interface GetRecommendedProductsOptions {
  /** Maximum number of recommendations to return (default: 4). */
  limit?: number;
}

/**
 * Score-based recommendation engine.
 *
 * Scoring weights:
 *   +50  same category
 *   +30  same brand
 *   +10  each overlapping search term (capped at 3 matches)
 *   +30  price within 10 %
 *   +20  price within 20 %
 *   +10  price within 30 %
 *   + 5  product is featured or best-seller
 */
export function getRecommendedProducts(
  currentProduct: StoreProduct,
  options: GetRecommendedProductsOptions = {},
): RecommendedProduct[] {
  const { limit = 4 } = options;

  const currentPrice = parseProductPrice(currentProduct.currentPrice);
  const currentCategory = normalizeCategory(currentProduct.category);
  const currentBrand = normalizeBrand(currentProduct.brand);
  const currentKeywords = new Set(getProductKeywords(currentProduct));

  const candidates = getActiveProducts().filter(
    (p) =>
      p.slug !== currentProduct.slug &&
      p.status !== "Out of Stock",
  );

  type Scored = { product: StoreProduct; score: number; reasons: string[] };

  const scored: Scored[] = candidates.map((product) => {
    let score = 0;
    const reasons: string[] = [];

    // ── Category match ──────────────────────────────────────────────────────
    if (normalizeCategory(product.category) === currentCategory) {
      score += 50;
      reasons.push("Same Category");
    }

    // ── Brand match ─────────────────────────────────────────────────────────
    if (normalizeBrand(product.brand) === currentBrand) {
      score += 30;
      reasons.push("Same Brand");
    }

    // ── Keyword overlap ─────────────────────────────────────────────────────
    const productKeywords = getProductKeywords(product);
    let keywordMatches = 0;
    for (const kw of productKeywords) {
      if (currentKeywords.has(kw)) {
        keywordMatches++;
        if (keywordMatches >= 3) break;
      }
    }
    score += keywordMatches * 10;

    // ── Price proximity ─────────────────────────────────────────────────────
    if (currentPrice > 0) {
      const candidatePrice = parseProductPrice(product.currentPrice);
      if (candidatePrice > 0) {
        const diff = Math.abs(candidatePrice - currentPrice) / currentPrice;
        if (diff <= 0.1) {
          score += 30;
          reasons.push("Similar Price");
        } else if (diff <= 0.2) {
          score += 20;
          reasons.push("Similar Price");
        } else if (diff <= 0.3) {
          score += 10;
          reasons.push("Similar Price");
        }
      }
    }

    // ── Featured / best-seller bonus ────────────────────────────────────────
    if (product.isFeatured || product.isBestSeller) {
      score += 5;
    }

    return { product, score, reasons };
  });

  // Sort descending by score, then alphabetically as tiebreaker
  scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));

  return scored.slice(0, limit).map(({ product, reasons }) => ({
    ...product,
    // Keep at most 2 reason badges; prefer the most informative ones
    reasons: [...new Set(reasons)].slice(0, 2),
  }));
}
