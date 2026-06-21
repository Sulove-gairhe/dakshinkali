"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import {
  updateBusinessSettings,
  type ActionResult,
} from "@/lib/settings/businessSettings.actions";
import type { BusinessSettings } from "@/lib/settings/businessSettings.queries";

const initialState: ActionResult = { status: "success", message: "" };

export function BusinessSettingsForm({
  settings,
  canEdit,
}: {
  settings: BusinessSettings;
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateBusinessSettings,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">
          Business settings
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Active Phase 1 settings only.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Business name" name="business_name" defaultValue={settings.business_name} disabled={!canEdit} />
        <TextField label="Logo URL" name="logo_url" defaultValue={settings.logo_url} disabled={!canEdit} />
        <TextField label="PAN/VAT number" name="pan_vat_no" defaultValue={settings.pan_vat_no} disabled={!canEdit} />
        <TextField label="Registration number" name="registration_no" defaultValue={settings.registration_no} disabled={!canEdit} />
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Address</span>
          <textarea
            name="address"
            defaultValue={settings.address ?? ""}
            disabled={!canEdit}
            rows={3}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-50"
          />
        </label>
        <SelectField
          label="Calendar preference"
          name="calendar_pref"
          defaultValue={settings.calendar_pref}
          disabled={!canEdit}
          options={[
            ["BS", "BS"],
            ["AD", "AD"],
          ]}
        />
        <SelectField
          label="Number format"
          name="number_format"
          defaultValue={settings.number_format}
          disabled={!canEdit}
          options={[
            ["indian", "Indian"],
            ["international", "International"],
          ]}
        />
        <TextField label="Currency" name="currency" defaultValue={settings.currency} disabled={!canEdit} />
        <SelectField
          label="Currency position"
          name="currency_position"
          defaultValue={settings.currency_position}
          disabled={!canEdit}
          options={[
            ["prefix", "Prefix"],
            ["suffix", "Suffix"],
          ]}
        />
      </div>

      <label className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
        <input
          type="checkbox"
          name="default_privacy_mode"
          defaultChecked={settings.default_privacy_mode}
          disabled={!canEdit}
          className="size-4"
        />
        <span>
          <span className="block font-medium text-slate-800">
            Business default Privacy Mode
          </span>
          <span className="block text-slate-500">
            Users can still set their own preference or session override.
          </span>
        </span>
      </label>

      {state.message ? (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
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
        disabled={!canEdit || pending}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save className="size-4" />
        Save settings
      </button>
    </form>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        disabled={disabled}
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-50"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<[string, string]>;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-50"
      >
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}
