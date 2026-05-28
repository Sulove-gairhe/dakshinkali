"use server";

import { requireAdminUser } from "@/lib/admin/auth-server";
import { formatNprPrice } from "@/lib/admin/utils";
import type { StorefrontData } from "@/lib/admin/types";

// TODO: migrate command search to full-text search when data grows.

const RESULT_LIMIT = 5;

export type CommandProductResult = {
  id: string;
  name: string;
  thumbnail: string | null;
  price: string;
  status: string;
  href: string;
};

export type CommandOrderResult = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  href: string;
};

export type CommandBlogResult = {
  id: string;
  title: string;
  status: string;
  href: string;
};

export async function commandSearchProducts(
  query: string,
): Promise<CommandProductResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, status, images")
    .is("deleted_at", null)
    .ilike("name", `%${q}%`)
    .limit(RESULT_LIMIT);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const images = Array.isArray(row.images) ? row.images : [];
    const thumb = images.sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order,
    )[0];
    return {
      id: row.id as string,
      name: row.name as string,
      thumbnail: (thumb?.url as string) ?? null,
      price: formatNprPrice(Number(row.price)),
      status: row.status as string,
      href: `/admin/products/${row.id}/edit`,
    };
  });
}

export async function commandSearchOrders(
  query: string,
): Promise<CommandOrderResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, status")
    .or(
      `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,customer_phone.ilike.%${q}%`,
    )
    .limit(RESULT_LIMIT);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    orderNumber: row.order_number as string,
    customerName: row.customer_name as string,
    status: (row.status as string).replace(/_/g, " "),
    href: `/admin/orders/${row.id}`,
  }));
}

export async function commandSearchBlogPosts(
  query: string,
): Promise<CommandBlogResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, status")
    .is("deleted_at", null)
    .ilike("title", `%${q}%`)
    .limit(RESULT_LIMIT);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    status: row.status as string,
    href: `/admin/blog/${row.id}/edit`,
  }));
}

export async function getProductQuickView(productId: string) {
  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, status, category, images, storefront_data")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const images = Array.isArray(data.images) ? data.images : [];
  const thumb = images.sort(
    (a: { order: number }, b: { order: number }) => a.order - b.order,
  )[0];
  const sf = (data.storefront_data as StorefrontData | null) ?? {};

  return {
    id: data.id as string,
    name: data.name as string,
    price: Number(data.price),
    status: data.status as string,
    category: data.category as string,
    brand: sf.brand ?? null,
    imageUrl: (thumb?.url as string) ?? null,
  };
}
