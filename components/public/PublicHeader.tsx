import Link from "next/link";
import type { ReactElement } from "react";

export function PublicHeader(): ReactElement {
  return (
    <header className="public-header">
      <Link href="/" className="public-brand" aria-label="Beauty Day Juliana — início">
        <span>Juliana Souza<span className="public-brand-name">Beauty Day</span></span>
      </Link>
      <nav aria-label="Navegação pública">
        <Link href="/login" className="public-professional-link">Área profissional</Link>
      </nav>
    </header>
  );
}
