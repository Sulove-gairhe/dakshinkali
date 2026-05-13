import type { ProductDetailData } from '@/types/product'
import { ProductDetail } from '@/components/product/product-detail'

// Samsung TV product data
const PRODUCT_DATA: ProductDetailData = {
  id: 'samsung-ua55cu7700',
  slug: 'samsung-ua55cu7700-55-inch-crystal-ultra-hd-4k-smart-tv',
  name: 'Samsung 55-inch Crystal Ultra HD 4K Smart TV | UA55CU7700',
  category: 'Televisions',
  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Televisions', href: '/products?category=televisions' },
    { label: 'Samsung UA55CU7700 55-inch Crystal Ultra HD 4K Smart TV' },
  ],
  badge: 'Global No.1 TV',
  ratingText: '',
  currentPrice: 'Rs 89,000',
  features: [
    '55-inch Crystal Ultra HD 4K display',
    '3840 x 2160 screen resolution',
    'Crystal Processor 4K with UHD upscaling',
    'PurColor with 1 Billion Color Shades',
    'HDR and HDR 10+ support',
    'Tizen OS Smart TV platform',
    'Bixby, Alexa, and Google Assistant support, availability varies by region',
    'SmartThings App support',
    'HDMI x3, USB x1, Digital Audio Out Optical x1, RF In',
    'HDMI eARC and Bluetooth v5.2',
    'Game Mode with Auto Low Latency Mode',
    'Adaptive Sound, OTS Lite, and Q-Symphony',
    '20W 2CH stereo sound',
    'Mobile to TV Mirroring, Sound Mirroring, and TV Sound to Mobile',
    'DVB-T2 Digital Broadcasting and Analog Tuner',
  ],
  images: [
    {
      id: 'img-1',
      src: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop',
      alt: 'Samsung UA55CU7700 - Front View',
    },
    {
      id: 'img-2',
      src: 'https://images.unsplash.com/photo-1559720595-4b7b2c0f0b0a?w=600&h=600&fit=crop',
      alt: 'Samsung UA55CU7700 - Side View',
    },
    {
      id: 'img-3',
      src: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop',
      alt: 'Samsung UA55CU7700 - Detail View',
    },
    {
      id: 'img-4',
      src: 'https://images.unsplash.com/photo-1559720595-4b7b2c0f0b0a?w=600&h=600&fit=crop',
      alt: 'Samsung UA55CU7700 - Top View',
    },
    {
      id: 'img-5',
      src: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop',
      alt: 'Samsung UA55CU7700 - Back View',
    },
    {
      id: 'img-6',
      src: 'https://images.unsplash.com/photo-1559720595-4b7b2c0f0b0a?w=600&h=600&fit=crop',
      alt: 'Samsung UA55CU7700 - In Use',
    },
  ],
  variants: [],
  descriptionSections: [
    {
      id: 'intro',
      title: 'Samsung UA55CU7700 55-inch Crystal Ultra HD 4K Smart TV',
      body: [
        'Introducing the Samsung UA55CU7700 55-inch Crystal Ultra HD 4K Smart TV, a cutting-edge addition to your home entertainment setup. With a stunning 4K Ultra HD resolution of 3840 x 2160, this TV delivers crystal-clear visuals that bring your favorite content to life. Its Tizen OS ensures smooth navigation and access to smart entertainment features, making it a true smart TV for modern homes.',
      ],
    },
    {
      id: 'visuals',
      title: 'Immersive Visuals',
      body: [
        'The UA55CU7700 offers an impressive 55-inch screen size, perfect for immersive and cinematic viewing experiences. With a screen resolution of 3840 x 2160, this TV delivers sharp, vivid, and detailed visuals. The slim look and bezel-less design provide an edge-to-edge viewing experience while adding a premium touch to your living space.',
      ],
      bullets: [
        '55-inch display size',
        '4K Ultra HD resolution',
        'Crystal Processor 4K',
        '1 Billion Color Shades',
        'HDR and HDR 10+ support',
        'PurColor technology',
        'Contrast Enhancer',
        'Motion Xcelerator',
        'Filmmaker Mode',
      ],
    },
    {
      id: 'connectivity',
      title: 'Seamless Connectivity',
      bullets: [
        'HDMI x3',
        'USB x1',
        'Digital Audio Out Optical x1',
        'RF In',
        'HDMI eARC',
        'Bluetooth v5.2',
      ],
    },
    {
      id: 'smart-features',
      title: 'Smart Features Galore',
      body: [
        'Powered by Tizen OS, the Samsung UA55CU7700 gives users access to smart entertainment, voice assistants, and connected home features. With Bixby, Alexa, Google Assistant support, SmartThings App support, Mobile to TV Mirroring, Sound Mirroring, and Easy Setup, this TV is built for convenience and connected living.',
      ],
      bullets: [
        'Tizen OS',
        'Bixby support',
        'Alexa and Google Assistant support',
        'SmartThings App support',
        'Mobile to TV Mirroring',
        'TV Sound to Mobile',
        'Sound Mirroring',
        'Easy Setup',
        'Samsung TV Plus support where available',
      ],
    },
    {
      id: 'gaming',
      title: 'Enhanced Gaming',
      body: [
        'For gamers, the UA55CU7700 includes Game Mode with Auto Game Mode and ALLM support. This helps reduce input lag and gives a more responsive gaming experience, making it suitable for casual console gaming and entertainment use.',
      ],
      bullets: [
        'Game Mode',
        'Auto Game Mode',
        'ALLM support',
        'Motion Xcelerator',
        'Smooth 4K gaming visuals',
      ],
    },
    {
      id: 'audio',
      title: 'Immersive Audio',
      body: [
        'The TV delivers rich and clear sound with Adaptive Sound, OTS Lite, Q-Symphony, and 20W 2CH stereo output. Bluetooth Audio, Bluetooth Two-Way Audio, and Multiroom Link make the sound experience more flexible for home entertainment setups.',
      ],
      bullets: [
        'Q-Symphony',
        'Adaptive Sound',
        'OTS Lite',
        '20W 2CH stereo sound',
        'Multiroom Link',
        'Bluetooth Audio',
        'Bluetooth Two-Way Audio',
      ],
    },
    {
      id: 'specifications',
      title: 'Specifications',
      body: [
        'Series: CU Series',
        'Screen Size: 55 inch',
        'Screen Resolution: 3840 x 2160',
        'Smart TV: Yes',
        'Smart TV OS: Tizen OS',
        'TV Resolution: 4K Ultra HD 2160p',
        'Design: Slim Look, 3-side bezel-less',
        'Connectivity: HDMI x3, USB x1, Digital Audio Out Optical x1, RF In, HDMI eARC, Bluetooth v5.2',
        'Video: Crystal Processor 4K, 1 Billion Color Shades, HDR, HDR 10+, Hybrid Gamma Log, Mega Contrast, PurColor, Contrast Enhancer, Film Mode, Motion Xcelerator, Filmmaker Mode',
        'Audio: Q-Symphony, Adaptive Sound, OTS Lite, 20W 2CH Stereo Sound, Multiroom Link, Bluetooth Audio, Bluetooth Two-Way Audio',
        'Additional Features: Analog Tuner, DVB-T2 Digital Broadcasting, Game Mode, Tap View',
        'What\'s in the box: 1 cable, 1 remote, 1 manual, 1 LED TV',
      ],
    },
  ],
}

export default function ProductPage() {
  return <ProductDetail product={PRODUCT_DATA} />
}
