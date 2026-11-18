import { describe, expect, it } from 'vitest'
import { getCalendarRange, calendarDays, parseCalendarQuery, parsePriceCents, shiftDate, localDateTimeToISO } from './calendar'

describe('calendar in São Paulo', () => {
  it('uses an exclusive next midnight independent of machine timezone', () => {
    expect(getCalendarRange('2026-12-31', 'day')).toEqual({ start: '2026-12-31T03:00:00.000Z', end: '2027-01-01T03:00:00.000Z' })
  })
  it('starts weeks on Monday across year boundaries', () => {
    expect(getCalendarRange('2027-01-01', 'week')).toEqual({ start: '2026-12-28T03:00:00.000Z', end: '2027-01-04T03:00:00.000Z' })
  })
  it('fetches the whole visible month grid including adjacent months', () => {
    expect(calendarDays('2026-02-10', 'month')).toHaveLength(35)
    expect(getCalendarRange('2026-02-10', 'month')).toEqual({ start: '2026-01-26T03:00:00.000Z', end: '2026-03-02T03:00:00.000Z' })
  })
  it('validates leap days and rejects duplicate query values', () => {
    expect(parseCalendarQuery({ date: '2026-02-29', view: ['week', 'day'] }, '2026-09-16')).toEqual({ date: '2026-09-16', view: 'day' })
    expect(parseCalendarQuery({ date: '2028-02-29', view: 'month' }, '2026-09-16').date).toBe('2028-02-29')
  })
  it('clamps month navigation and handles leap years', () => {
    expect(shiftDate('2028-01-31', 'month', 1)).toBe('2028-02-29')
    expect(shiftDate('2026-12-31', 'day', 1)).toBe('2027-01-01')
  })
  it('converts local block timestamps and rejects invalid dates', () => {
    expect(localDateTimeToISO('2026-09-16T09:30')).toBe('2026-09-16T12:30:00.000Z')
    expect(() => localDateTimeToISO('2026-02-30T09:30')).toThrow()
  })
})

describe('Brazilian money input', () => {
  it.each([['0,29', 29], ['1234,56', 123456], ['1.234,56', 123456], ['90', 9000]])('parses %s exactly', (value, cents) => {
    expect(parsePriceCents(value)).toBe(cents)
  })
  it.each(['-1', '1.23', '1,234', 'abc', '', '1e3', '9007199254740991'])('rejects malformed or unsafe amounts %s', value => {
    expect(() => parsePriceCents(value)).toThrow()
  })
})
