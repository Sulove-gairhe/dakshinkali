"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CartItem } from "@/components/cart-provider";
import {
  Search,
  GitCompareArrows,
  Heart,
  ShoppingCart,
  User,
  ChevronDown,
  Wrench,
} from "lucide-react";

type BrandItem = {
  label: string;
  href?: string;
};

type MenuItem = {
  label: string;
  href?: string;
  highlighted?: boolean;
  icon?: React.ElementType;
};

type NavbarProps = {
  brandName?: string;
  brandLogoSrc?: string;
  searchPlaceholder?: string;
  cartCount?: number;
  wishlistCount?: number;
  cartPreviewItems?: CartItem[];
  compareCount?: number;
  brands?: BrandItem[];
  menuItems?: MenuItem[];
  onSearch?: (query: string) => void;
  compareHref?: string;
  wishlistHref?: string;
  cartHref?: string;
  accountHref?: string;
};

const defaultBrands: BrandItem[] = [
  { label: "Samsung", href: "/products?brand=samsung" },
  { label: "Himstar", href: "/products?brand=himstar" },
  { label: "Godrej", href: "/products?brand=godrej" },
  { label: "TCL", href: "/products?brand=tcl" },
  { label: "CG", href: "/products?brand=cg" },
  { label: "Whirlpool", href: "/products?brand=whirlpool" },
];

const defaultMenuItems: MenuItem[] = [
  { label: "HOME APPLIANCES", href: "/products" },
  { label: "PARTS", href: "/products?category=parts" },
  { label: "TELEVISIONS", href: "/products?category=televisions" },
  { label: "DEALS", href: "/products?sort=deals" },
  { label: "REQUEST TECHNICIAN", href: "/contact", highlighted: true, icon: Wrench },
];

export function Navbar({
  brandName = "Dakshinkali Electronics",
  brandLogoSrc = "/images/logo-placeholder-transparent.png",
  searchPlaceholder = "Search for TVs, refrigerators, appliances...",
  cartCount = 0,
  wishlistCount = 0,
  cartPreviewItems = [],
  compareCount = 0,
  brands = defaultBrands,
  menuItems = defaultMenuItems,
  onSearch,
  compareHref = "/compare",
  wishlistHref = "/wishlist",
  cartHref = "/cart",
  accountHref = "/account",
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isBrandsOpen, setIsBrandsOpen] = useState(false);
  const [showSecondaryNav, setShowSecondaryNav] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);
      setShowSecondaryNav(currentScrollY === 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const mobileBrandName = brandName.split(" ")[0] || brandName;

  function handleSearch(event?: React.FormEvent) {
    event?.preventDefault();

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      router.push('/products');
      return;
    }

    router.push(`/products?q=${encodeURIComponent(trimmedQuery)}`);
    onSearch?.(trimmedQuery);
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-xl shadow-sm"
          : "bg-white border-b border-gray-200"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-200 ${showSecondaryNav ? 'h-14 gap-3 lg:h-16' : 'h-12 gap-2 lg:h-14'}`}>
          <div className="flex-shrink-0">
            <Link href="/" className={`flex items-center transition-all duration-200 ${showSecondaryNav ? 'gap-2' : 'gap-1.5'}`}>
              <div className={`relative flex items-center justify-center overflow-hidden rounded-lg border border-border bg-white transition-all duration-200 ${showSecondaryNav ? 'h-10 w-10 lg:h-12 lg:w-12' : 'h-8 w-8 lg:h-10 lg:w-10'}`}>
                <Image
                  src={brandLogoSrc}
                  alt={`${brandName} logo`}
                  fill
                  sizes="48px"
                  className="h-full w-full object-contain p-0.5"
                />
              </div>
              <span className={`hidden font-bold leading-none text-foreground transition-all duration-200 lg:block ${showSecondaryNav ? 'text-base' : 'text-sm'}`}>
                {brandName}
              </span>
              <span className={`hidden font-bold leading-none text-foreground transition-all duration-200 sm:block lg:hidden ${showSecondaryNav ? 'text-base' : 'text-sm'}`}>
                {mobileBrandName}
              </span>
            </Link>
          </div>

          <form className="flex max-w-2xl flex-1 items-center transition-all duration-200" onSubmit={handleSearch}>
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className={`w-full rounded-l-lg border border-r-0 border-gray-300 bg-white px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200 ${showSecondaryNav ? 'h-10 lg:h-11' : 'h-9 lg:h-10'}`}
              />
            </div>
            <button
              type="submit"
              className={`flex items-center justify-center rounded-r-lg bg-primary px-4 transition-all duration-200 hover:bg-primary/90 ${showSecondaryNav ? 'h-10 lg:h-11 lg:px-5' : 'h-9 lg:h-10 lg:px-4'}`}
            >
              <Search className={`text-primary-foreground transition-all duration-200 ${showSecondaryNav ? 'h-4 w-4 lg:h-5 lg:w-5' : 'h-3.5 w-3.5 lg:h-4 lg:w-4'}`} />
            </button>
          </form>

            <nav className={`hidden items-center md:flex transition-all duration-200 ${showSecondaryNav ? 'gap-5' : 'gap-4'}`}>
            <IconButton
              icon={GitCompareArrows}
              label="Compare"
              href={compareHref}
              badge={compareCount}
            />
            <IconButton
              icon={Heart}
              label="Wishlist"
              href={wishlistHref}
              badge={wishlistCount}
            />
            <CartPreviewButton
              href={cartHref}
              badge={cartCount}
              items={cartPreviewItems}
            />
            <IconButton icon={User} label="Account" href={accountHref} />
          </nav>

            <div className="flex items-center gap-1 md:hidden">
            <MobileIconButton
              icon={GitCompareArrows}
              label="Compare"
              href={compareHref}
              badge={compareCount}
            />
            <MobileIconButton
              icon={Heart}
              label="Wishlist"
              href={wishlistHref}
              badge={wishlistCount}
            />
            <MobileIconButton
              icon={ShoppingCart}
              label="Cart"
              href={cartHref}
              badge={cartCount}
            />
          </div>
        </div>
      </div>
      <div
        className={`relative z-40 origin-top bg-secondary transform-gpu transition-[transform,opacity,max-height,padding] duration-200 ease-out overflow-hidden ${
          showSecondaryNav ? 'max-h-14 translate-y-0 py-0 opacity-100' : 'pointer-events-none max-h-0 -translate-y-2 py-0 opacity-0'
        }`}
        onMouseLeave={() => setIsBrandsOpen(false)}
      >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="scrollbar-hide flex items-center gap-1.5 overflow-x-auto py-2.5">
              <div
                className="shrink-0"
                onMouseEnter={() => setIsBrandsOpen(true)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-secondary-foreground transition-colors duration-300 hover:bg-white/10 hover:text-primary"
                >
                  BY BRANDS
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isBrandsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {menuItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href || "/products"}
                    className={
                      item.highlighted
                        ? "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-primary/20 px-2.5 py-1.5 text-sm font-medium text-primary transition-colors duration-300 hover:bg-primary/30"
                        : "shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-secondary-foreground transition-colors duration-300 hover:bg-white/10 hover:text-primary"
                    }
                  >
                    {ItemIcon ? <ItemIcon className="h-4 w-4" /> : null}
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>

          {isBrandsOpen && (
            <div
              className="absolute left-4 top-full z-[80] w-52 rounded-xl border border-border bg-card py-2.5 shadow-2xl sm:left-6 lg:left-[max(2rem,calc((100vw-88rem)/2+2rem))]"
              onMouseEnter={() => setIsBrandsOpen(true)}
            >
              {brands.map((brand, index) => (
                <a
                  key={brand.label}
                  href={brand.href || "/products"}
                  className={`block px-4 py-2.5 text-sm font-semibold text-card-foreground transition-all duration-200 hover:translate-x-1 hover:text-primary ${
                    index !== brands.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  {brand.label}
                </a>
              ))}
            </div>
          )}
      </div>
    </header>
  );
}

