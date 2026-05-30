import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchDbProductBySlug } from "@/lib/db-products";

export async function GET(req: Request) {
  try {
    console.log("[debug] SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    const url = new URL(req.url);
    const key = url.searchParams.get("key") || "";
    const max = Number(url.searchParams.get("max") ?? "0") || 0;
    if (!key) return NextResponse.json({ products: [] });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("storefront_sections")
      .select("slugs")
      .eq("key", key)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[storefront-products] supabase error", error.message);
      return NextResponse.json({ products: [] });
    }

    const slugs: string[] = (data?.slugs && Array.isArray(data.slugs)) ? data.slugs : [];
    const limited = max > 0 ? slugs.slice(-max) : slugs;

    const products = [];
    for (const slug of limited) {
      const product = await fetchDbProductBySlug(slug);
      if (product) products.push(product);
    }

    return NextResponse.json({ products });
  } catch (err) {
    console.error("[storefront-products] unexpected error", err);
    return NextResponse.json({ products: [] });
  }
}
