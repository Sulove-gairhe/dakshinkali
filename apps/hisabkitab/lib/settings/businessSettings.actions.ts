"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { HISABKITAB_PERMISSIONS } from "@/lib/auth/permissions";
import { requireHisabKitabPermission } from "@/lib/auth/requireHisabKitabPermission";
import { createServiceClient } from "@/lib/supabase/service";
import { businessSettingsSchema } from "./schema";

export type ActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function updateBusinessSettings(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireHisabKitabPermission(HISABKITAB_PERMISSIONS.settings.edit);

  const parsed = businessSettingsSchema.safeParse({
    business_name: nullableText(formData.get("business_name")),
    address: nullableText(formData.get("address")),
    logo_url: nullableText(formData.get("logo_url")),
    pan_vat_no: nullableText(formData.get("pan_vat_no")),
    registration_no: nullableText(formData.get("registration_no")),
    calendar_pref: formData.get("calendar_pref"),
    number_format: formData.get("number_format"),
    currency: String(formData.get("currency") ?? "Rs.").trim(),
    currency_position: formData.get("currency_position"),
    default_privacy_mode: formData.get("default_privacy_mode") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid settings.",
    };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("business_settings").upsert(
    {
      id: "singleton",
      ...parsed.data,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/settings");
  return { status: "success", message: "Business settings saved." };
}

export async function parseBusinessSettingsInput(input: unknown) {
  return businessSettingsSchema.parse(input);
}

export const businessSettingsFormSchema = z.object({
  status: z.enum(["success", "error"]),
  message: z.string(),
});
