import { formatInTimeZone, toDate } from 'date-fns-tz'

export function toLocal(date: Date | string, timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  return formatInTimeZone(date, timeZone, 'yyyy-MM-dd HH:mm:ss zzz')
}

export function toUTC(dateString: string, timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  return toDate(dateString, { timeZone }).toISOString()
}

export function formatInterval(interval: string | null) {
  if (!interval) return '0m'
  const parts = interval.split(':')
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10)
    const minutes = parseInt(parts[1], 10)
    
    let result = ''
    if (hours > 0) result += `${hours}h `
    if (minutes > 0 || hours === 0) result += `${minutes}m`
    return result.trim()
  }
  return interval
}

export function formatTimeOnly(dateStr: string | null, timeZone: string) {
  if (!dateStr) return '--:--'
  return formatInTimeZone(new Date(dateStr), timeZone, 'h:mm a')
}

export function formatDateOnly(dateStr: string | null, timeZone: string) {
  if (!dateStr) return ''
  return formatInTimeZone(new Date(dateStr), timeZone, 'EEEE, MMMM d, yyyy')
}

export function formatDateKey(dateStr: string, timeZone: string) {
  return formatInTimeZone(new Date(dateStr), timeZone, 'yyyy-MM-dd')
}

export function timeToUTC(timeStr: string, timeZone: string): string {
  if (!timeStr) return ''
  const dateStr = `2026-01-01T${timeStr}:00`
  const localDate = toDate(dateStr, { timeZone })
  return formatInTimeZone(localDate, 'UTC', 'HH:mm:ss')
}

export function timeToLocal(utcTimeStr: string, timeZone: string): string {
  if (!utcTimeStr) return ''
  const cleanUtc = utcTimeStr.length === 5 ? `${utcTimeStr}:00` : utcTimeStr
  const dateStr = `2026-01-01T${cleanUtc}Z`
  const utcDate = new Date(dateStr)
  return formatInTimeZone(utcDate, timeZone, 'HH:mm')
}


