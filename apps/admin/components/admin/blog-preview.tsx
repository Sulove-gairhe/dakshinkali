"use client";

import type { BlogContentBlock, BlogFormState } from "@/lib/admin/blog-types";

// TODO: wire to /blog/[slug]?preview=true draft preview route in a future pass.

function BlockRenderer({ block }: { block: BlogContentBlock }) {
  if (block.type === "paragraph") {
    return <p className="font-body leading-8 text-gray-800/90">{block.text}</p>;
  }
  if (block.type === "heading") {
    return (
      <h2 className="font-heading pt-2 text-2xl font-bold tracking-tight text-gray-900">
        {block.text}
      </h2>
    );
  }
  if (block.type === "list") {
    return (
      <ul className="space-y-3 pl-5 font-body">
        {block.items.map((item, i) => (
          <li key={`${item}-${i}`} className="list-disc pl-1 leading-7 text-gray-800/90">
            {item}
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "tip") {
    return (
      <div className="rounded-xl border border-amber-300/40 bg-[#fff8e7] p-4 text-sm font-semibold leading-6 text-gray-900">
        {block.text}
      </div>
    );
  }
  return null;
}

export function BlogPreview({ form }: { form: BlogFormState }) {
  const publishedLabel = form.publishedAt
    ? new Date(form.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not published";

  return (
    <article className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {form.coverImageUrl ? (
        <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.coverImageUrl}
            alt={form.title || "Cover"}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <p className="text-sm font-bold uppercase tracking-wide text-amber-600">
        {form.category || "Category"}
      </p>
      <h1 className="font-heading mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {form.title || "Post title"}
      </h1>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-gray-500">
        <span>{form.readTime || "1 min read"}</span>
        <span>{form.author}</span>
        <span>{publishedLabel}</span>
      </div>
      <p className="mt-5 font-body text-base leading-7 text-gray-600 sm:text-lg">
        {form.excerpt || "Excerpt preview…"}
      </p>

      <div className="mt-8 space-y-6">
        {form.content.length === 0 ? (
          <p className="text-sm text-gray-400">Add content blocks to preview.</p>
        ) : (
          form.content.map((block, index) => (
            <BlockRenderer key={`${block.type}-${index}`} block={block} />
          ))
        )}
      </div>
    </article>
  );
}
