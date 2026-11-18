import { parseCalendarQuery } from './calendar'

export function adminHref(pathname: string, query: Pick<URLSearchParams, 'getAll'>): string {
  const dates = query.getAll('date')
  const views = query.getAll('view')
  const selection = parseCalendarQuery({
    date: dates.length === 1 ? dates[0] : dates,
    view: views.length === 1 ? views[0] : views,
  })
  return `${pathname}?${new URLSearchParams(selection)}`
}
