"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createCategory,
  toggleCategoryActive,
  updateCategory,
} from "@/lib/admin/actions/categories";
import { slugifyName } from "@/lib/admin/utils";
import type { CategoryRecord } from "@/lib/admin/types";

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: CategoryRecord[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRecord | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setDescription("");
    setSortOrder(categories.length + 1);
    setSlugManual(false);
    setError(null);
    setPanelOpen(true);
  }

  function openEdit(cat: CategoryRecord) {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? "");
    setSortOrder(cat.sort_order);
    setSlugManual(true);
    setError(null);
    setPanelOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugifyName(name),
        description: description.trim() || null,
        sort_order: sortOrder,
      };
      if (editing) {
        const updated = await updateCategory(editing.id, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
        toast.success("Category updated");
      } else {
        const created = await createCategory(payload);
        setCategories((prev) => [...prev, created]);
        toast.success("Category created");
      }
      setPanelOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(cat: CategoryRecord) {
    try {
      const updated = await toggleCategoryActive(cat.id, !cat.is_active);
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      toast.success(updated.is_active ? "Category activated" : "Category deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400"
        >
          Create category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-600">No categories yet — create your first category</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900"
          >
            Create category
          </button>
        </div>
      ) : (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-gray-600">{cat.slug}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void handleToggle(cat)}
                    className={
                      cat.is_active
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
                        : "rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    }
                  >
                    {cat.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">{cat.sort_order}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="text-amber-700 hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {panelOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setPanelOpen(false)}
          />
          <div className="relative h-full w-full max-w-md overflow-auto bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">
              {editing ? "Edit category" : "Create category"}
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugManual) setSlug(slugifyName(e.target.value));
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugManual(true);
                    setSlug(e.target.value);
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sort order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || !name.trim()}
                  onClick={() => void handleSave()}
                  className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-medium text-gray-900"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
