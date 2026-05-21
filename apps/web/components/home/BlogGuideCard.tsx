"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { BlogPost } from "@/lib/blog-posts";
import { cn } from "@/lib/utils";

type BlogGuideCardProps = {
  post: BlogPost;
  className?: string;
  priority?: boolean;
};

export function BlogGuideCard({
  post,
  className,
  priority = false,
}: BlogGuideCardProps) {
  const href = `/blogs/${post.slug}`;

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-card-hover",
        className,
      )}
    >
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 48vw, 31vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/5 to-transparent" />
          <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
            {post.category}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            <span>{post.readTime}</span>
          </div>
          <h3 className="mt-3 text-lg font-bold leading-tight tracking-tight text-foreground">
            {post.title}
          </h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {post.excerpt}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
            Read guide
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}
