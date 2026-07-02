'use client'

import { useState, useTransition } from 'react'
import { DollarSign, ChevronDown, ChevronUp, X, Loader2, Check, Clock, AlertCircle } from 'lucide-react'
import { submitPayChangeRequest, resolvePayChangeRequest } from '@/lib/actions/pay'
import { PayRecord, PayChangeRequest } from '@/lib/types'

interface Profile {
  legal_full_name: string
  pay_rate: number
}

interface AdminPendingRequest extends PayChangeRequest {
  profiles?: { legal_full_name: string; email: string } | null
  pay_records?: { period_label: string; amount: number } | null
}

interface PayClientProps {
  profile: Profile | null
  payRecords: PayRecord[]
  changeRequests: PayChangeRequest[]
  adminPendingRequests: AdminPendingRequest[] | null
  isAdmin: boolean
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const currentMonthLabel = () =>
  new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

export default function PayClient({
  profile,
  payRecords,
  changeRequests,
  adminPendingRequests,
  isAdmin,
}: PayClientProps) {
  const [isPending, startTransition] = useTransition()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<PayRecord | null>(null)
  const [requestedAmount, setRequestedAmount] = useState('')
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(payRecords[0]?.id || null)

  // Admin resolution state
  const [adminNotes, setAdminNotes] = useState<{ [id: string]: string }>({})
  const [resolveError, setResolveError] = useState<string | null>(null)

  const payRate = profile?.pay_rate || 0
  const perPeriodAmount = payRate / 2

  const openRequestModal = (record: PayRecord) => {
    setSelectedRecord(record)
    setRequestedAmount('')
    setReason('')
    setFormError(null)
    setFormSuccess(false)
    setShowRequestModal(true)
  }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const amount = parseFloat(requestedAmount)
    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid positive amount.')
      return
    }
    if (reason.trim().length < 10) {
      setFormError('Please provide at least 10 characters of justification.')
      return
    }
    if (!selectedRecord) return

