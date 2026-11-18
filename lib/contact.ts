import { z } from "zod";

interface ContactConfig {
  whatsapp?: string;
  instagram?: string;
}

interface ContactLinks {
  whatsapp?: string;
  instagram?: string;
}

const phoneSchema = z.string().trim()
  .regex(/^\+?[\d ()-]+$/)
  .transform((value) => value.replace(/[ ()+-]/g, ""))
  .pipe(z.string().regex(/^[1-9]\d{7,14}$/));

const handleSchema = z.string().min(1).max(30)
  .regex(/^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*$/);

function instagramHandle(value: string): string | undefined {
  const input = value.trim();
  if (!input.startsWith("https://")) {
    const handle = handleSchema.safeParse(input.replace(/^@/, ""));
    return handle.success ? handle.data : undefined;
  }
  const parsed = z.url().safeParse(input);
  if (!parsed.success) return undefined;
  const url = new URL(parsed.data);
  if (!["instagram.com", "www.instagram.com"].includes(url.hostname) ||
      url.username || url.password || url.port || url.search || url.hash) return undefined;
  const handle = handleSchema.safeParse(url.pathname.replace(/^\//, "").replace(/\/$/, ""));
  return handle.success ? handle.data : undefined;
}

/** Pure validation; environment variables are read only by the server footer. */
export function getContactLinks(config: ContactConfig): ContactLinks {
  const links: ContactLinks = {};
  const phone = phoneSchema.safeParse(config.whatsapp);
  if (phone.success) links.whatsapp = `https://wa.me/${phone.data}`;
  const handle = config.instagram ? instagramHandle(config.instagram) : undefined;
  if (handle) links.instagram = `https://www.instagram.com/${handle}/`;
  return links;
}
