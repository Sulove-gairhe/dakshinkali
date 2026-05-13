"use client"

import { useState, useEffect } from "react"
import { Search, GitCompareArrows, Heart, ShoppingCart, User, ChevronDown, Wrench } from "lucide-react"

type BrandItem = {
  label: string
  href?: string
}

type MenuItem = {
  label: string
  href?: string
  highlighted?: boolean
  icon?: React.ElementType
}

type NavbarProps = {
  brandName?: string
  brandInitial?: string
  searchPlaceholder?: string
  cartCount?: number
  brands?: BrandItem[]
  menuItems?: MenuItem[]
  onSearch?: (query: string) => void
  compareHref?: string
  wishlistHref?: string
  cartHref?: string
  accountHref?: string
}

const defaultBrands: BrandItem[] = [
  { label: "Samsung", href: "#" },
  { label: "Himstar", href: "#" },
  { label: "Godrej", href: "#" },
  { label: "TCL", href: "#" },
  { label: "CG", href: "#" },
  { label: "Whirlpool", href: "#" },
]

const defaultMenuItems: MenuItem[] = [
  { label: "HOME APPLIANCES", href: "#" },
  { label: "PARTS", href: "#" },
  { label: "TELEVISIONS", href: "#" },
  { label: "DEALS", href: "#" },
  { label: "REQUEST TECHNICIAN", href: "#", highlighted: true, icon: Wrench },
]

export function Navbar({
  brandName = "Dakshinkali Electronics",
  brandInitial = "D",
  searchPlaceholder = "Search for TVs, refrigerators, appliances...",
  cartCount = 0,
  brands = defaultBrands,
  menuItems = defaultMenuItems,
  onSearch,
  compareHref = "#",
  wishlistHref = "#",
  cartHref = "#",
  accountHref = "#",
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isBrandsOpen, setIsBrandsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const mobileBrandName = brandName.split(" ")[0] || brandName

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-xl shadow-sm"
          : "bg-white border-b border-gray-200"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-xl font-bold text-primary-foreground">{brandInitial}</span>
              </div>
              <span className="hidden text-lg font-bold text-foreground lg:block">
                {brandName}
              </span>
              <span className="hidden text-lg font-bold text-foreground sm:block lg:hidden">
                {mobileBrandName}
              </span>
            </a>
          </div>

          <div className="flex max-w-2xl flex-1 items-center">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-11 w-full rounded-l-lg border border-r-0 border-gray-300 bg-white px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => onSearch?.(searchQuery)}
              className="flex h-11 items-center justify-center rounded-r-lg bg-primary px-5 transition-colors duration-300 hover:bg-primary/90"
            >
              <Search className="h-5 w-5 text-primary-foreground" />
            </button>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <IconButton icon={GitCompareArrows} label="Compare" href={compareHref} />
            <IconButton icon={Heart} label="Wishlist" href={wishlistHref} />
            <IconButton icon={ShoppingCart} label="Cart" href={cartHref} badge={cartCount} />
            <IconButton icon={User} label="Account" href={accountHref} />
          </nav>

          <a
            href={cartHref}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden"
          >
            <ShoppingCart className="h-5 w-5" />
          </a>
        </div>
      </div>
      <div
  className="relative z-40 bg-secondary"
  onMouseLeave={() => setIsBrandsOpen(false)}
>
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <nav className="scrollbar-hide flex items-center gap-2 overflow-x-auto py-3">
      <div
        className="shrink-0"
        onMouseEnter={() => setIsBrandsOpen(true)}
      >
        <button
          type="button"
          className="flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors duration-300 hover:bg-white/10 hover:text-primary"
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
        const ItemIcon = item.icon
        return (
          <a
            key={item.label}
            href={item.href || "#"}
            className={
              item.highlighted
                ? "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-primary/20 px-3 py-1.5 text-sm font-medium text-primary transition-colors duration-300 hover:bg-primary/30"
                : "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors duration-300 hover:bg-white/10 hover:text-primary"
            }
          >
            {ItemIcon ? <ItemIcon className="h-4 w-4" /> : null}
            {item.label}
          </a>
        )
      })}
    </nav>
  </div>

  {isBrandsOpen && (
    <div
      className="absolute left-4 top-full z-[80] w-56 rounded-xl border border-border bg-card py-3 shadow-2xl sm:left-6 lg:left-[max(2rem,calc((100vw-88rem)/2+2rem))]"
      onMouseEnter={() => setIsBrandsOpen(true)}
    >
      {brands.map((brand, index) => (
        <a
          key={brand.label}
          href={brand.href || "#"}
          className={`block px-4 py-3 text-sm font-semibold text-card-foreground transition-all duration-200 hover:translate-x-1 hover:text-primary ${
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
  )
}

function IconButton({
  icon: Icon,
  label,
  badge,
  href = "#",
}: {
  icon: React.ElementType
  label: string
  badge?: number
  href?: string
}) {
  return (
    <a href={href} className="group flex flex-col items-center gap-1 text-foreground">
      <div className="relative">
        <Icon className="h-5 w-5 transition-colors duration-300 group-hover:text-primary" />
        {typeof badge === "number" && badge > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-foreground">
        {label}
      </span>
    </a>
  )
}
