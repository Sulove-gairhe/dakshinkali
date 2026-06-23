import { describe, expect, it } from "vitest";
import { resolveEffectivePrivacyMode } from "./privacyMode";

describe("resolveEffectivePrivacyMode", () => {
  it("prefers session override over user and business defaults", () => {
    expect(
      resolveEffectivePrivacyMode({
        sessionOverride: false,
        userPreference: true,
        businessDefault: true,
      }),
    ).toBe(false);
  });

  it("falls back to user preference before business default", () => {
    expect(
      resolveEffectivePrivacyMode({
        sessionOverride: null,
        userPreference: true,
        businessDefault: false,
      }),
    ).toBe(true);
  });

  it("falls back to business default", () => {
    expect(
      resolveEffectivePrivacyMode({
        sessionOverride: null,
        userPreference: null,
        businessDefault: true,
      }),
    ).toBe(true);
  });

  it("defaults to off when nothing is set", () => {
    expect(resolveEffectivePrivacyMode({})).toBe(false);
  });
});
