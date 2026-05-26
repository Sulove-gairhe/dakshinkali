import { redirect } from "next/navigation";
import { createDraftProduct } from "@/lib/admin/actions/products";

export default async function NewProductPage() {
  const product = await createDraftProduct();
  redirect(`/admin/products/${product.id}/edit`);
}
