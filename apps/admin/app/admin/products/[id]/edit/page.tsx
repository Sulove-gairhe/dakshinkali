import { notFound } from "next/navigation";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { ProductForm } from "@/components/admin/product-form";
import { listCategories } from "@/lib/admin/actions/categories";
import {
  getAdminProduct,
  productToFormState,
} from "@/lib/admin/actions/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const [product, categories] = await Promise.all([
      getAdminProduct(id),
      listCategories(false),
    ]);

    return (
      <AdminLayoutShell title="Edit Product">
        <ProductForm
          initial={await productToFormState(product)}
          categories={categories}
        />
      </AdminLayoutShell>
    );
  } catch {
    notFound();
  }
}
