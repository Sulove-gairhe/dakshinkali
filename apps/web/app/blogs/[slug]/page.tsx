import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MessageCircle } from "lucide-react";
import { SiteNavbar } from "@/components/site-navbar";
import {
  type BlogContentBlock,
  getBlogPostBySlug,
  publishedBlogPosts,
} from "@/lib/blog-posts";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return publishedBlogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Buying Guide | Dakshinkali Electronics",
    };
  }

  return {
    title: post.seoTitle,
    description: post.seoDescription,
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <SiteNavbar />

      <article className="mx-auto max-w-4xl min-w-0 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to buying guides
        </Link>

        <div className="mt-8">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            {post.category}
          </p>
          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4" aria-hidden="true" />
              {post.readTime}
            </span>
            <span>{post.author}</span>
            <time dateTime={post.publishedAt}>
              {new Date(`${post.publishedAt}T00:00:00`).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                },
              )}
            </time>
          </div>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            {post.excerpt}
          </p>
        </div>

        <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover"
          />
        </div>

        <div className="mt-8 space-y-6 text-base leading-8 text-foreground/80">
          {post.content.map((block, index) => (
            <BlogContentBlockRenderer key={`${block.type}-${index}`} block={block} />
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-primary/30 bg-primary/10 p-5 sm:p-6">
          <h2 className="text-xl font-bold text-foreground">
            Need help choosing the right appliance?
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Contact Dakshinkali Electronics for simple local guidance before you
            buy.
          </p>
          <a
            href="https://wa.me/9779846514318"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Contact Dakshinkali Electronics
          </a>
        </div>
      </article>
    </main>
  );
}

function BlogContentBlockRenderer({ block }: { block: BlogContentBlock }) {
  if (block.type === "paragraph") {
    return <p>{block.text}</p>;
  }

  if (block.type === "heading") {
    return (
      <h2 className="pt-2 text-2xl font-bold tracking-tight text-foreground">
        {block.text}
      </h2>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="space-y-3 pl-5">
        {block.items.map((item) => (
          <li key={item} className="list-disc pl-1">
            {item}
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "tip") {
    return (
      <div className="rounded-xl border border-primary/25 bg-[#fff8e7] p-4 text-sm font-semibold leading-6 text-foreground">
        {block.text}
      </div>
    );
  }

  return null;
}
