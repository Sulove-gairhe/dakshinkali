"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FileText, Package, Search, ShoppingBag } from "lucide-react";
import {
  commandSearchBlogPosts,
  commandSearchOrders,
  commandSearchProducts,
} from "@/lib/admin/actions/command-search";

const QUICK_ACTIONS = [
  { label: "Create Product", href: "/admin/products/new" },
  { label: "Create Blog Post", href: "/admin/blog/new" },
  { label: "View All Orders", href: "/admin/orders" },
  {
    label: "Awaiting Verification",
    href: "/admin/orders?paymentStatus=pending_verification",
  },
  { label: "View Categories", href: "/admin/categories" },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<
    Awaited<ReturnType<typeof commandSearchProducts>>
  >([]);
  const [orders, setOrders] = useState<
    Awaited<ReturnType<typeof commandSearchOrders>>
  >([]);
  const [blogs, setBlogs] = useState<
    Awaited<ReturnType<typeof commandSearchBlogPosts>>
  >([]);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setProducts([]);
      setOrders([]);
      setBlogs([]);
      return;
    }
    setLoading(true);
    try {
      const [p, o, b] = await Promise.all([
        commandSearchProducts(q),
        commandSearchOrders(q),
        commandSearchBlogPosts(q),
      ]);
      setProducts(p);
      setOrders(o);
      setBlogs(b);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setProducts([]);
      setOrders([]);
      setBlogs([]);
      return;
    }
    const timer = setTimeout(() => void runSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, open, runSearch]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const hasQuery = query.trim().length >= 2;
  const noResults =
    hasQuery &&
    !loading &&
    products.length === 0 &&
    orders.length === 0 &&
    blogs.length === 0;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close command palette"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, blog posts…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="hidden rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500 sm:inline">
            Esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!hasQuery ? (
            <div>
              <p className="px-2 py-1 text-xs font-semibold uppercase text-gray-500">
                Quick actions
              </p>
              <ul>
                {QUICK_ACTIONS.map((action) => (
                  <li key={action.href}>
                    <button
                      type="button"
                      onClick={() => go(action.href)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-amber-50"
                    >
                      {action.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {loading ? (
            <p className="px-3 py-4 text-sm text-gray-500">Searching…</p>
          ) : null}

          {noResults ? (
            <p className="px-3 py-4 text-sm text-gray-500">No results found</p>
          ) : null}

          {products.length > 0 ? (
            <section className="mt-2">
              <p className="flex items-center gap-1 px-2 py-1 text-xs font-semibold uppercase text-gray-500">
                <Package className="h-3 w-3" /> Products
              </p>
              <ul>
                {products.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => go(p.href)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {p.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.thumbnail}
                          alt=""
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-100" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.price} · {p.status}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {orders.length > 0 ? (
            <section className="mt-2">
              <p className="flex items-center gap-1 px-2 py-1 text-xs font-semibold uppercase text-gray-500">
                <ShoppingBag className="h-3 w-3" /> Orders
              </p>
              <ul>
                {orders.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => go(o.href)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <p className="font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-gray-500">
                        {o.customerName} · {o.status}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {blogs.length > 0 ? (
            <section className="mt-2">
              <p className="flex items-center gap-1 px-2 py-1 text-xs font-semibold uppercase text-gray-500">
                <FileText className="h-3 w-3" /> Blog posts
              </p>
              <ul>
                {blogs.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => go(b.href)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <span className="truncate font-medium">{b.title}</span>
                      <span className="ml-2 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">
                        {b.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="border-t border-gray-100 px-4 py-2 text-[10px] text-gray-400">
          <Link href="/admin/orders" onClick={onClose} className="hover:underline">
            View all orders
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Registers global Cmd/Ctrl+K to open palette */
export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);
}
