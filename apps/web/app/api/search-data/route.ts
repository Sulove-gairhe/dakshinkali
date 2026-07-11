import { NextResponse } from "next/server";
import { fetchDbCategories, fetchDbProducts } from "@/lib/db-products";

export async function GET() {
  const [dbProducts, dbCategories] = await Promise.all([
    fetchDbProducts(),
    fetchDbCategories(),
  ]);

  return NextResponse.json({ dbProducts, dbCategories });
}
