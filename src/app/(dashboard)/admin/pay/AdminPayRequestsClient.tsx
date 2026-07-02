'use client'

import { useState, useTransition } from 'react'
import { Check, X, Loader2, AlertCircle, Filter, CreditCard } from 'lucide-react'
import { resolvePayChangeRequest } from '@/lib/actions/pay'
import { PayChangeRequest } from '@/lib/types'
import { Input } from '@/components/ui/input'

interface RequestWithJoins extends PayChangeRequest {
  profiles?: { legal_full_name: string; email: string } | null
  pay_records?: { period_label: string; amount: number } | null
}

interface AdminPayRequestsClientProps {
  requests: RequestWithJoins[]
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

type FilterTab = 'pending' | 'approved' | 'denied' | 'all'

const TAB_CONFIG: { key: FilterTab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'denied', label: 'Denied' },
  { key: 'all', label: 'All' },
]

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-950/20 text-amber-400 border-amber-900/50',
  approved: 'bg-semantic-success/10 text-semantic-success border-semantic-success/20',
  denied: 'bg-red-950/20 text-red-400 border-red-900/30',
}

export default function AdminPayRequestsClient({ requests }: AdminPayRequestsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<FilterTab>('pending')
  const [adminNotes, setAdminNotes] = useState<{ [id: string]: string }>({})
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [resolveSuccess, setResolveSuccess] = useState<string | null>(null)
  const [denyErrors, setDenyErrors] = useState<{ [id: string]: string }>({})

  const filteredRequests = activeTab === 'all'
    ? requests
    : requests.filter((r) => r.status === activeTab)

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  const handleResolve = (requestId: string, decision: 'approved' | 'denied') => {
    setResolveError(null)
    setResolveSuccess(null)

    // If denying, require a reason
    if (decision === 'denied') {
      const notes = (adminNotes[requestId] || '').trim()
      if (notes.length < 5) {
        setDenyErrors((prev) => ({ ...prev, [requestId]: 'Please provide a reason for denial (at least 5 characters).' }))
        return
      }
    }

    setDenyErrors((prev) => {
      const next = { ...prev }
      delete next[requestId]
      return next
    })

    startTransition(async () => {
      const res = await resolvePayChangeRequest(requestId, decision, adminNotes[requestId])
      if (res?.error) {
        setResolveError(res.error)
      } else {
        setResolveSuccess(`Request ${decision} successfully.`)
        setTimeout(() => setResolveSuccess(null), 3000)
      }
    })
  }

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex items-center gap-md">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-section-title font-semibold text-ink">Pay Requests</h1>
          <p className="text-body-sm text-ink-muted">Review and manage pay change requests from team members.</p>
        </div>
        {pendingCount > 0 && (
          <span className="ml-auto bg-amber-950/30 text-amber-400 border border-amber-900/50 text-caption font-medium px-2.5 py-1 rounded-pill">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-xs border-b border-hairline">
        {TAB_CONFIG.map((tab) => {
          const count = tab.key === 'all' ? requests.length : requests.filter((r) => r.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-md py-2 text-body-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-ink-subtle hover:text-ink hover:border-hairline-strong'
              }`}
            >
              {tab.label}
              <span className={`ml-xs text-caption ${activeTab === tab.key ? 'text-primary' : 'text-ink-tertiary'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Alerts */}
      {resolveError && (
        <div className="p-sm bg-red-950/20 border border-red-900/50 rounded-md text-body-sm text-red-400 flex items-center gap-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {resolveError}
        </div>
      )}
      {resolveSuccess && (
        <div className="p-sm bg-semantic-success/10 border border-semantic-success/20 rounded-md text-body-sm text-semantic-success flex items-center gap-xs">
          <Check className="h-4 w-4 shrink-0" />
          {resolveSuccess}
        </div>
      )}

      {/* Request Cards */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-xl border border-dashed border-hairline rounded-lg bg-surface-1">
          <Filter className="h-8 w-8 text-ink-subtle mx-auto mb-sm" />
          <p className="text-ink-subtle text-body-sm">
            {activeTab === 'all' ? 'No pay change requests found.' : `No ${activeTab} requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-sm">
          {filteredRequests.map((req) => (
            <div key={req.id} className="bg-surface-1 border border-hairline rounded-lg p-lg space-y-sm">
              {/* Request Header */}
              <div className="flex items-start justify-between gap-md">
                <div className="space-y-xxs">
                  <p className="text-body font-semibold text-ink">
                    {req.profiles?.legal_full_name || 'Unknown'}
                  </p>
                  <p className="text-body-sm text-ink-muted">
                    {req.profiles?.email}
                  </p>
                  <p className="text-body-sm text-ink-muted">
                    Period: {req.pay_records?.period_label || '—'} &bull; Current: {formatCurrency(req.pay_records?.amount || 0)}
                  </p>
                  <p className="text-body-sm text-ink-muted">
                    Requested: <span className="font-semibold text-ink">{formatCurrency(req.requested_amount)}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-xs shrink-0">
                  <span className={`px-2 py-0.5 rounded-pill text-caption font-medium border capitalize ${STATUS_BADGE[req.status] || ''}`}>
                    {req.status}
                  </span>
                  <span className="text-caption text-ink-subtle whitespace-nowrap">{formatDate(req.created_at)}</span>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-surface-2 border border-hairline rounded-md p-sm text-body-sm text-ink-muted">
                <span className="font-medium text-ink-subtle text-caption uppercase tracking-wider">Reason:</span>
                <p className="mt-xxs">{req.reason}</p>
              </div>

              {/* Admin Notes (for resolved) */}
              {req.admin_notes && req.status !== 'pending' && (
                <div className="bg-surface-2 border border-hairline rounded-md p-sm text-body-sm text-ink-muted">
                  <span className="font-medium text-ink-subtle text-caption uppercase tracking-wider">Admin Notes:</span>
                  <p className="mt-xxs">{req.admin_notes}</p>
                </div>
              )}

              {/* Resolution Info */}
              {req.resolved_at && (
                <p className="text-caption text-ink-tertiary">
                  Resolved {formatDate(req.resolved_at)}
                </p>
              )}

              {/* Action Buttons (pending only) */}
              {req.status === 'pending' && (
                <div className="space-y-xs pt-xs border-t border-hairline">
                  <Input
                    type="text"
                    placeholder={`Notes ${req.status === 'pending' ? '(required for deny)' : '(optional)'}...`}
                    value={adminNotes[req.id] || ''}
                    onChange={(e) => {
                      setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                      if (denyErrors[req.id]) {
                        setDenyErrors((prev) => {
                          const next = { ...prev }
                          delete next[req.id]
                          return next
                        })
                      }
                    }}
                    className="w-full bg-surface-2 text-ink text-body-sm px-sm py-1.5 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle h-10"
                  />
                  {denyErrors[req.id] && (
                    <p className="text-caption text-red-400">{denyErrors[req.id]}</p>
                  )}
                  <div className="flex items-center gap-sm">
                    <button
                      disabled={isPending}
                      onClick={() => handleResolve(req.id, 'approved')}
                      className="flex-1 inline-flex items-center justify-center gap-xs bg-semantic-success/10 hover:bg-semantic-success/20 text-semantic-success border border-semantic-success/30 px-md py-1.5 rounded-md text-button font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => handleResolve(req.id, 'denied')}
                      className="flex-1 inline-flex items-center justify-center gap-xs bg-red-950/10 hover:bg-red-950/20 text-red-400 border border-red-900/30 px-md py-1.5 rounded-md text-button font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      Deny
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
