import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export type BusinessSettings = {
  id: "singleton";
  business_name: string | null;
  address: string | null;
  logo_url: string | null;
  pan_vat_no: string | null;
  registration_no: string | null;
  calendar_pref: "BS" | "AD";
  number_format: "indian" | "international";
  currency: string;
  currency_position: "prefix" | "suffix";
  default_privacy_mode: boolean;
};

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  id: "singleton",
  business_name: "Dakshinkali Electronics",
  address: null,
  logo_url: null,
  pan_vat_no: null,
  registration_no: null,
  calendar_pref: "BS",
  number_format: "indian",
  currency: "Rs.",
  currency_position: "prefix",
  default_privacy_mode: false,
};

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select(
      "id,business_name,address,logo_url,pan_vat_no,registration_no,calendar_pref,number_format,currency,currency_position,default_privacy_mode",
    )
    .eq("id", "singleton")
    .maybeSingle<BusinessSettings>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? DEFAULT_BUSINESS_SETTINGS;
}
