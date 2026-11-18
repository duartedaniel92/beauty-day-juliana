import { describe, expect, it } from "vitest";
import { getContactLinks } from "./contact";

describe("getContactLinks", () => {
  it("omits missing and blank contacts", () => {
    expect(getContactLinks({})).toEqual({});
    expect(getContactLinks({ whatsapp: " ", instagram: "" })).toEqual({});
  });

  it("normalizes an international phone and an Instagram handle", () => {
    expect(getContactLinks({ whatsapp: "+55 (11) 98765-4321", instagram: "@juliana.test" })).toEqual({
      whatsapp: "https://wa.me/5511987654321",
      instagram: "https://www.instagram.com/juliana.test/",
    });
  });

  it("accepts a profile URL only on Instagram", () => {
    expect(getContactLinks({ instagram: "https://www.instagram.com/juliana.test/" }).instagram)
      .toBe("https://www.instagram.com/juliana.test/");
  });

  it.each(["123", "011987654321", "https://wa.me/5511987654321", "+55abc11987654321", "1234567890123456"])("rejects invalid phone %s", (whatsapp) => {
    expect(getContactLinks({ whatsapp })).toEqual({});
  });

  it.each(["https://instagram.com.evil.test/juliana", "javascript:alert(1)", "https://evil.test/juliana", "https://instagram.com/p/post", "https://user@instagram.com/juliana", "https://instagram.com/juliana?next=evil", "a..b", ".juliana", "juliana.", "a".repeat(31)])("rejects invalid Instagram %s", (instagram) => {
    expect(getContactLinks({ instagram })).toEqual({});
  });

  it("keeps a valid contact when the other is invalid", () => {
    expect(getContactLinks({ whatsapp: "invalid", instagram: "juliana" }))
      .toEqual({ instagram: "https://www.instagram.com/juliana/" });
  });
});
