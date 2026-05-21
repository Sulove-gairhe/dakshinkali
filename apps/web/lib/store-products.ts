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
    image: "/images/Samsung Double door 245 Litres.png",
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
    image: "/images/Samsung 192Litre Single door refrigerator.jpeg",
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
    image: "/images/himstal 165 Litre deepfreezer.png",
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
    image: "/images/Samsung 65 inch tv.png",
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
    image: "/images/Samsung 9kg washing machine( Best Sellers-1).png",
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
    image: "/images/samsung 55' inch tv (bestseller-2).png",
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
    image: "/images/Samsung double door 192 Litres single door refrigerators( Best Sellers-3).png",
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
    image: "/images/CG hot and cold water dispenser (bestseller-4).png",
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
    image: "/images/Himstar 43 inch tv( Best Sellers-5).png",
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
    image: "/images/samsung single door 192 liters (bestseller-6).png",
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
    image: "/images/samsung 7kg semi automatic washingmachine(best sellers-7).png",
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
    image: "/images/Samsung 43 inch tv 2k( Best Sellers-8).png",
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
    slug: "godrej-rdedge-205bxp-190l",
    name: "Godrej 190 Liter Single Door Refrigerator - RDEDGE 205BXP THF BR WN",
    shortDescription:
      "Direct Cool | 190L gross capacity | Toughened glass shelves | 10 years compressor warranty",
    image: "/images/godrej 184 L(clearance-4).png",
    currentPrice: "Rs. 26,390",
    oldPrice: "Rs. 32,390",
    warranty: "10 Years Compressor Warranty",
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
    image: "/images/samsung 6U (clearance-4).png",
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
    image: "/images/godrej 184 L(clearance-4).png",
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
    image: "/images/himstat 192 litres(clerance-2).png",
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
    image: "/images/samsung NPIM 256L double door(clearance-6).png",
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
    image: "/images/Himstar 8kg washing machine (clearance-7).png",
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
    image: "/images/TCL 43 inch 43V6B 4k(clearance-8).png",
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
