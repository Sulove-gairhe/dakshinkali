"use client";

import { FormEvent, useState } from "react";
import { Loader2, ShieldPlus } from "lucide-react";
import { toast } from "sonner";
import { grantAdminAccess } from "@/lib/admin/login-security";

export function ManageStaffForm() {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const result = await grantAdminAccess(new FormData(event.currentTarget));
    setSubmitting(false);

    toast[result.status === "success" ? "success" : "error"](result.message);
    if (result.status === "success") {
      event.currentTarget.reset();
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-100 text-amber-700">
          <ShieldPlus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Add staff access
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Add an email, username, and role for admin panel login.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            name="email"
            type="email"
            required
            className="h-11 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Username</span>
          <input
            name="username"
            type="text"
            required
            pattern="[a-zA-Z0-9_-]{3,32}"
            className="h-11 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />
          <span className="text-xs text-gray-500">
            3-32 letters, numbers, underscore, or hyphen.
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Role</span>
          <select
            name="role"
            required
            defaultValue="staff"
            className="h-11 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-semibold text-gray-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Grant Access
        </button>
      </div>
    </form>
  );
}
