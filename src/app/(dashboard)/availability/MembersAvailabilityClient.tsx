'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, Globe, Users, Search } from 'lucide-react'
import { timeToLocal } from '@/lib/utils/timezone'
import { Availability } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface MemberProfile {
  id: string
  legal_full_name: string
  email: string
  role: 'admin' | 'moderator' | 'manager'
  timezone: string
}

interface MembersAvailabilityClientProps {
  initialMembers: MemberProfile[]
  initialAvailability: Availability[]
  initialTotalCount: number
  adminTimezone: string
}

const DAYS = [
  { dayOfWeek: 0, label: 'Sunday' },
  { dayOfWeek: 1, label: 'Monday' },
  { dayOfWeek: 2, label: 'Tuesday' },
  { dayOfWeek: 3, label: 'Wednesday' },
  { dayOfWeek: 4, label: 'Thursday' },
  { dayOfWeek: 5, label: 'Friday' },
  { dayOfWeek: 6, label: 'Saturday' },
]

const ROLE_BADGE: Record<string, string> = {
  moderator: 'bg-blue-950/30 text-blue-400 border-blue-900/50',
  manager: 'bg-amber-950/30 text-amber-400 border-amber-900/50',
  admin: 'bg-purple-950/30 text-purple-400 border-purple-900/50',
}

