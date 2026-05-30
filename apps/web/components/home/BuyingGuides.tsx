"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { BlogGuideCard } from "@/components/home/BlogGuideCard";
import { FadeUp } from "@/components/ui/FadeUp";
import { featuredBlogPosts } from "@/lib/blog-posts";
import { cn } from "@/lib/utils";

export function BuyingGuides() {
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const scrollCarousel = (direction: "previous" | "next") => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const firstCard = carousel.querySelector<HTMLElement>("[data-blog-card]");
    const cardWidth = firstCard?.offsetWidth ?? carousel.clientWidth;
    const gap = 24;

    carousel.scrollBy({
      left: direction === "next" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  };

  return (
    <section className="overflow-hidden bg-background py-12 text-foreground sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Smart Buying Guides
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Not sure what to buy?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Simple appliance guides from a trusted Pokhara electronics store -
              made for families, new homeowners, and relatives buying from
              abroad.
            </p>
          </div>

          <Link
            href="/blogs"
            className="inline-flex items-center gap-0 px-3 hover:px-6 h-10 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-all duration-200 ease-in-out hover:gap-2 hover:scale-[1.03] hover:shadow-md hover:bg-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
          >
            View all blogs
            <span className="transform -translate-x-1 opacity-0 transition-all duration-200 ease-in-out group-hover:translate-x-0 group-hover:opacity-100" aria-hidden>
              →
            </span>
          </Link>
        </FadeUp>

        <div className="flex items-center justify-end gap-2 pb-4">
          <button
            type="button"
            aria-label="Show previous buying guides"
            onClick={() => scrollCarousel("previous")}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary hover:bg-primary/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Show next buying guides"
            onClick={() => scrollCarousel("next")}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary hover:bg-primary/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div
          ref={carouselRef}
          aria-label="Buying guide carousel"
          className="flex snap-x snap-mandatory gap-6 overflow-x-hidden scroll-smooth pb-2"
        >
          {featuredBlogPosts.map((post, index) => (
            <FadeUp
              key={post.id}
              data-blog-card=""
              delay={index * 70}
              className="w-[85%] shrink-0 snap-start sm:w-[48%] lg:w-[31%]"
            >
              <BlogGuideCard post={post} priority={index === 0} />
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
