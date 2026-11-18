import Link from 'next/link'

export function ProfessionalBrand({ href = '/' }: { href?: string }) {
  return <Link href={href} className="professional-brand" aria-label="Juliana Souza Beauty Day">
    <span>Juliana Souza</span><span>Beauty Day</span>
  </Link>
}
