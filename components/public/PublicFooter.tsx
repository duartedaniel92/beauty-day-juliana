import "server-only";
import type { ReactElement } from "react";
import { getContactLinks } from "@/lib/contact";
import { getSiteContent } from '@/lib/site-data';
import type { SiteContent } from '@/lib/site-content';

export async function PublicFooter({ content: provided }: { content?: SiteContent } = {}): Promise<ReactElement> {
  const content = provided ?? (await getSiteContent()).content;
  const contacts = getContactLinks({
    whatsapp: content.whatsapp,
    instagram: content.instagram,
  });
  return (
    <footer className="public-footer">
      <div>
        <p className="public-brand">Juliana Souza</p>
        <p className="public-brand-name">Beauty Day</p>
      </div>
      <address className="not-italic text-sm leading-relaxed">
        <p>{content.address}</p>
        <a href={`tel:${content.whatsapp}`}>{content.whatsapp}</a><br />
        <a href={`mailto:${content.email}`}>{content.email}</a>
      </address>
      {(contacts.whatsapp || contacts.instagram) && (
        <nav aria-label="Contatos" className="flex flex-wrap gap-6">
          {contacts.whatsapp && <a href={contacts.whatsapp}>WhatsApp</a>}
          {contacts.instagram && <a href={contacts.instagram}>Instagram</a>}
          <a href="/privacidade">Privacidade</a>
        </nav>
      )}
    </footer>
  );
}
