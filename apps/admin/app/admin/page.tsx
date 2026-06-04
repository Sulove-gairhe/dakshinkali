import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { Package, Tag } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const metrics = [
    { label: "Products (catalog)", value: "—", hint: "Connect DB metrics later" },
    { label: "Live products", value: "—", hint: "Publishing pipeline active" },
    { label: "Categories", value: "5", hint: "Seeded defaults" },
  ];

  return (
    <AdminLayoutShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{m.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{m.value}</p>
            <p className="mt-1 text-xs text-gray-400">{m.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/products"
          className="card-cozy flex items-center gap-3 p-5 hover:border-amber-300"
        >
          <Package className="h-8 w-8 text-amber-600" />
          <div>
            <p className="font-semibold">Products</p>
            <p className="text-sm text-gray-500">Manage catalog & publishing</p>
          </div>
        </Link>
        <Link
          href="/admin/categories"
          className="card-cozy flex items-center gap-3 p-5 hover:border-amber-300"
        >
          <Tag className="h-8 w-8 text-amber-600" />
          <div>
            <p className="font-semibold">Categories</p>
            <p className="text-sm text-gray-500">Organize product taxonomy</p>
          </div>
        </Link>
      </div>
    </AdminLayoutShell>
  );
}
