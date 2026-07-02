'use client'

import { useState } from 'react'
import { Clock, Globe, ChevronDown, Users } from 'lucide-react'
import { timeToLocal } from '@/lib/utils/timezone'
import { Availability, Profile } from '@/lib/types'

interface MemberProfile {
  id: string
  legal_full_name: string
  email: string
  role: 'admin' | 'moderator' | 'manager'
  timezone: string
}

interface MembersAvailabilityClientProps {
  members: MemberProfile[]
  allAvailability: Availability[]
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
  members,
  allAvailability,
  adminTimezone,
}: MembersAvailabilityClientProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '')
  const [isOpen, setIsOpen] = useState(false)

  const selectedMember = members.find((m) => m.id === selectedMemberId)
  const memberAvailability = allAvailability.filter((a) => a.user_id === selectedMemberId)
  const memberTz = selectedMember?.timezone || adminTimezone

  const getDayAvailability = (dayOfWeek: number) => {
    const row = memberAvailability.find((a) => a.day_of_week === dayOfWeek)
    if (!row || !row.is_available) return null
    return {
      startTime: row.start_time ? timeToLocal(row.start_time, memberTz) : '—',
      endTime: row.end_time ? timeToLocal(row.end_time, memberTz) : '—',
    }
  }

  if (members.length === 0) {
    return (
      <div className="space-y-lg w-full">
        <div className="text-center py-xl border border-dashed border-hairline rounded-lg bg-surface-1">
          <Users className="h-8 w-8 text-ink-subtle mx-auto mb-sm" />
          <p className="text-ink-subtle text-body-sm">No team members found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-lg w-full">
      {/* Member Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-surface-1 border border-hairline rounded-lg p-md hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-md">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-body font-semibold text-ink">
                {selectedMember?.legal_full_name || 'Select a member'}
              </p>
              <div className="flex items-center gap-xs mt-xxs">
                <span className="text-body-sm text-ink-muted">{selectedMember?.email}</span>
                {selectedMember && (
                  <span className={`px-2 py-0.5 rounded-pill text-caption font-medium border capitalize ${ROLE_BADGE[selectedMember.role] || ''}`}>
                    {selectedMember.role}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-ink-subtle transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown List */}
        {isOpen && (
          <div className="absolute z-20 mt-xs w-full bg-surface-1 border border-hairline rounded-lg shadow-2xl max-h-64 overflow-y-auto">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  setSelectedMemberId(member.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-md p-md text-left hover:bg-surface-2 transition-colors cursor-pointer first:rounded-t-lg last:rounded-b-lg ${
                  member.id === selectedMemberId ? 'bg-surface-2' : ''
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-body-sm font-semibold text-primary">
                  {member.legal_full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-ink truncate">{member.legal_full_name}</p>
                  <p className="text-caption text-ink-muted truncate">{member.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-pill text-caption font-medium border capitalize shrink-0 ${ROLE_BADGE[member.role] || ''}`}>
                  {member.role}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timezone Notice */}
      <div className="flex items-start gap-sm bg-surface-1 p-sm border border-hairline rounded-lg text-body-sm text-ink-muted">
        <Globe className="mt-0.5 w-4 h-4 text-ink-subtle shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-xs gap-y-0.5">
          <div>
            <span className="font-medium text-ink">Member&apos;s timezone: </span>
            <span className="font-semibold text-ink">{memberTz}</span>
          </div>
          <span className="text-ink-tertiary text-xs sm:text-body-sm sm:before:content-['—_']">
            Times shown in the member&apos;s local timezone.
          </span>
        </div>
      </div>

      {/* Day Rows (Read-Only) */}
      <div className="space-y-sm">
        {DAYS.map(({ dayOfWeek, label }) => {
          const avail = getDayAvailability(dayOfWeek)
          const isAvailable = !!avail

          return (
            <div
              key={dayOfWeek}
              className={`flex flex-col sm:flex-row sm:items-center gap-md p-md rounded-lg border transition-all duration-150 ${
                isAvailable
                  ? 'bg-surface-1 border-hairline-strong'
                  : 'bg-surface-1 border-hairline opacity-50'
              }`}
            >
              {/* Day Name with Status Indicator */}
              <div className="flex items-center gap-sm sm:w-36 shrink-0">
                <div
                  className={`h-5 w-5 rounded flex items-center justify-center border shrink-0 ${
                    isAvailable
                      ? 'bg-primary border-primary'
                      : 'bg-surface-2 border-hairline-strong'
                  }`}
                >
                  {isAvailable && (
                    <svg className="w-3.5 h-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className={`text-body-sm font-medium ${isAvailable ? 'text-ink' : 'text-ink-subtle'}`}>
                  {label}
                </span>
              </div>

              {/* Time Display */}
              <div className={`flex flex-1 items-center gap-xs sm:gap-sm transition-opacity duration-150 ${isAvailable ? '' : 'opacity-40'}`}>
                <Clock className="w-4 h-4 text-ink-subtle shrink-0 hidden sm:block" />
                {isAvailable ? (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="bg-surface-2 px-2 sm:px-sm py-1.5 border border-hairline rounded-md text-body-sm text-ink">
                        {avail.startTime}
                      </div>
                    </div>
                    <span className="font-medium text-body-sm text-ink-subtle shrink-0">to</span>
                    <div className="flex-1 min-w-0">
                      <div className="bg-surface-2 px-2 sm:px-sm py-1.5 border border-hairline rounded-md text-body-sm text-ink">
                        {avail.endTime}
                      </div>
                    </div>
                  </>
                ) : (
                  <span className="text-body-sm text-ink-subtle italic">Not available</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
