"use server";

import { revalidatePath } from "next/cache";
import { HISABKITAB_PERMISSIONS } from "@/lib/auth/permissions";
import { requireHisabKitabPermission } from "@/lib/auth/requireHisabKitabPermission";
import {
  type SessionPrivacyOverride,
  setSessionPrivacyOverride,
} from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { userPreferencesSchema } from "./schema";
import type { ActionResult } from "./businessSettings.actions";

function parseNullableBoolean(value: FormDataEntryValue | null) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function parseNullableEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
) {
  return allowed.includes(value as T) ? (value as T) : null;
}

export async function updateUserPreferences(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireHisabKitabPermission(
    HISABKITAB_PERMISSIONS.settings.view,
  );

  const parsed = userPreferencesSchema.safeParse({
    privacy_mode: parseNullableBoolean(formData.get("privacy_mode")),
    calendar_pref: parseNullableEnum(formData.get("calendar_pref"), ["BS", "AD"]),
    number_format: parseNullableEnum(formData.get("number_format"), [
      "indian",
      "international",
    ]),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid preferences.",
    };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: context.userId,
      ...parsed.data,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/settings");
  return { status: "success", message: "Preferences saved." };
}

export async function updateSessionPrivacyOverride(
  value: SessionPrivacyOverride,
): Promise<ActionResult> {
  await requireHisabKitabPermission(HISABKITAB_PERMISSIONS.settings.view);
  await setSessionPrivacyOverride(value);
  revalidatePath("/settings");

  return {
    status: "success",
    message:
      value === null
        ? "Session privacy override cleared."
        : "Session privacy override updated.",
  };
}
