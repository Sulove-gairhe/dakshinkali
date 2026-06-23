"use client";

import { useActionState, useTransition } from "react";
import { EyeOff, RotateCcw, Save } from "lucide-react";
import {
  updateSessionPrivacyOverride,
  updateUserPreferences,
} from "@/lib/settings/userPreferences.actions";
import type { ActionResult } from "@/lib/settings/businessSettings.actions";
import type { UserPreferences } from "@/lib/settings/userPreferences.queries";
import type { SessionPrivacyOverride } from "@/lib/auth/session";

const initialState: ActionResult = { status: "success", message: "" };

export function PrivacyModeControls({
  preferences,
  sessionOverride,
  businessDefault,
  effectivePrivacyMode,
}: {
  preferences: UserPreferences;
  sessionOverride: SessionPrivacyOverride;
  businessDefault: boolean;
  effectivePrivacyMode: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateUserPreferences,
    initialState,
  );
  const [sessionPending, startTransition] = useTransition();

  function setSession(value: SessionPrivacyOverride) {
    startTransition(async () => {
      await updateSessionPrivacyOverride(value);
    });
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <EyeOff className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Privacy Mode
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Effective value: {effectivePrivacyMode ? "On" : "Off"}
          </p>
        </div>
      </div>

      <dl className="mb-5 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Business default</dt>
          <dd className="font-medium text-slate-800">
            {businessDefault ? "On" : "Off"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">User preference</dt>
          <dd className="font-medium text-slate-800">
            {preferences.privacy_mode === null
              ? "Inherit"
              : preferences.privacy_mode
                ? "On"
                : "Off"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Session override</dt>
          <dd className="font-medium text-slate-800">
            {sessionOverride === null
              ? "None"
              : sessionOverride
                ? "On"
                : "Off"}
          </dd>
        </div>
      </dl>

      <form action={formAction} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            User Privacy Mode
          </span>
          <select
            name="privacy_mode"
            defaultValue={
              preferences.privacy_mode === null
                ? "inherit"
                : String(preferences.privacy_mode)
            }
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="inherit">Inherit business default</option>
            <option value="true">On</option>
            <option value="false">Off</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            Calendar override
          </span>
          <select
            name="calendar_pref"
            defaultValue={preferences.calendar_pref ?? "inherit"}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="inherit">Inherit</option>
            <option value="BS">BS</option>
            <option value="AD">AD</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            Number format override
          </span>
          <select
            name="number_format"
            defaultValue={preferences.number_format ?? "inherit"}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="inherit">Inherit</option>
            <option value="indian">Indian</option>
            <option value="international">International</option>
          </select>
        </label>

        {state.message ? (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              state.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="size-4" />
          Save preferences
        </button>
      </form>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={sessionPending}
          onClick={() => setSession(true)}
          className="h-10 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
        >
          On
        </button>
        <button
          type="button"
          disabled={sessionPending}
          onClick={() => setSession(false)}
          className="h-10 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
        >
          Off
        </button>
        <button
          type="button"
          title="Clear session override"
          aria-label="Clear session override"
          disabled={sessionPending}
          onClick={() => setSession(null)}
          className="grid h-10 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
    </aside>
  );
}
