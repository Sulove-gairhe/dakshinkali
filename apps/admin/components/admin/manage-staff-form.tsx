"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Crown,
  Loader2,
  MailPlus,
  ShieldPlus,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  addManagedStaffEmail,
  removeAdminMember,
  updateAdminMemberRole,
  type AdminMember,
} from "@/lib/admin/login-security";
import { cn } from "@/lib/cn";

export function ManageStaffForm({ members }: { members: AdminMember[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const result = await addManagedStaffEmail(
      new FormData(event.currentTarget),
    );
    setSubmitting(false);

    toast[result.status === "success" ? "success" : "error"](result.message);
    if (result.status === "success") {
      event.currentTarget.reset();
    }
  }

  async function handleRoleChange(memberId: string, role: string) {
    const formData = new FormData();
    formData.set("userId", memberId);
    formData.set("role", role);
    setUpdatingMemberId(memberId);
    const result = await updateAdminMemberRole(formData);
    setUpdatingMemberId(null);
    toast[result.status === "success" ? "success" : "error"](result.message);
  }

  async function handleRemoveMember(member: AdminMember) {
    const label = member.username ? `@${member.username}` : member.email;
    const confirmed = window.confirm(
      `Remove ${label} from your team?`,
    );
    if (!confirmed) {
      return;
    }

    const formData = new FormData();
    formData.set("userId", member.id);
    setRemovingMemberId(member.id);
    const result = await removeAdminMember(formData);
    setRemovingMemberId(null);
    toast[result.status === "success" ? "success" : "error"](result.message);

    if (result.status === "success") {
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
            <MailPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add email</h2>
            <p className="mt-1 text-sm text-gray-500">
              Give access to admin panel to an existing or future staff/admin.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_150px]">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input
              name="email"
              type="email"
              required
              className="h-11 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Username</span>
            <input
              name="username"
              type="text"
              required
              pattern="[a-zA-Z0-9_-]{3,32}"
              className="h-11 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Role</span>
            <select
              name="role"
              required
              defaultValue="staff"
              className="h-11 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldPlus className="h-4 w-4" />
          )}
          Add Email
        </button>
      </form>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Active members
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Current staff and admin accounts with dashboard access.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
            {members.length} active
          </span>
        </div>

        {members.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
            No active staff or admin members yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <article
                key={member.id}
                className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-lg",
                      member.role === "admin"
                        ? "bg-primary/10 text-primary"
                        : "bg-emerald-100 text-emerald-700",
                    )}
                  >
                    {member.role === "admin" ? (
                      <Crown className="h-5 w-5" />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                        member.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-emerald-100 text-emerald-800",
                      )}
                    >
                      {member.role}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${member.username ?? member.email}`}
                      title="Remove member"
                      disabled={removingMemberId === member.id}
                      onClick={() => void handleRemoveMember(member)}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removingMemberId === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 min-w-0">
                  <h3 className="truncate text-base font-semibold text-gray-900">
                    {member.username ? `@${member.username}` : member.email}
                  </h3>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {member.email}
                  </p>
                  {member.fullName ? (
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {member.fullName}
                    </p>
                  ) : null}
                </div>

                <label className="mt-5 grid gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Role
                  </span>
                  <span className="relative">
                    <select
                      defaultValue={member.role}
                      disabled={updatingMemberId === member.id}
                      onChange={(event) =>
                        void handleRoleChange(member.id, event.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    {updatingMemberId === member.id ? (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                    ) : null}
                  </span>
                </label>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
