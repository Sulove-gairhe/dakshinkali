"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BlogBlockEditor } from "./blog-block-editor";
import { BlogPreview } from "./blog-preview";
import { StringArrayEditor } from "./string-array-editor";
import {
  createBlogPost,
  publishBlogPost,
  unpublishBlogPost,
  updateBlogPost,
  uploadBlogCoverImage,
} from "@/lib/admin/actions/blog";
import type { BlogFormState } from "@/lib/admin/blog-types";
import { actionErrorMessage } from "@/lib/admin/order-types";
import {
  calculateReadTime,
  getAdminSiteUrl,
  slugifyBlogTitle,
} from "@/lib/admin/utils";

const TABS = ["Main Info", "Content", "Search Visibility", "Preview"] as const;
type Tab = (typeof TABS)[number];

const AUTOSAVE_KEY_PREFIX = "admin-blog-draft-";
// TODO: replace localStorage autosave with server-side autosave draft in a future pass.

export function BlogForm({
  initial,
  categories,
}: {
  initial: BlogFormState;
  categories: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<BlogFormState>(initial);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<Tab>("Main Info");
  const [saving, setSaving] = useState(false);
  const [restoreOffer, setRestoreOffer] = useState<BlogFormState | null>(null);
  const [slugManual, setSlugManual] = useState(!!initial.slug);
  const draftPostIdRef = useRef(form.id ?? crypto.randomUUID());
  const postId = form.id ?? draftPostIdRef.current;
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateForm = useCallback(
    (updater: (prev: BlogFormState) => BlogFormState) => {
      setForm(updater);
      setDirty(true);
    },
    [],
  );

  const storageKey = `${AUTOSAVE_KEY_PREFIX}${form.id || "new"}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as BlogFormState;
        setRestoreOffer(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      if (!dirty) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(form));
      } catch {
        /* ignore */
      }
    }, 30_000);
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [form, dirty, storageKey]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function clearAutosave() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }

  async function persistDraft(): Promise<string | null> {
    const payload: BlogFormState = {
      ...form,
      slug: form.slug.trim() || slugifyBlogTitle(form.title),
      seoTitle: form.seoTitle || form.title,
      seoDescription: form.seoDescription || form.excerpt,
    };

    if (form.id) {
      const result = await updateBlogPost(form.id, payload);
      if (result.success) {
        setForm(blogFromPost(result.data));
        return form.id;
      }
      toast.error(actionErrorMessage(result) ?? "Couldn't save. Please try again");
      return null;
    }

    const result = await createBlogPost(payload);
    if (result.success) {
      const id = result.data.id;
      setForm(blogFromPost(result.data));
      router.replace(`/admin/blog/${id}/edit`);
      return id;
    }
    toast.error(actionErrorMessage(result) ?? "Couldn't create. Please try again");
    return null;
  }

  function blogFromPost(post: {
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
    status: BlogFormState["status"];
    featured: boolean;
    tags: string[];
    seoTitle: string | null;
    seoDescription: string | null;
    content: BlogFormState["content"];
  }): BlogFormState {
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      readTime: post.readTime ?? calculateReadTime(post.content),
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

  async function handleSaveDraft() {
    setSaving(true);
    try {
      const id = await persistDraft();
      if (!id) return;
      setDirty(false);
      clearAutosave();
      toast.success("Draft saved");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    try {
      let id = form.id;
      if (!id) {
        id = await persistDraft();
        if (!id) return;
      }

      const payload: BlogFormState = {
        ...form,
        id,
        slug: form.slug.trim() || slugifyBlogTitle(form.title),
        publishedAt: form.publishedAt ?? new Date().toISOString(),
        seoTitle: form.seoTitle || form.title,
        seoDescription: form.seoDescription || form.excerpt,
      };

      const result = await publishBlogPost(id, payload);
      if (result.success) {
        setForm(blogFromPost(result.data));
        setDirty(false);
        clearAutosave();
        toast.success("Post published");
        return;
      }
      toast.error(actionErrorMessage(result) ?? "Couldn't publish. Please try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnpublish() {
    if (!form.id) return;
    setSaving(true);
    try {
      const result = await unpublishBlogPost(form.id);
      if (result.success) {
        setForm(blogFromPost(result.data));
        setDirty(false);
        toast.success("Post unpublished");
        return;
      }
      toast.error(actionErrorMessage(result) ?? "Couldn't unpublish. Please try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleCoverUpload(file: File) {
    const fd = new FormData();
    fd.set("postId", postId);
    fd.set("file", file);
    const result = await uploadBlogCoverImage(fd);
    if (result.success) {
      updateForm((f) => ({
        ...f,
        coverImageUrl: result.data.url,
        coverImageFilename: result.data.filename,
      }));
      toast.success("Cover image uploaded");
      return;
    }
    toast.error(actionErrorMessage(result) ?? "Upload didn't work. Please try again");
  }

  const siteUrl = getAdminSiteUrl();
  const storefrontPath = `/blogs/${form.slug || "your-slug"}`;

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                updateForm((f) => ({
                  ...f,
                  title: e.target.value,
                  slug: slugManual ? f.slug : slugifyBlogTitle(e.target.value),
                  seoTitle: f.seoTitle === f.title ? e.target.value : f.seoTitle,
                }))
              }
              className="w-full bg-transparent font-heading text-xl font-semibold text-gray-900 focus:outline-none"
              placeholder="Post title"
            />
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span
                className={
                  form.status === "published"
                    ? "rounded bg-green-100 px-2 py-0.5 text-green-800"
                    : "rounded bg-gray-100 px-2 py-0.5"
                }
              >
                {form.status}
              </span>
              {dirty ? (
                <span className="text-primary">● Unsaved changes</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveDraft()}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              Save Draft
            </button>
            {form.status === "published" ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleUnpublish()}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                Unpublish
              </button>
            ) : null}
            <button
              type="button"
              disabled={saving}
              onClick={() => void handlePublish()}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      {restoreOffer ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <span>A local draft was found. Restore unsaved changes?</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-gray-200 bg-white px-3 py-1"
              onClick={() => setRestoreOffer(null)}
            >
              Dismiss
            </button>
            <button
              type="button"
              className="rounded bg-primary px-3 py-1 font-medium text-primary-foreground"
              onClick={() => {
                setForm(restoreOffer);
                setDirty(true);
                setRestoreOffer(null);
              }}
            >
              Restore
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-b border-gray-100">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "border-b-2 border-primary px-3 py-2 text-sm font-medium text-primary"
                : "px-3 py-2 text-sm text-gray-600 hover:text-primary"
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Main Info" ? (
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  updateForm((f) => ({ ...f, slug: e.target.value }));
                }}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Excerpt <span className="text-gray-400">(max 300)</span>
              </label>
              <textarea
                rows={3}
                maxLength={300}
                value={form.excerpt}
                onChange={(e) =>
                  updateForm((f) => ({
                    ...f,
                    excerpt: e.target.value,
                    seoDescription:
                      f.seoDescription === f.excerpt
                        ? e.target.value
                        : f.seoDescription,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              {/* TODO: promote to blog_categories table if blog category list grows beyond 10. */}
              <input
                type="text"
                list="blog-categories"
                value={form.category}
                onChange={(e) =>
                  updateForm((f) => ({ ...f, category: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <datalist id="blog-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Author</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) =>
                  updateForm((f) => ({ ...f, author: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Cover image
              </label>
              {form.coverImageUrl ? (
                <div className="mt-2 relative aspect-video max-w-md overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.coverImageUrl}
                    alt="Cover"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 block text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleCoverUpload(file);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tags</label>
              <StringArrayEditor
                value={form.tags}
                onChange={(tags) => updateForm((f) => ({ ...f, tags }))}
                placeholder="Add tag"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Published at
                </label>
                <input
                  type="datetime-local"
                  value={
                    form.publishedAt
                      ? form.publishedAt.slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    updateForm((f) => ({
                      ...f,
                      publishedAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Read time
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={form.readTime}
                    onChange={(e) =>
                      updateForm((f) => ({
                        ...f,
                        readTime: e.target.value,
                        readTimeManual: true,
                      }))
                    }
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
                    onClick={() =>
                      updateForm((f) => ({
                        ...f,
                        readTime: calculateReadTime(f.content),
                        readTimeManual: false,
                      }))
                    }
                  >
                    Recalculate
                  </button>
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  updateForm((f) => ({ ...f, featured: e.target.checked }))
                }
              />
              Featured post
            </label>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  updateForm((f) => ({
                    ...f,
                    status: e.target.value as BlogFormState["status"],
                  }))
                }
                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        ) : null}

        {tab === "Content" ? (
          <BlogBlockEditor
            value={form.content}
            onChange={(content) =>
              updateForm((f) => ({
                ...f,
                content,
                readTime: f.readTimeManual
                  ? f.readTime
                  : calculateReadTime(content),
              }))
            }
          />
        ) : null}

        {tab === "Search Visibility" ? (
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                SEO title <span className="text-gray-400">(max 60)</span>
              </label>
              <input
                type="text"
                maxLength={60}
                value={form.seoTitle}
                onChange={(e) =>
                  updateForm((f) => ({ ...f, seoTitle: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                SEO description <span className="text-gray-400">(max 160)</span>
              </label>
              <textarea
                rows={3}
                maxLength={160}
                value={form.seoDescription}
                onChange={(e) =>
                  updateForm((f) => ({ ...f, seoDescription: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <p className="text-gray-600">Slug preview</p>
              <p className="font-mono text-gray-900">{form.slug || "—"}</p>
              <p className="mt-3 text-gray-600">Storefront URL</p>
              <p className="break-all font-mono text-primary">
                {siteUrl}
                {storefrontPath}
              </p>
            </div>
          </div>
        ) : null}

        {tab === "Preview" ? <BlogPreview form={form} /> : null}
      </div>
    </div>
  );
}