    startTransition(async () => {
      const res = await submitPayChangeRequest({
        payRecordId: selectedRecord.id,
        requestedAmount: amount,
        reason: reason.trim(),
      })

      if (res?.error) {
        setFormError(res.error)
      } else {
        setFormSuccess(true)
        setTimeout(() => setShowRequestModal(false), 1500)
      }
    })
  }

  const handleResolve = (requestId: string, decision: 'approved' | 'denied') => {
    startTransition(async () => {
      const res = await resolvePayChangeRequest(requestId, decision, adminNotes[requestId])
      if (res?.error) setResolveError(res.error)
    })
  }

  return (
    <div className="space-y-lg">

      {/* Pay Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        <div className="bg-surface-1 border border-hairline rounded-lg p-lg flex items-center gap-md">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-eyebrow text-ink-subtle font-medium tracking-eyebrow">Monthly Rate</p>
            <p className="text-card-title font-semibold text-ink">{formatCurrency(payRate)}</p>
          </div>
        </div>

        <div className="bg-surface-1 border border-hairline rounded-lg p-lg flex items-center gap-md">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-eyebrow text-ink-subtle font-medium tracking-eyebrow">Per Pay Period</p>
            <p className="text-card-title font-semibold text-ink">{formatCurrency(perPeriodAmount)}</p>
          </div>
        </div>

        <div className="bg-surface-1 border border-hairline rounded-lg p-lg">
          <p className="text-eyebrow text-ink-subtle font-medium tracking-eyebrow">Pay Schedule</p>
          <p className="text-body font-medium text-ink mt-xxs">Biweekly</p>
          <p className="text-body-sm text-ink-muted mt-xxs">15th &amp; end of month</p>
        </div>
      </div>

      {/* Pay Period Notice */}
      <p className="text-body-sm text-ink-subtle">
        Projected for <span className="font-medium text-ink">{currentMonthLabel()}</span>. Actual payouts handled externally.
      </p>

      {/* Admin: Needs Review Panel */}
      {isAdmin && adminPendingRequests && adminPendingRequests.length > 0 && (
        <div className="space-y-md">
          <div className="flex items-center gap-xs">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <h3 className="text-body font-semibold text-ink">Needs Review</h3>
            <span className="bg-amber-950/30 text-amber-400 border border-amber-900/50 text-caption font-medium px-2 py-0.5 rounded-pill">
              {adminPendingRequests.length}
            </span>
          </div>

          {resolveError && (
            <div className="p-sm bg-red-950/20 border border-red-900/50 rounded-md text-body-sm text-red-400">
              {resolveError}
            </div>
          )}

          <div className="space-y-sm">
            {adminPendingRequests.map((req) => (
              <div key={req.id} className="bg-surface-1 border border-hairline rounded-lg p-lg space-y-sm">
                <div className="flex items-start justify-between gap-md">
                  <div className="space-y-xxs">
                    <p className="text-body font-semibold text-ink">
                      {(req as any).profiles?.legal_full_name || 'Unknown'}
                    </p>
                    <p className="text-body-sm text-ink-muted">
                      Period: {(req as any).pay_records?.period_label || '—'} &bull; Current: {formatCurrency((req as any).pay_records?.amount || 0)}
                    </p>
                    <p className="text-body-sm text-ink-muted">
                      Requested: <span className="font-semibold text-ink">{formatCurrency(req.requested_amount)}</span>
                    </p>
                  </div>
                  <span className="text-caption text-ink-subtle whitespace-nowrap">{formatDate(req.created_at)}</span>
                </div>

                <div className="bg-surface-2 border border-hairline rounded-md p-sm text-body-sm text-ink-muted">
                  <span className="font-medium text-ink-subtle text-caption uppercase tracking-wider">Reason:</span>
                  <p className="mt-xxs">{req.reason}</p>
                </div>

                <div className="space-y-xs">
                  <input
                    type="text"
                    placeholder="Admin notes (optional)"
                    value={adminNotes[req.id] || ''}
                    onChange={(e) => setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                    className="w-full bg-surface-2 text-ink text-body-sm px-sm py-1.5 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle"
                  />
                  <div className="flex items-center gap-sm">
                    <button
                      disabled={isPending}
                      onClick={() => handleResolve(req.id, 'approved')}
                      className="flex-1 inline-flex items-center justify-center gap-xs bg-semantic-success/10 hover:bg-semantic-success/20 text-semantic-success border border-semantic-success/30 px-md py-1.5 rounded-md text-button font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => handleResolve(req.id, 'denied')}
                      className="flex-1 inline-flex items-center justify-center gap-xs bg-red-950/10 hover:bg-red-950/20 text-red-400 border border-red-900/30 px-md py-1.5 rounded-md text-button font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay Records List */}
      <div className="space-y-sm">
        <h3 className="text-body font-semibold text-ink border-b border-hairline pb-xs">Pay History</h3>

        {payRecords.length === 0 ? (
          <div className="text-center py-xl border border-dashed border-hairline rounded-lg bg-surface-1">
            <p className="text-ink-subtle text-body-sm">No pay records found. Contact your admin.</p>
          </div>
        ) : (
          payRecords.map((record) => {
            const isExpanded = expandedRecordId === record.id
            const myRequests = changeRequests.filter((r) => r.pay_record_id === record.id)

            return (
              <div key={record.id} className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
                {/* Record Header */}
                <button
                  onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                  className="w-full flex items-center justify-between p-lg text-left hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-md">
                    <div>
                      <p className="text-body font-semibold text-ink">{record.period_label}</p>
                      <p className="text-body-sm text-ink-muted">
                        {formatDate(record.period_start)} – {formatDate(record.period_end)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-pill text-caption font-medium border ${
                        record.status === 'confirmed'
                          ? 'bg-semantic-success/10 text-semantic-success border-semantic-success/20'
                          : 'bg-amber-950/20 text-amber-400 border-amber-900/50'
                      }`}
                    >
                      {record.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-md shrink-0">
                    <span className="text-body-lg font-semibold text-ink">{formatCurrency(record.amount)}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-ink-subtle" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-ink-subtle" />
                    )}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-hairline p-lg space-y-md">
                    {/* Breakdown */}
                    <div className="grid grid-cols-2 gap-sm">
                      <div className="bg-surface-2 border border-hairline rounded-md p-sm">
                        <p className="text-caption text-ink-subtle uppercase tracking-wider font-semibold">Monthly Rate</p>
                        <p className="text-body font-semibold text-ink mt-xxs">{formatCurrency(payRate)}</p>
                      </div>
                      <div className="bg-surface-2 border border-hairline rounded-md p-sm">
                        <p className="text-caption text-ink-subtle uppercase tracking-wider font-semibold">Period Amount</p>
                        <p className="text-body font-semibold text-ink mt-xxs">{formatCurrency(record.amount)}</p>
                      </div>
                    </div>

                    {/* Change Requests for this period */}
                    {myRequests.length > 0 && (
                      <div className="space-y-xs">
                        <p className="text-caption text-ink-subtle uppercase tracking-wider font-semibold">Your Requests</p>
                        {myRequests.map((req) => (
                          <div key={req.id} className="flex items-center justify-between p-sm bg-surface-2 border border-hairline rounded-md text-body-sm">
                            <div>
                              <span className="font-medium text-ink">{formatCurrency(req.requested_amount)}</span>
                              <span className="text-ink-subtle ml-xs">— {req.reason.slice(0, 60)}{req.reason.length > 60 ? '…' : ''}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-pill text-caption font-medium border capitalize ${
                                req.status === 'approved'
                                  ? 'bg-semantic-success/10 text-semantic-success border-semantic-success/20'
                                  : req.status === 'denied'
                                  ? 'bg-red-950/20 text-red-400 border-red-900/30'
                                  : 'bg-amber-950/20 text-amber-400 border-amber-900/50'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Request Change Button — only for non-admin and pending/confirmed records */}
                    {!isAdmin && (
                      <button
                        onClick={() => openRequestModal(record)}
                        className="inline-flex items-center gap-xs bg-surface-2 hover:bg-surface-3 text-ink border border-hairline px-md py-1.5 rounded-md text-button font-medium transition-colors cursor-pointer"
                      >
                        <Clock className="h-4 w-4" />
                        Request Change
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Request Change Modal */}
      {showRequestModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-semantic-overlay flex items-center justify-center p-md">
          <div className="bg-surface-1 border border-hairline rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-lg py-md border-b border-hairline">
              <h3 className="text-subhead font-medium text-ink">Request Pay Change</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-ink-subtle hover:text-ink p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-lg space-y-md">
              <p className="text-body-sm text-ink-muted">
                Period: <span className="font-medium text-ink">{selectedRecord.period_label}</span>
              </p>

              {formError && (
                <div className="p-sm text-body-sm text-red-400 bg-red-950/20 border border-red-900/50 rounded-md">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-sm text-body-sm text-semantic-success bg-semantic-success/10 border border-semantic-success/20 rounded-md flex items-center gap-xs">
                  <Check className="h-4 w-4" /> Request submitted!
                </div>
              )}

              <div className="space-y-xxs">
                <label className="text-eyebrow font-medium tracking-eyebrow text-ink-subtle uppercase block">
                  Requested Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  className="w-full bg-surface-2 text-ink text-body px-sm py-2 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle"
                />
              </div>

              <div className="space-y-xxs">
                <label className="text-eyebrow font-medium tracking-eyebrow text-ink-subtle uppercase block">
                  Reason / Justification
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain why you are requesting a pay change (extra coverage, overtime, bonus, etc.)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-surface-2 text-ink text-body px-sm py-2 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle resize-none"
                />
                <p className="text-caption text-ink-tertiary">{reason.length}/10 characters minimum</p>
              </div>

              <div className="flex items-center justify-end gap-sm pt-md border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  disabled={isPending}
                  className="bg-surface-2 hover:bg-surface-3 text-ink px-lg py-2 rounded-md font-medium border border-hairline text-button transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-xs bg-primary hover:bg-primary-hover text-primary-foreground px-lg py-2 rounded-md font-medium text-button transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
