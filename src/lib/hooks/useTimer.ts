import { useEffect, useState } from 'react'

interface BreakItem {
  start_time: string
  end_time: string | null
}

export function useTimer(
  clockInTime: string | null,
  breaks: BreakItem[] = [],
  status: 'active' | 'on_break' | 'completed'
) {
  const getElapsedSeconds = () => {
    if (!clockInTime || status === 'completed') {
      return 0
    }
    const clockInMs = new Date(clockInTime).getTime()

    let breakMs = 0
    breaks.forEach((b) => {
      const start = new Date(b.start_time).getTime()
      const end = b.end_time ? new Date(b.end_time).getTime() : Date.now()
      breakMs += end - start
    })

    const now =
      status === 'on_break'
        ? new Date(breaks.find((b) => !b.end_time)?.start_time || Date.now()).getTime()
        : Date.now()

    const elapsed = Math.max(0, now - clockInMs - breakMs)
    return Math.floor(elapsed / 1000)
  }

  // ponytail: calculate initial value synchronously to avoid cascading renders warning in React
  const [seconds, setSeconds] = useState(getElapsedSeconds)

  useEffect(() => {
    if (!clockInTime || status === 'completed' || status === 'on_break') {
      if (status === 'on_break') {
        setSeconds(getElapsedSeconds())
      } else {
        setSeconds(0)
      }
      return
    }

    const interval = setInterval(() => {
      setSeconds(getElapsedSeconds())
    }, 1000)

    return () => clearInterval(interval)
  }, [clockInTime, breaks, status])

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':')
  }

  return { seconds, formatted: formatTime(seconds) }
}
