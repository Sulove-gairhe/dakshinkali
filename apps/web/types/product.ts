export type ProductDetailData = {
  id: string
  slug: string
  name: string
  category: string
  breadcrumbs: { label: string; href?: string }[]
  badge?: string
  ratingText?: string
  currentPrice: string
  oldPrice?: string
  features: string[]
  images: { id: string; src: string; alt: string }[]
  variants?: {
    label: string
    options: { label: string; value: string; selected?: boolean }[]
  }[]
  descriptionSections: {
    id: string
    title?: string
    subtitle?: string
    body?: string[]
    bullets?: string[]
    image?: { src: string; alt: string }
  }[]
}
