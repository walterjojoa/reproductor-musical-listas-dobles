/** 215 -> "3:35" */
export function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

/** "3:35" o "215" -> 215; null si no es válido. */
export function parseTime(text: string): number | null {
  const value = text.trim()
  const match = /^(\d{1,3})(?::([0-5]\d))?$/.exec(value)
  if (!match) return null
  const seconds = match[2] === undefined ? Number(match[1]) : Number(match[1]) * 60 + Number(match[2])
  return seconds > 0 ? seconds : null
}
