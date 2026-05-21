export type BlogContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "heading";
      text: string;
    }
  | {
      type: "list";
      items: string[];
    }
  | {
      type: "tip";
      text: string;
    };

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  status: "draft" | "published";
  featured: boolean;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  content: BlogContentBlock[];
};

export const blogPosts: BlogPost[] = [
  {
    id: "blog-tv-size-guide",
    slug: "which-tv-size-should-you-buy",
    title: "Which TV Size Should You Buy?",
    excerpt: "43, 55, or 65 inches? A simple room-size guide before you spend.",
    category: "Television Guide",
    readTime: "4 min read",
    coverImage: "/images/blogs/tv-size-guide.jpg",
    author: "Dakshinkali Electronics",
    publishedAt: "2026-05-21",
    status: "published",
    featured: true,
    tags: ["Television", "Smart TV", "Buying Guide", "Living Room"],
    seoTitle: "Which TV Size Should You Buy? | Dakshinkali Electronics",
    seoDescription:
      "A simple TV size buying guide for choosing between 43 inch, 55 inch, and 65 inch TVs for your room.",
    content: [
      {
        type: "paragraph",
        text: "Buying a new TV can feel confusing because every showroom and website shows different sizes, features, and prices. But for most homes, the first decision should be simple: choose the right screen size for your room. A TV that is too small may not feel exciting, while a TV that is too large can feel uncomfortable if you sit too close.",
      },
      {
        type: "paragraph",
        text: "The best TV size depends mainly on your viewing distance, room size, and how your family watches TV. If you mostly watch news, YouTube, and regular programs, you may not need the biggest screen. But if your family enjoys movies, football, cricket, or streaming platforms, a larger screen can make the experience much better.",
      },
      {
        type: "heading",
        text: "Start with your viewing distance",
      },
      {
        type: "paragraph",
        text: "Before choosing a TV, measure the distance between your sofa or bed and the place where the TV will be kept. This one step can save you from buying the wrong size.",
      },
      {
        type: "heading",
        text: "Quick size guide",
      },
      {
        type: "list",
        items: [
          "43 inch: Best for bedrooms, small living rooms, and closer viewing.",
          "55 inch: Best for most family living rooms and regular Netflix, YouTube, or sports viewing.",
          "65 inch: Best for larger rooms, home theatre feeling, and families who sit farther from the TV.",
        ],
      },
      {
        type: "heading",
        text: "Think about how your family uses the TV",
      },
      {
        type: "paragraph",
        text: "If the TV is for a bedroom, a 43 inch TV is usually comfortable and budget-friendly. For a main living room, 55 inch is often the safest choice because it feels big enough without becoming too large. If your living room is spacious and your family enjoys movie nights, a 65 inch TV gives a more premium experience.",
      },
      {
        type: "heading",
        text: "Do not choose size only by price",
      },
      {
        type: "paragraph",
        text: "Sometimes customers choose a smaller TV only to save money, then regret it after a few months. At the same time, buying the biggest TV without checking room distance can also be a mistake. The right size should feel comfortable every day, not just impressive in the showroom.",
      },
      {
        type: "tip",
        text: "Our simple recommendation: choose 43 inch for bedrooms, 55 inch for most living rooms, and 65 inch only if your room is large enough. For many Nepali families, 55 inch is the best balance of size, comfort, and value.",
      },
    ],
  },
  {
    id: "blog-refrigerator-family-guide",
    slug: "best-refrigerator-for-nepali-family",
    title: "Best Refrigerator for a Nepali Family",
    excerpt:
      "Single door, double door, or bigger capacity - choose based on your family size.",
    category: "Refrigerator Guide",
    readTime: "4 min read",
    coverImage: "/images/blogs/refrigerator-buying-guide.jpg",
    author: "Dakshinkali Electronics",
    publishedAt: "2026-05-21",
    status: "published",
    featured: true,
    tags: ["Refrigerator", "Family", "Kitchen", "Buying Guide"],
    seoTitle: "Best Refrigerator for a Nepali Family | Dakshinkali Electronics",
    seoDescription:
      "Simple refrigerator buying guide for Nepali families choosing between single door, double door, and larger capacity fridges.",
    content: [
      {
        type: "paragraph",
        text: "A refrigerator is one of the most used appliances in a Nepali home. It stores vegetables, milk, leftovers, fruits, meat, cold drinks, and frozen items. Because it runs every day, choosing the right refrigerator is not just about size or price. It should match your family size, kitchen space, food habits, and electricity usage.",
      },
      {
        type: "paragraph",
        text: "Many customers get confused between single door, double door, and larger capacity refrigerators. The best choice depends on how many people live in the house and how much food you normally store.",
      },
      {
        type: "heading",
        text: "Choose by family size",
      },
      {
        type: "list",
        items: [
          "1-2 people: A compact or small single-door refrigerator is usually enough.",
          "3-4 people: A medium single-door or smaller double-door refrigerator works well.",
          "5 or more people: A double-door or larger capacity refrigerator is usually better.",
          "Joint families: Choose a bigger fridge with more freezer and vegetable storage space.",
        ],
      },
      {
        type: "heading",
        text: "Single door or double door?",
      },
      {
        type: "paragraph",
        text: "Single-door refrigerators are usually more affordable and take less space. They are good for small families, rented rooms, or kitchens with limited space. Double-door refrigerators are better if your family stores more items, uses the freezer often, or wants better separation between fresh food and frozen food.",
      },
      {
        type: "heading",
        text: "Check your kitchen space first",
      },
      {
        type: "paragraph",
        text: "Before buying, measure the space where the refrigerator will be placed. Leave some extra space around the fridge for door opening and ventilation. A refrigerator that fits too tightly may not perform well and can also be difficult to clean around.",
      },
      {
        type: "heading",
        text: "Think about electricity usage",
      },
      {
        type: "paragraph",
        text: "Since a refrigerator runs 24 hours a day, electricity efficiency matters. Choosing a trusted brand and suitable capacity can help avoid unnecessary power use. Do not buy a very large refrigerator if your family does not need that much storage.",
      },
      {
        type: "tip",
        text: "Our simple recommendation: for most 3-4 member families, a medium single-door or double-door refrigerator is a practical choice. If your family stores vegetables, meat, frozen food, and leftovers regularly, a double-door fridge will feel more comfortable.",
      },
    ],
  },
  {
    id: "blog-washing-machine-guide",
    slug: "top-load-vs-front-load-washing-machine",
    title: "Top Load vs Front Load Washing Machine",
    excerpt:
      "Which one saves more water, cleans better, and fits your daily routine?",
    category: "Washing Machine Guide",
    readTime: "4 min read",
    coverImage: "/images/blogs/washing-machine-guide.jpg",
    author: "Dakshinkali Electronics",
    publishedAt: "2026-05-21",
    status: "published",
    featured: true,
    tags: ["Washing Machine", "Top Load", "Front Load", "Home Appliances"],
    seoTitle:
      "Top Load vs Front Load Washing Machine | Dakshinkali Electronics",
    seoDescription:
      "Understand the difference between top-load and front-load washing machines before buying.",
    content: [
      {
        type: "paragraph",
        text: "A washing machine saves time, effort, and daily stress, especially for busy families. But many buyers get confused between top-load and front-load washing machines. Both can clean clothes well, but they are different in comfort, water usage, washing quality, price, and daily handling.",
      },
      {
        type: "paragraph",
        text: "The right choice depends on your family size, how often you wash clothes, your budget, and whether you want simple operation or better fabric care.",
      },
      {
        type: "heading",
        text: "Top-load washing machine",
      },
      {
        type: "paragraph",
        text: "Top-load washing machines are popular because they are easy to use. You load clothes from the top, so you do not need to bend down much. This is helpful for elderly family members or anyone who wants a simple daily washing routine.",
      },
      {
        type: "list",
        items: [
          "Easy to load and unload clothes.",
          "Usually more budget-friendly.",
          "Good for regular family use.",
          "Simple controls and comfortable daily use.",
          "No hot water feature.",
        ],
      },
      {
        type: "heading",
        text: "Front-load washing machine",
      },
      {
        type: "paragraph",
        text: "Front-load washing machines are known for better washing quality and water efficiency. They are usually gentler on clothes and suitable for families who wash frequently or want better care for fabric.",
      },
      {
        type: "list",
        items: [
          "Uses water more efficiently in many cases.",
          "Generally gives better cleaning performance.",
          "Gentler on clothes.",
          "Good for frequent washing and larger laundry loads.",
          "Hot water feature available for deeper cleaning.",
        ],
      },
      {
        type: "heading",
        text: "Which one should you choose?",
      },
      {
        type: "paragraph",
        text: "If your priority is simple use, lower budget, and easy loading, a top-load washing machine is a good choice. If your priority is washing quality, water saving, and fabric care, a front-load washing machine can be better.",
      },
      {
        type: "tip",
        text: "Our simple recommendation: choose top-load for easy family use and budget comfort. Choose front-load if you wash clothes often and want better cleaning with more water efficiency.",
      },
    ],
  },
  {
    id: "blog-ac-inverter-guide",
    slug: "inverter-vs-non-inverter-ac",
    title: "Inverter AC or Non-Inverter AC?",
    excerpt:
      "Understand electricity savings, cooling performance, and upfront cost clearly.",
    category: "Air Conditioner Guide",
    readTime: "3 min read",
    coverImage: "/images/blogs/ac-buying-guide.jpg",
    author: "Dakshinkali Electronics",
    publishedAt: "2026-05-21",
    status: "published",
    featured: true,
    tags: ["AC", "Inverter AC", "Air Conditioner", "Electricity Saving"],
    seoTitle: "Inverter AC or Non-Inverter AC? | Dakshinkali Electronics",
    seoDescription:
      "Simple guide explaining the difference between inverter and non-inverter ACs.",
    content: [
      {
        type: "paragraph",
        text: "When buying an air conditioner, one of the most common questions is whether to choose an inverter AC or a non-inverter AC. Both can cool your room, but they work differently. The difference affects electricity usage, cooling comfort, noise level, and long-term cost.",
      },
      {
        type: "paragraph",
        text: "A non-inverter AC switches the compressor on and off to maintain temperature. An inverter AC adjusts compressor speed based on the cooling need. This makes inverter ACs more efficient when used for longer hours.",
      },
      {
        type: "heading",
        text: "When inverter AC is better",
      },
      {
        type: "list",
        items: [
          "You use AC for many hours during summer.",
          "You want stable room temperature.",
          "You want lower electricity usage over time.",
          "You prefer quieter operation.",
        ],
      },
      {
        type: "heading",
        text: "When non-inverter AC is enough",
      },
      {
        type: "list",
        items: [
          "You use AC occasionally.",
          "Your room does not need cooling for long hours.",
          "You only need cooling for short periods.",
          "Your budget is limited.",
          "You want a lower upfront price.",
        ],
      },
      {
        type: "heading",
        text: "Do not decide only by purchase price",
      },
      {
        type: "paragraph",
        text: "A non-inverter AC may cost less at the beginning, but if you use it daily for long hours, the electricity cost can become higher over time. An inverter AC usually costs more initially, but it can be more economical for regular use.",
      },
      {
        type: "tip",
        text: "Our simple recommendation: if you use AC daily or for long hours, choose inverter AC. If usage is occasional and budget is the main concern, non-inverter AC can still be practical.",
      },
    ],
  },
  {
    id: "blog-water-geyser-guide",
    slug: "water-geyser-buying-guide",
    title: "What to Check Before Buying a Water Geyser",
    excerpt:
      "Capacity, safety, heating time, and family usage explained in simple words.",
    category: "Water Geyser Guide",
    readTime: "3 min read",
    coverImage: "/images/blogs/water-geyser-guide.jpg",
    author: "Dakshinkali Electronics",
    publishedAt: "2026-05-21",
    status: "published",
    featured: true,
    tags: ["Water Geyser", "Bathroom", "Winter", "Buying Guide"],
    seoTitle:
      "What to Check Before Buying a Water Geyser | Dakshinkali Electronics",
    seoDescription:
      "A simple water geyser buying guide covering capacity, safety, and family usage.",
    content: [
      {
        type: "paragraph",
        text: "A water geyser is especially useful during cold mornings, winter months, and homes where hot water is needed regularly. But before buying a geyser, it is important to check more than just price. Capacity, safety, heating time, brand reliability, and installation support all matter.",
      },
      {
        type: "paragraph",
        text: "A good geyser should provide enough hot water for your family without wasting too much electricity or creating safety concerns.",
      },
      {
        type: "heading",
        text: "Choose the right capacity",
      },
      {
        type: "list",
        items: [
          "Small capacity: Good for hand wash, kitchen use, or limited hot water needs.",
          "Medium capacity: Suitable for small families and regular bathroom use.",
          "Larger capacity: Better for bigger families or homes where multiple people use hot water one after another.",
        ],
      },
      {
        type: "heading",
        text: "Safety is very important",
      },
      {
        type: "paragraph",
        text: "Since a geyser deals with water, electricity, and heat together, safety should always be a priority. Choose a trusted brand and make sure installation is done properly. Poor installation can reduce performance and create risk.",
      },
      {
        type: "heading",
        text: "Check heating time and usage pattern",
      },
      {
        type: "paragraph",
        text: "Some families need hot water quickly in the morning, while others use it only occasionally. If your family uses hot water every day, choose a model that heats efficiently and has suitable storage capacity.",
      },
      {
        type: "tip",
        text: "Our simple recommendation: do not buy the cheapest geyser without checking safety and capacity. Choose a reliable model with proper installation support for long-term peace of mind.",
      },
    ],
  },
  {
    id: "blog-send-electronics-nepal",
    slug: "buying-electronics-for-family-in-nepal",
    title: "Buying Electronics for Family in Nepal?",
    excerpt:
      "A helpful guide for NRNs sending appliances home with confidence.",
    category: "Send to Nepal Guide",
    readTime: "4 min read",
    coverImage: "/images/blogs/send-electronics-to-nepal.jpg",
    author: "Dakshinkali Electronics",
    publishedAt: "2026-05-21",
    status: "published",
    featured: true,
    tags: ["NRN", "Send to Nepal", "Family", "Electronics"],
    seoTitle:
      "Buying Electronics for Family in Nepal | Dakshinkali Electronics",
    seoDescription:
      "Helpful guide for NRNs and relatives buying appliances for family in Nepal.",
    content: [
      {
        type: "paragraph",
        text: "Many Nepalis living abroad want to buy useful appliances for their family back home. A refrigerator, washing machine, TV, geyser, or AC can make daily life easier for parents, grandparents, or relatives in Nepal. But buying from far away can feel difficult if you cannot visit the store yourself.",
      },
      {
        type: "paragraph",
        text: "The safest way is to choose products based on your family's real needs, confirm warranty and delivery, and make sure the appliance is suitable for the home where it will be used.",
      },
      {
        type: "heading",
        text: "First, understand the family's actual need",
      },
      {
        type: "list",
        items: [
          "For parents: easy-to-use appliances are often better than complicated smart features.",
          "For large families: capacity matters more than fancy design.",
          "For small homes: size and space should be checked before purchase.",
          "For daily use: warranty, service, and reliability are very important.",
        ],
      },
      {
        type: "heading",
        text: "Confirm delivery and installation",
      },
      {
        type: "paragraph",
        text: "Before finalizing the product, confirm whether delivery is available to the home location and whether installation support is needed. Appliances like washing machines, ACs, and geysers may need proper setup.",
      },
      {
        type: "heading",
        text: "Check warranty and after-sales support",
      },
      {
        type: "paragraph",
        text: "When buying for family in Nepal, after-sales support matters a lot. Choose brands and stores that can guide your family if they need help after purchase.",
      },
      {
        type: "tip",
        text: "Our simple recommendation: if you are buying from abroad, message the store with your budget, family size, delivery location, and preferred appliance. This makes it easier to recommend the right product confidently.",
      },
    ],
  },
];

export const publishedBlogPosts = blogPosts.filter(
  (post) => post.status === "published",
);

export const featuredBlogPosts = publishedBlogPosts.filter(
  (post) => post.featured,
);

export function getBlogPostBySlug(slug: string) {
  return publishedBlogPosts.find((post) => post.slug === slug);
}
