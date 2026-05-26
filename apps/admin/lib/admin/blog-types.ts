/** Mirrors apps/web/lib/blog-posts.ts block shapes — keep in sync. */
export type BlogContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "tip"; text: string };

export type BlogPostStatus = "draft" | "published";

export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string | null;
  coverImageUrl: string | null;
  coverImageFilename: string | null;
  author: string;
  publishedAt: string | null;
  updatedAt: string;
  status: BlogPostStatus;
  featured: boolean;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  content: BlogContentBlock[];
  createdAt: string;
  deletedAt: string | null;
}

export interface BlogFormState {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  readTimeManual: boolean;
  coverImageUrl: string | null;
  coverImageFilename: string | null;
  author: string;
  publishedAt: string | null;
  status: BlogPostStatus;
  featured: boolean;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  content: BlogContentBlock[];
}

export interface BlogListFilters {
  search?: string;
  status?: BlogPostStatus | "";
  category?: string;
  page?: number;
  pageSize?: number;
}

export function blogToFormState(post: AdminBlogPost): BlogFormState {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    readTime: post.readTime ?? "1 min read",
    readTimeManual: !!post.readTime,
    coverImageUrl: post.coverImageUrl,
    coverImageFilename: post.coverImageFilename,
    author: post.author,
    publishedAt: post.publishedAt,
    status: post.status,
    featured: post.featured,
    tags: post.tags,
    seoTitle: post.seoTitle ?? post.title,
    seoDescription: post.seoDescription ?? post.excerpt,
    content: post.content,
  };
}

export function emptyBlogFormState(
  author = "Dakshinkali Electronics",
): BlogFormState {
  return {
    slug: "",
    title: "",
    excerpt: "",
    category: "",
    readTime: "1 min read",
    readTimeManual: false,
    coverImageUrl: null,
    coverImageFilename: null,
    author,
    publishedAt: null,
    status: "draft",
    featured: false,
    tags: [],
    seoTitle: "",
    seoDescription: "",
    content: [],
  };
}