export default function MembersAvailabilityClient({
  initialMembers,
  initialAvailability,
  initialTotalCount,
  adminTimezone,
}: MembersAvailabilityClientProps) {
  const [members, setMembers] = useState<MemberProfile[]>(initialMembers)
  const [allAvailability, setAllAvailability] = useState<Availability[]>(initialAvailability)
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount)
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMembers[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  const isFirstRender = useRef(true)

  const selectedMemberIdRef = useRef(selectedMemberId)
  useEffect(() => {
    selectedMemberIdRef.current = selectedMemberId
  }, [selectedMemberId])

  const [prevInitialMembers, setPrevInitialMembers] = useState(initialMembers)
  if (initialMembers !== prevInitialMembers) {
    setPrevInitialMembers(initialMembers)
    setMembers(initialMembers)
    setAllAvailability(initialAvailability)
    setTotalCount(initialTotalCount)
    if (initialMembers.length > 0 && !initialMembers.some(m => m.id === selectedMemberId)) {
      setSelectedMemberId(initialMembers[0].id)
    }
  }

  const selectedMember = members.find((m) => m.id === selectedMemberId)
  const memberAvailability = allAvailability.filter((a) => a.user_id === selectedMemberId)
  const memberTz = selectedMember?.timezone || adminTimezone

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to page 1 on new search query
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Query paginated members + availability from database when page or search term changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const fetchData = async () => {
      setLoading(true)
      const supabase = createClient()
      try {
        let query = supabase
          .from('profiles')
          .select('id, legal_full_name, email, role, timezone', { count: 'exact' })
          .in('role', ['moderator', 'manager'])
          .eq('status', 'active')

        if (debouncedSearch) {
          query = query.or(`legal_full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`)
        }

        const from = (currentPage - 1) * 10
        const to = from + 9

        const { data: profiles, count, error } = await query
          .order('legal_full_name', { ascending: true })
          .range(from, to)

        if (error) throw error

        const newMembers = (profiles || []).map((p) => ({
          ...p,
          role: p.role as 'admin' | 'moderator' | 'manager',
          timezone: p.timezone || 'Asia/Manila',
        }))
        const newCount = count || 0

        const memberIds = newMembers.map((m) => m.id)
        let newAvail: Availability[] = []

        if (memberIds.length > 0) {
          const { data: availData, error: availError } = await supabase
            .from('availability')
            .select('*')
            .in('user_id', memberIds)

          if (availError) throw availError
          newAvail = availData || []
        }

        setMembers(newMembers)
        setTotalCount(newCount)
        setAllAvailability(newAvail)

        if (newMembers.length > 0) {
          const stillExists = newMembers.some((m) => m.id === selectedMemberIdRef.current)
          if (!stillExists) {
            setSelectedMemberId(newMembers[0].id)
          }
        } else {
          setSelectedMemberId('')
        }
      } catch (err) {
        console.error('Error fetching members availability:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentPage, debouncedSearch])

  // Local time ticker for selected member timezone
  useEffect(() => {
    if (!memberTz) return
    const update = () => {
      try {
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: memberTz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(new Date())
        setCurrentTime(formatted)
      } catch {
        setCurrentTime('')
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [memberTz])

  const getDayAvailability = (dayOfWeek: number) => {
    const row = memberAvailability.find((a) => a.day_of_week === dayOfWeek)
    if (!row || !row.is_available) return null
    return {
      startTime: row.start_time ? timeToLocal(row.start_time, 'America/New_York') : '—',
      endTime: row.end_time ? timeToLocal(row.end_time, 'America/New_York') : '—',
    }
  }

  // Filtered members list represents current paginated members loaded from backend
  const filteredMembers = members

  // Visual sub-render of Availability Details
  const renderAvailabilityDetails = () => {
    if (!selectedMember) {
      return (
        <div className="text-center py-xl border border-dashed border-hairline rounded-2xl bg-surface-1">
          <Users className="h-8 w-8 text-ink-subtle mx-auto mb-sm animate-pulse-slow" />
          <p className="text-ink-subtle text-body-sm font-medium">Select a team member to view availability</p>
        </div>
      )
    }

    return (
      <div className="space-y-md">
        {/* Selected Member Header Card */}
        <div className="bg-surface-1 border border-hairline rounded-2xl p-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="flex items-center gap-md">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-body-lg font-bold text-primary">
              {selectedMember.legal_full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-xs flex-wrap">
                <h2 className="text-subhead font-semibold text-ink">
                  {selectedMember.legal_full_name}
                </h2>
                <span className={`px-2 py-0.5 rounded-pill text-caption font-medium border capitalize ${ROLE_BADGE[selectedMember.role] || ''}`}>
                  {selectedMember.role}
                </span>
              </div>
              <p className="text-body-sm text-ink-muted mt-xxs">{selectedMember.email}</p>
            </div>
          </div>

          {/* Timezone & Local Time Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-sm bg-surface-2/60 border border-hairline px-md py-sm rounded-xl">
            <div className="flex items-center gap-xs text-ink-muted text-body-sm">
              <Globe className="w-4 h-4 text-ink-subtle shrink-0" />
              <span>{memberTz}</span>
            </div>
            {currentTime && (
              <div className="flex items-center gap-xs text-body-sm font-semibold text-ink border-t sm:border-t-0 sm:border-l border-hairline pt-xxs sm:pt-0 sm:pl-sm">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="font-mono">{currentTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Timezone notice for admin */}
        <div className="flex items-start gap-sm bg-surface-1 p-sm border border-hairline rounded-lg text-body-sm text-ink-muted">
          <Globe className="mt-0.5 w-4 h-4 text-ink-subtle shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-xs gap-y-0.5">
            <div>
              <span className="font-medium text-ink">Display timezone: </span>
              <span className="font-semibold text-ink">EST (America/New_York)</span>
            </div>
            <span className="text-ink-tertiary text-xs sm:text-body-sm sm:before:content-['—_']">
              All availability hours are automatically converted to EST for comparison.
            </span>
          </div>
        </div>

        {/* Days Availability Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-sm">
          {DAYS.map(({ dayOfWeek, label }) => {
            const avail = getDayAvailability(dayOfWeek)
            const isAvailable = !!avail

            return (
              <div
                key={dayOfWeek}
                className={`flex flex-col justify-between p-md rounded-2xl border transition-all duration-200 min-h-[140px] relative overflow-hidden ${
                  isAvailable
                    ? 'bg-surface-1 border-primary/20 hover:border-primary/40 shadow-xs'
                    : 'bg-surface-1/40 border-hairline opacity-60'
                }`}
              >
                {/* Day & Status Row */}
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-semibold text-ink">{label}</span>
                  <span
                    className={`inline-flex items-center gap-xs px-2 py-0.5 rounded-full text-caption font-medium border ${
                      isAvailable
                        ? 'bg-semantic-success/10 text-semantic-success border-semantic-success/20'
                        : 'bg-surface-2 text-ink-subtle border-hairline-strong'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-semantic-success' : 'bg-ink-tertiary'}`} />
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {/* Times Row */}
                <div className="mt-md pt-sm border-t border-hairline flex items-center gap-sm">
                  {isAvailable ? (
                    <div className="flex items-center gap-xs w-full">
                      <Clock className="w-4 h-4 text-ink-subtle shrink-0" />
                      <div className="text-caption font-mono font-medium text-ink flex-1 truncate">
                        {avail.startTime} <span className="text-ink-tertiary font-sans px-xxs">to</span> {avail.endTime} <span className="text-[10px] text-ink-muted uppercase ml-1">EST</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-caption text-ink-subtle italic">No shifts assigned</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-lg w-full">
      {/* 1. Mobile/Tablet member selection deck */}
      <div className="lg:hidden flex flex-col gap-sm">
        <div className="flex items-center justify-between">
          <label className="text-caption font-semibold text-ink-subtle uppercase tracking-wider">
            Select Team Member ({totalCount})
          </label>
        </div>
        <div className="relative space-y-sm">
          {/* Search bar for mobile */}
          <div className="relative w-full">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              placeholder="Search team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-surface-1 text-ink text-body-sm pl-10 pr-sm rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle transition-colors"
            />
          </div>

          {/* Horizontal scroll avatar list */}
          <div className={`flex gap-sm overflow-x-auto pt-1 px-1 pb-xs scrollbar-thin snap-x transition-opacity duration-150 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {filteredMembers.map((member) => {
              const isSelected = member.id === selectedMemberId
              const initials = member.legal_full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className="flex flex-col items-center gap-xxs shrink-0 snap-start focus:outline-hidden cursor-pointer"
                >
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-canvas'
                        : 'bg-surface-2 text-ink-muted hover:bg-surface-3'
                    }`}
                  >
                    {initials}
                  </div>
                  <span
                    className={`text-caption font-medium max-w-[64px] truncate text-center ${
                      isSelected ? 'text-ink font-semibold' : 'text-ink-muted'
                    }`}
                  >
                    {member.legal_full_name.split(' ')[0]}
                  </span>
                </button>
              )
            })}
            {filteredMembers.length === 0 && !loading && (
              <p className="text-caption text-ink-subtle italic py-xs">No team members match search</p>
            )}
          </div>

          {/* Mobile Pagination controls */}
          {totalCount > 10 && (
            <div className="flex items-center justify-between py-xs px-1 border-t border-hairline">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-surface-2 border border-hairline hover:bg-surface-3 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Prev
              </button>
              <span className="text-[11px] text-ink-muted">
                Page {currentPage} of {Math.ceil(totalCount / 10)} ({totalCount} total)
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalCount / 10), p + 1))}
                disabled={currentPage === Math.ceil(totalCount / 10) || loading}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-surface-2 border border-hairline hover:bg-surface-3 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Selected Member availability for Mobile */}
        <div className="pt-sm">
          {renderAvailabilityDetails()}
        </div>
      </div>

      {/* 2. Desktop split view layout */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-lg items-start">
        {/* Left Column: Member Sidebar */}
        <div className="lg:col-span-4 bg-surface-1 border border-hairline rounded-2xl p-md space-y-md shadow-xs">
          <div>
            <h3 className="text-body font-semibold text-ink">Team Members</h3>
            <p className="text-caption text-ink-muted mt-xxs">Select a member ({totalCount} total)</p>
          </div>
          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-surface-2 text-ink text-body-sm pl-10 pr-sm rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle transition-colors"
            />
          </div>
          {/* Members list */}
          <div className={`space-y-xs max-h-[500px] overflow-y-auto pr-xs transition-opacity duration-150 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {filteredMembers.map((member) => {
              const isSelected = member.id === selectedMemberId
              const initials = member.legal_full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`w-full flex items-center gap-sm p-sm rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-surface-2 border-hairline-strong shadow-xs'
                      : 'bg-transparent border-transparent hover:bg-surface-2/40'
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold text-caption shrink-0 transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-surface-3 text-ink-subtle'
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold text-ink truncate">
                      {member.legal_full_name}
                    </p>
                    <p className="text-caption text-ink-muted truncate mt-xxs">{member.email}</p>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded-pill text-[10px] font-semibold border capitalize shrink-0 ${
                      ROLE_BADGE[member.role] || ''
                    }`}
                  >
                    {member.role}
                  </span>
                </button>
              )
            })}
            {filteredMembers.length === 0 && !loading && (
              <p className="text-caption text-ink-subtle italic text-center py-md">No members found</p>
            )}
          </div>

          {/* Desktop Pagination controls */}
          {totalCount > 10 && (
            <div className="flex items-center justify-between pt-md border-t border-hairline">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1.5 text-caption font-medium rounded-md bg-surface-2 border border-hairline hover:bg-surface-3 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="text-caption text-ink-muted">
                Page {currentPage} of {Math.ceil(totalCount / 10)}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalCount / 10), p + 1))}
                disabled={currentPage === Math.ceil(totalCount / 10) || loading}
                className="px-3 py-1.5 text-caption font-medium rounded-md bg-surface-2 border border-hairline hover:bg-surface-3 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Availability Grid */}
        <div className="lg:col-span-8">
          {renderAvailabilityDetails()}
        </div>
      </div>
    </div>
  )
}
