import { useEffect, useState, useCallback } from 'react'

interface BreakItem {
  start_time: string
  end_time: string | null
}

export function useTimer(
  clockInTime: string | null,
  breaks: BreakItem[] = [],
  status: 'active' | 'on_break' | 'completed'
) {
  const getElapsedSeconds = useCallback(() => {
    if (!clockInTime || status === 'completed') {
      return 0
    }
    const clockInMs = new Date(clockInTime).getTime()

    let breakMs = 0
    breaks.forEach((b) => {
      if (b.end_time) {
        const start = new Date(b.start_time).getTime()
        const end = new Date(b.end_time).getTime()
        breakMs += end - start
      }
    })

    const now =
      status === 'on_break'
        ? new Date(breaks.find((b) => !b.end_time)?.start_time || Date.now()).getTime()
        : Date.now()

    const elapsed = Math.max(0, now - clockInMs - breakMs)
    return Math.floor(elapsed / 1000)
  }, [clockInTime, breaks, status])

  // ponytail: calculate initial value synchronously to avoid cascading renders warning in React
  const [seconds, setSeconds] = useState(getElapsedSeconds)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!clockInTime || status === 'completed' || status === 'on_break') {
      const elapsedVal = status === 'on_break' ? getElapsedSeconds() : 0
      const timer = setTimeout(() => setSeconds(elapsedVal), 0)
      return () => clearTimeout(timer)
    }

    const interval = setInterval(() => {
      setSeconds(getElapsedSeconds())
    }, 1000)

    return () => clearInterval(interval)
  }, [clockInTime, status, getElapsedSeconds])

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

  return { seconds, formatted: mounted ? formatTime(seconds) : '00:00:00' }
}

export function useBreakTimer(
  breaks: BreakItem[] = [],
  status: 'active' | 'on_break' | 'completed'
) {
  const getElapsedBreakSeconds = useCallback(() => {
    let totalMs = 0
    breaks.forEach((b) => {
      const start = new Date(b.start_time).getTime()
      const end = b.end_time ? new Date(b.end_time).getTime() : Date.now()
      totalMs += end - start
    })
    return Math.floor(totalMs / 1000)
  }, [breaks])

  const [seconds, setSeconds] = useState(getElapsedBreakSeconds)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (status !== 'on_break') {
      const timer = setTimeout(() => setSeconds(getElapsedBreakSeconds()), 0)
      return () => clearTimeout(timer)
    }

    const interval = setInterval(() => {
      setSeconds(getElapsedBreakSeconds())
    }, 1000)

    return () => clearInterval(interval)
  }, [status, getElapsedBreakSeconds])

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

  return { seconds, formatted: mounted ? formatTime(seconds) : '00:00:00' }
}
