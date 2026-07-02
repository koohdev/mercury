export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const uniqueDays = Array.from(
    new Set(
      dates.map((d) => {
        const date = new Date(d)
        const yyyy = date.getFullYear()
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(date.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
      })
    )
  )
    .map((d) => new Date(d + 'T00:00:00'))
    .sort((a, b) => b.getTime() - a.getTime()) // newest first

  let streak = 0
  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  const newestDate = uniqueDays[0]
  if (newestDate) {
    const diffTime = Math.abs(currentDate.getTime() - newestDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 1) return 0
  } else {
    return 0
  }

  let expectedTime = newestDate.getTime()
  for (let i = 0; i < uniqueDays.length; i++) {
    if (uniqueDays[i].getTime() === expectedTime) {
      streak++
      expectedTime -= 24 * 60 * 60 * 1000 // subtract one day
    } else {
      break
    }
  }
  return streak
}
