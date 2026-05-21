import { BlogGuideCard } from "@/components/home/BlogGuideCard";
import { SiteNavbar } from "@/components/site-navbar";
import { FadeUp } from "@/components/ui/FadeUp";
import { publishedBlogPosts } from "@/lib/blog-posts";

export const metadata = {
  title: "Buying Guides | Dakshinkali Electronics",
  description:
    "Simple, practical appliance buying guides from Dakshinkali Electronics.",
};

export default function BlogsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <FadeUp className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            Smart Buying Guides
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Buying Guides
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Simple, practical appliance buying guides from Dakshinkali
            Electronics.
          </p>
        </FadeUp>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {publishedBlogPosts.map((post, index) => (
            <FadeUp key={post.id} delay={index * 70}>
              <BlogGuideCard post={post} priority={index < 3} />
            </FadeUp>
          ))}
        </div>
      </section>
    </main>
  );
}