function IconButton({
  icon: Icon,
  label,
  badge,
  href = "#",
}: {
  icon: React.ElementType;
  label: string;
  badge?: number;
  href?: string;
}) {
  return (
    <a
      href={href}
      className="group flex flex-col items-center gap-0.5 text-foreground transition-all duration-200"
    >
      <div className="relative">
        <Icon className="h-4 w-4 transition-all duration-200 group-hover:text-primary" />
        {typeof badge === "number" && badge > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-foreground transition-all duration-200">
        {label}
      </span>
    </a>
  );
}

function CartPreviewButton({
  href = "#",
  badge,
  items,
}: {
  href?: string;
  badge?: number;
  items: CartItem[];
}) {
  const previewItems = items.slice(0, 2);

  return (
    <div className="group/cart relative">
      <a href={href} className="group flex flex-col items-center gap-0.5 text-foreground transition-all duration-200">
        <div className="relative">
          <ShoppingCart className="h-4 w-4 transition-all duration-200 group-hover:text-primary" />
          {typeof badge === "number" && badge > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {badge}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wide text-foreground transition-all duration-200">
          Cart
        </span>
      </a>

      <div className="pointer-events-none absolute right-0 top-full z-[90] hidden w-80 pt-4 opacity-0 transition-all duration-200 group-hover/cart:block group-hover/cart:pointer-events-auto group-hover/cart:opacity-100 group-focus-within/cart:block group-focus-within/cart:pointer-events-auto group-focus-within/cart:opacity-100">
        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Cart Preview
              </h3>
              {typeof badge === "number" && badge > 0 && (
                <span className="mt-1 inline-flex rounded-full bg-yellow-200 px-2.5 py-1 text-xs font-bold text-black">
                  {badge} {badge === 1 ? "item" : "items"}
                </span>
              )}
            </div>
            <Link
              href={href}
              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-muted"
            >
              View Cart
            </Link>
          </div>

          {previewItems.length > 0 ? (
            <>
              <div className="space-y-3">
                {previewItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[60px_minmax(0,1fr)] gap-3 rounded-md border border-border/70 p-2 transition-colors hover:bg-muted/50"
                  >
                    <Link
                      href={item.href}
                      className="relative aspect-square overflow-hidden rounded-md bg-muted"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="60px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="min-w-0">
                      <Link
                        href={item.href}
                        className="line-clamp-2 text-xs font-bold transition-colors hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                      <p className="mt-1 text-sm font-bold">{item.currentPrice}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Link
                  href="/cart"
                  className="group/checkout relative inline-flex w-full items-center justify-center overflow-hidden rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg"
                >
                  <span className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-white/30 transition-transform duration-500 group-hover/checkout:translate-x-[420%]" />
                  <span className="relative">Proceed to Checkout</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-center">
              <p className="text-sm font-semibold">Your cart is empty</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a product to preview it here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileIconButton({
  icon: Icon,
  label,
  badge,
  href = "#",
}: {
  icon: React.ElementType;
  label: string;
  badge?: number;
  href?: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-all duration-200 hover:bg-muted"
    >
      <span className="relative">
        <Icon className="h-4 w-4 transition-all duration-200" />
        {typeof badge === "number" && badge > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {badge}
          </span>
        )}
      </span>
    </a>
  );
}
