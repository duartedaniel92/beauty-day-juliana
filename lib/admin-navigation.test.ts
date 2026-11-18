import { describe, expect, it } from 'vitest'
import { adminHref } from './admin-navigation'

describe('admin navigation', () => {
  it.each(['day', 'week', 'month'])('preserves the selected date and %s view through services and hours', view => {
    let current = new URL(`https://salon.test/painel?date=2027-01-02&view=${view}`)
    for (const pathname of ['/painel/servicos', '/painel/configuracoes', '/painel']) {
      current = new URL(adminHref(pathname, current.searchParams), current)
      expect(current.pathname).toBe(pathname)
      expect(current.searchParams.get('date')).toBe('2027-01-02')
      expect(current.searchParams.get('view')).toBe(view)
    }
  })

  it('does not carry unrelated parameters into another admin page', () => {
    const query = new URLSearchParams('date=2027-01-02&view=week&filter=archived')
    expect(adminHref('/painel', query)).toBe('/painel?date=2027-01-02&view=week')
  })
})
