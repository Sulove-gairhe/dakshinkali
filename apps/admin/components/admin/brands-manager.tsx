"use client";

import { useMemo, useState } from "react";
import { Pencil, Power, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createManagedBrand,
  deleteUnusedManagedBrand,
  renameManagedBrand,
  setManagedBrandActive,
} from "@/lib/admin/actions/brands";
import { normalizeBrandName, sortBrands, type BrandRecord } from "@/lib/admin/brand-resolver";

type StatusFilter = "all" | "active" | "inactive";

export function BrandsManager({ initialBrands }: { initialBrands: BrandRecord[] }) {
  const [brands, setBrands] = useState(initialBrands);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<BrandRecord | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = normalizeBrandName(search);
    return brands.filter((brand) => {
      const matchesStatus = status === "all" || (status === "active" ? brand.is_active : !brand.is_active);
      return matchesStatus && (!query || normalizeBrandName(brand.name).includes(query));
    });
  }, [brands, search, status]);

  function openCreate() {
    setEditing(null);
    setName("");
    setError(null);
    setPanelOpen(true);
  }

  function openEdit(brand: BrandRecord) {
    setEditing(brand);
    setName(brand.name);
    setError(null);
    setPanelOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const saved = editing
        ? await renameManagedBrand(editing.id, name)
        : await createManagedBrand(name);
      setBrands((current) => {
        const existing = current.some((brand) => brand.id === saved.id);
        const next = existing
          ? current.map((brand) => (brand.id === saved.id ? { ...brand, ...saved } : brand))
          : [...current, saved];
        return sortBrands(next);
      });
      toast.success(editing ? "Brand renamed and products synchronized" : "Brand created");
      setEditing(null);
      setName("");
      setPanelOpen(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not save brand";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(brand: BrandRecord) {
    if (brand.is_active && brand.product_count) {
      const confirmed = window.confirm(`Deactivate ${brand.name}? It has ${brand.product_count} linked product${brand.product_count === 1 ? "" : "s"}.`);
      if (!confirmed) return;
    }
    try {
      const updated = await setManagedBrandActive(brand.id, !brand.is_active);
      setBrands((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      toast.success(updated.is_active ? "Brand activated" : "Brand deactivated");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not update brand");
    }
  }

  async function remove(brand: BrandRecord) {
    if ((brand.product_count ?? 0) > 0) {
      toast.error(`${brand.name} has ${brand.product_count} linked products. Deactivate or reassign them before deleting.`);
      return;
    }
    if (!window.confirm(`Permanently delete ${brand.name}? This cannot be undone.`)) return;
    try {
      await deleteUnusedManagedBrand(brand.id);
      setBrands((current) => current.filter((item) => item.id !== brand.id));
      toast.success("Brand deleted");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not delete brand");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search brands…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 text-sm">
          {(["all", "active", "inactive"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={`rounded-lg px-3 py-1.5 capitalize transition ${status === option ? "bg-primary text-primary-foreground" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {option}
            </button>
          ))}
        </div>
        <button type="button" onClick={openCreate} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
          Create brand
        </button>
      </div>

      <p className="text-sm text-gray-500">Priority brands appear first. Inactive and unresolved import records remain available here for review.</p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">No brands match this filter.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((brand) => (
            <article key={brand.id} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <button type="button" onClick={() => openEdit(brand)} className="block w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="truncate text-lg font-bold text-gray-900">{brand.name}</h2>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${brand.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                    {brand.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-4 text-sm text-gray-500">Total Products: <span className="font-semibold text-gray-800">{brand.product_count ?? 0}</span></p>
              </button>
              <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => openEdit(brand)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button type="button" onClick={() => void toggle(brand)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  <Power className="h-3.5 w-3.5" /> {brand.is_active ? "Deactivate" : "Activate"}
                </button>
                <button type="button" onClick={() => void remove(brand)} disabled={(brand.product_count ?? 0) > 0} title={(brand.product_count ?? 0) > 0 ? "Reassign linked products before deleting" : "Delete brand"} className="ml-auto rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {panelOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close brand dialog" className="absolute inset-0 bg-black/40" onClick={() => { setEditing(null); setName(""); setPanelOpen(false); }} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900">{editing ? "Rename brand" : "Create brand"}</h2>
            <p className="mt-1 text-sm text-gray-500">Names are trimmed, whitespace-normalized, and compared case-insensitively.</p>
            <label className="mt-5 block text-sm font-medium text-gray-700">Brand name
              <input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </label>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setEditing(null); setName(""); setPanelOpen(false); }} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">Cancel</button>
              <button type="button" disabled={saving || !name.trim()} onClick={() => void save()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
