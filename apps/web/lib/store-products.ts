export type StoreProductStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  currentPrice: string;
  oldPrice?: string;
  badge?: string;
  badges?: string[];
  href: string;
  brand: string;
  category: string;
  status?: StoreProductStatus;
  searchTerms?: string[];
};

export const trendingProducts: StoreProduct[] = [
  {
    id: "1",
    slug: "samsung-253l-double-door-refrigerator",
    name: "Samsung 253L Double Door Frost Free Refrigerator RT28A3022GS/IM",
    shortDescription: "Digital Inverter | Energy Efficient | 10 Year Warranty",
    image: "/images/Samsung Double door 245 Litres.png",
    currentPrice: "Rs 51,999",
    oldPrice: "Rs 56,000",
    badge: "Rs 4,001 Off",
    href: "/products/samsung-253l-double-door",
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
    image: "/images/Samsung 192Litre Single door refrigerator.jpeg",
    currentPrice: "Rs 32,980",
    oldPrice: "Rs 36,500",
    badge: "New Arrival / Rs 3,520 Off",
    href: "/products/samsung-192l-single-door",
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
    image: "/images/himstal 165 Litre deepfreezer.png",
    currentPrice: "Rs 37,900",
    oldPrice: "Rs 41,200",
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
    image: "/images/Samsung 65 inch tv.png",
    currentPrice: "Rs 1,29,000",
    oldPrice: "Rs 1,35,000",
    badge: "New Arrival / Rs 6,000 Off",
    href: "/products/samsung-65-crystal-uhd-tv",
    brand: "Samsung",
    category: "Smart TVs",
    status: "In Stock",
    searchTerms: ["tv", "television", "4k tv"],
  },
];

export const clearanceProducts: StoreProduct[] = [
  {
    id: "clearance-1",
    slug: "godrej-rdedge-205bxp-190l",
    name: "Godrej 190 Liter Single Door Refrigerator - RDEDGE 205BXP THF BR WN",
    shortDescription:
      "Direct Cool | 190L gross capacity | Toughened glass shelves | 10 years compressor warranty",
    image: "/images/godrej 184 L(clearance-4).png",
    currentPrice: "Rs. 26,390",
    oldPrice: "Rs. 32,390",
    badge: "19% Off",
    href: "/products/godrej-rdedge-205bxp-190l",
    brand: "Godrej",
    category: "Refrigerators",
    status: "Low Stock",
    searchTerms: ["fridge", "direct cool"],
  },
  {
    id: "clearance-2",
    slug: "himstar-hr-21d92brj-190l",
    name: "Himstar 190 Ltr Refrigerator HR-21D92BRJ",
    shortDescription:
      "Maroon finish | 190L capacity | Stabilizer free operation | 10 years compressor warranty",
    image: "/images/Himstar 210BHN (clearance-5)png.png",
    currentPrice: "Rs. 24,990",
    oldPrice: "Rs. 30,490",
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
    image: "/images/samsung 6U (clearance-4).png",
    currentPrice: "Rs. 34,000",
    oldPrice: "Rs. 39,590",
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
    image: "/images/godrej 184 L(clearance-4).png",
    currentPrice: "Rs. 31,790",
    oldPrice: "Rs. 40,090",
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
    image: "/images/himstat 192 litres(clerance-2).png",
    currentPrice: "Rs. 27,000",
    oldPrice: "Rs. 32,990",
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
    image: "/images/samsung NPIM 256L double door(clearance-6).png",
    currentPrice: "Rs. 51,000",
    oldPrice: "Rs. 60,990",
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
    image: "/images/Himstar 8kg washing machine (clearance-7).png",
    currentPrice: "Rs. 44,990",
    oldPrice: "Rs. 74,990",
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
    image: "/images/TCL 43 inch 43V6B 4k(clearance-8).png",
    currentPrice: "Rs. 45,000",
    oldPrice: "Rs. 56,000",
    badges: ["2024 Model", "20% Off"],
    href: "/products/tcl-43v6b-43-inch-4k-smart-tv",
    brand: "TCL",
    category: "Smart TVs",
    status: "In Stock",
    searchTerms: ["tv", "television", "google tv", "4k tv"],
  },
];

export const detailProducts: StoreProduct[] = [
  {
    id: "samsung-ua55cu7700",
    slug: "samsung-ua55cu7700-55-inch-crystal-ultra-hd-4k-smart-tv",
    name: "Samsung 55-inch Crystal Ultra HD 4K Smart TV | UA55CU7700",
    shortDescription: "55-inch Crystal Ultra HD 4K display with Tizen OS",
    image:
      "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop",
    currentPrice: "Rs 89,000",
    oldPrice: "Rs 95,000",
    badge: "Global No.1 TV",
    href: "/products/samsung-ua55cu7700-55-inch-crystal-ultra-hd-4k-smart-tv",
    brand: "Samsung",
    category: "Televisions",
    status: "In Stock",
    searchTerms: ["tv", "television", "smart tv", "4k tv"],
  },
];

export const storeProducts: StoreProduct[] = dedupeBySlug([
  ...trendingProducts,
  ...clearanceProducts,
  ...detailProducts,
]);

function dedupeBySlug(products: StoreProduct[]) {
  return [...new Map(products.map((product) => [product.slug, product])).values()];
}
