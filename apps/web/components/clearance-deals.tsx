"use client";

import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { ProductCard } from "./product-card";

type ClearanceProduct = {
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
};

const clearanceProducts: ClearanceProduct[] = [
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
  },
  {
    id: "clearance-7",
    slug: "himstar-hw-80fs8btkgz-8kg",
    name: "Himstar 8KG Front Load Fully Automatic Washing Machine HW-80FS8BTKGZ",
    shortDescription:
      "Inverter motor | 1400 RPM | Built-in heater | LED display | 10 years motor warranty",
    image: "/images/Himstar 8kg washing machine(clearance-7).png",
    currentPrice: "Rs. 44,990",
    oldPrice: "Rs. 74,990",
    badge: "41% Off",
    href: "/products/himstar-hw-80fs8btkgz-8kg",
  },
  {
    id: "clearance-8",
    slug: "tcl-43v6b-43-inch-4k-smart-tv",
    name: "TCL 43V6B 43 inch 4K Smart TV",
    shortDescription:
      "Google TV | HDR10/HLG | Metallic bezel-less design | HDMI 2.1 with eARC",
    image: "/images/TCL 43 inch 43V6B(clearance-8).png",
    currentPrice: "Rs. 45,000",
    oldPrice: "Rs. 56,000",
    badges: ["2024 Model", "20% Off"],
    href: "/products/tcl-43v6b-43-inch-4k-smart-tv",
  },
];

export function ClearanceDeals() {
  const { addItem, getQuantity } = useCart();
  const { hasItem, toggleItem } = useWishlist();

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Limited Stock
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-wide text-foreground sm:text-3xl">
              CLEARANCE DEALS
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {clearanceProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              quantityInCart={getQuantity(product.id)}
              isWishlisted={hasItem(product.id)}
              onAddToCart={() => addItem(product)}
              onToggleWishlist={() => toggleItem(product)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
