import { z } from "zod";

export const businessSettingsSchema = z.object({
  business_name: z.string().trim().max(160).nullable(),
  address: z.string().trim().max(500).nullable(),
  logo_url: z.string().trim().url().or(z.literal("")).nullable(),
  pan_vat_no: z.string().trim().max(80).nullable(),
  registration_no: z.string().trim().max(80).nullable(),
  calendar_pref: z.enum(["BS", "AD"]),
  number_format: z.enum(["indian", "international"]),
  currency: z.string().trim().min(1).max(12),
  currency_position: z.enum(["prefix", "suffix"]),
  default_privacy_mode: z.boolean(),
});

export const userPreferencesSchema = z.object({
  privacy_mode: z.boolean().nullable(),
  calendar_pref: z.enum(["BS", "AD"]).nullable(),
  number_format: z.enum(["indian", "international"]).nullable(),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
