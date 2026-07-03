'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, Users as UsersIcon, Check, Loader2, FolderOpen, Search } from 'lucide-react'
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  assignModerator,
  unassignModerator,
} from '@/lib/actions/campaigns'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Campaign {
  id: string
  name: string
  description: string | null
  status: string
  created_at: string
}

interface Assignment {
  id: string
  campaign_id: string
  moderator_id: string
}

interface Moderator {
  id: string
  legal_full_name: string
  email: string
}

interface AdminCampaignsClientProps {
  initialCampaigns: Campaign[]
  initialAssignments: Assignment[]
  moderators: Moderator[]
}

export default function AdminCampaignsClient({
  initialCampaigns,
  initialAssignments,
  moderators,
}: AdminCampaignsClientProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
  const [isPending, startTransition] = useTransition()

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    setCampaigns(initialCampaigns)
    setAssignments(initialAssignments)
  }, [initialCampaigns, initialAssignments])

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('create')
      router.replace(`/admin/campaigns?${params.toString()}`, { scroll: false })
    }
  }, [searchParams, router])

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Search filter for moderators
  const [searchModQuery, setSearchModQuery] = useState('')

  // Form Fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'completed' | 'paused'>('active')

  // Sync state helpers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const res = await createCampaign({ name, description, status })
        if (res?.error) {
          setError(res.error)
        } else {
          setShowCreateModal(false)
          setName('')
          setDescription('')
          setStatus('active')
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during creation.')
      }
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCampaign) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await updateCampaign(selectedCampaign.id, { name, description, status })
        if (res?.error) {
          setError(res.error)
        } else {
          setShowEditModal(false)
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during update.')
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!campaignToDelete) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await deleteCampaign(campaignToDelete.id)
        if (res?.error) {
          setError(res.error)
        } else {
          setShowDeleteModal(false)
          setCampaignToDelete(null)
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during deletion.')
      }
    })
  }

  const handleToggleAssignment = async (campaignId: string, moderatorId: string, isCurrentlyAssigned: boolean) => {
    startTransition(async () => {
      try {
        if (isCurrentlyAssigned) {
          const res = await unassignModerator(campaignId, moderatorId)
          if (res?.error) {
            alert(res.error)
          } else {
            setAssignments((prev) =>
              prev.filter((a) => !(a.campaign_id === campaignId && a.moderator_id === moderatorId))
            )
          }
        } else {
          const res = await assignModerator(campaignId, moderatorId)
          if (res?.error) {
            alert(res.error)
          } else {
            // Add temporary mock assignment record to update state instantly
            setAssignments((prev) => [
              ...prev,
              { id: Math.random().toString(), campaign_id: campaignId, moderator_id: moderatorId },
            ])
          }
        }
      } catch (err: any) {
        alert(err.message || 'An unexpected error occurred while toggling assignment.')
      }
    })
  }

  const openCreate = () => {
    setName('')
    setDescription('')
    setStatus('active')
    setError(null)
    setShowCreateModal(true)
  }

  const openEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setName(campaign.name)
    setDescription(campaign.description || '')
    setStatus(campaign.status as 'active' | 'completed' | 'paused')
    setError(null)
    setShowEditModal(true)
  }

  const openDelete = (campaign: Campaign) => {
    setCampaignToDelete(campaign)
    setError(null)
    setShowDeleteModal(true)
  }

  const openAssign = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setSearchModQuery('')
    setShowAssignModal(true)
  }

  const getAssignedModerators = (campaignId: string) => {
    const assignedIds = assignments
      .filter((a) => a.campaign_id === campaignId)
      .map((a) => a.moderator_id)
    return moderators.filter((m) => assignedIds.includes(m.id))
  }

  return (
    <div className="space-y-lg">
      {/* Page Header */}
      <div className="flex md:flex-row flex-col md:justify-between md:items-center gap-md">
        <div>
          <h1 className="font-medium text-eyebrow text-ink-subtle tracking-eyebrow">
            Admin Portal
          </h1>
          <h2 className="mt-xxs font-semibold text-headline text-ink">Campaign Management</h2>
          <p className="mt-xxs text-body-sm text-ink-muted">
            Create marketing campaigns and assign them to moderators.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-xxs bg-primary hover:bg-primary-hover px-sm py-2 rounded-md font-medium text-button text-primary-foreground transition-colors cursor-pointer w-full md:w-auto shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-surface-1 border border-hairline rounded-lg p-lg text-center space-y-sm min-h-[240px]">
          <FolderOpen className="w-10 h-10 text-ink-tertiary" />
          <div>
            <h4 className="font-semibold text-body text-ink">No campaigns created yet</h4>
            <p className="mt-xxs text-body-sm text-ink-muted max-w-sm mx-auto">
              Get started by creating your first campaign using the button above.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {campaigns.map((campaign) => {
            const assignedMods = getAssignedModerators(campaign.id)
            return (
              <div
                key={campaign.id}
                className="bg-surface-1 border border-hairline rounded-xl p-md flex flex-col justify-between transition-all duration-150 shadow-sm"
              >
                <div className="space-y-sm">
                  <div className="flex justify-between items-start gap-xs">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-body text-ink truncate" title={campaign.name}>
                        {campaign.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-semibold shrink-0 ${
                          campaign.status === 'active'
                            ? 'bg-semantic-success/15 text-semantic-success border-semantic-success/20'
                            : campaign.status === 'completed'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-amber-950/20 text-amber-400 border-amber-900/30'
                        }`}
                      >
                        {campaign.status}
                      </Badge>
                      <button
                        onClick={() => openEdit(campaign)}
                        className="p-1 hover:bg-surface-2 text-ink-subtle hover:text-ink rounded transition-colors cursor-pointer"
                        title="Edit Campaign"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openDelete(campaign)}
                        className="p-1 hover:bg-red-950/20 text-red-400 rounded transition-colors cursor-pointer"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-body-sm text-ink-muted line-clamp-3 min-h-15">
                    {campaign.description || 'No description provided.'}
                  </p>

                  {/* Assigned Moderators List */}
                  <div className="space-y-xs pt-xs">
                    <p className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wider">
                      Assigned Mods ({assignedMods.length})
                    </p>
                    {assignedMods.length === 0 ? (
                      <p className="text-[11px] text-ink-tertiary italic">None assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-xs">
                        {assignedMods.map((mod) => (
                          <span
                            key={mod.id}
                            className="bg-surface-2 text-ink-muted border border-hairline px-xs py-0.5 rounded text-[10px] font-medium"
                          >
                            {mod.legal_full_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-md pt-sm border-t border-hairline">
                  <button
                    onClick={() => openAssign(campaign)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all border border-hairline bg-surface-1 hover:bg-surface-2 text-ink shadow-xs cursor-pointer"
                  >
                    <UsersIcon className="w-4 h-4" />
                    Assign Moderators
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-md bg-surface-1 border border-hairline text-ink">
            <DialogHeader>
              <DialogTitle className="text-headline font-semibold">Create Campaign</DialogTitle>
            </DialogHeader>

            {error && (
              <div className="bg-red-950/20 p-sm border border-red-900/50 rounded-md text-body-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-sm">
              <div>
                <label className="block font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Campaign Name
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q3 Outreach Campaign"
                  className="block bg-surface-2 mt-1 border-hairline w-full text-ink"
                />
              </div>

              <div>
                <label className="block font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about the campaign goals, instructions, or targets..."
                  className="block bg-surface-2 mt-1 border border-hairline w-full text-ink text-sm rounded-md px-sm py-2 min-h-[100px] outline-none focus:outline-2 focus:outline-primary-focus"
                />
              </div>

              <div>
                <label className="block font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Status
                </label>
                <Select value={status} onValueChange={(val) => setStatus(val as 'active' | 'completed' | 'paused')}>
                  <SelectTrigger className="bg-surface-2 mt-1 border-hairline w-full text-ink">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-2 border border-hairline text-ink">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-sm pt-md border-hairline border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-surface-2 hover:bg-surface-3 px-lg py-2 border border-hairline rounded-md text-button text-ink transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-50 px-lg py-2 rounded-md font-medium text-button text-primary-foreground transition-colors cursor-pointer flex items-center gap-xs"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedCampaign && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md bg-surface-1 border border-hairline text-ink">
            <DialogHeader>
              <DialogTitle className="text-headline font-semibold">Edit Campaign</DialogTitle>
            </DialogHeader>

            {error && (
              <div className="bg-red-950/20 p-sm border border-red-900/50 rounded-md text-body-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-sm">
              <div>
                <label className="block font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Campaign Name
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block bg-surface-2 mt-1 border-hairline w-full text-ink"
                />
              </div>

              <div>
                <label className="block font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block bg-surface-2 mt-1 border border-hairline w-full text-ink text-sm rounded-md px-sm py-2 min-h-[100px] outline-none focus:outline-2 focus:outline-primary-focus"
                />
              </div>

              <div>
                <label className="block font-medium text-caption text-ink-subtle uppercase tracking-eyebrow">
                  Status
                </label>
                <Select value={status} onValueChange={(val) => setStatus(val as 'active' | 'completed' | 'paused')}>
                  <SelectTrigger className="bg-surface-2 mt-1 border-hairline w-full text-ink">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-2 border border-hairline text-ink">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-sm pt-md border-hairline border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-surface-2 hover:bg-surface-3 px-lg py-2 border border-hairline rounded-md text-button text-ink transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-50 px-lg py-2 rounded-md font-medium text-button text-primary-foreground transition-colors cursor-pointer flex items-center gap-xs"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ASSIGN MODAL */}
      {showAssignModal && selectedCampaign && (
        <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
          <DialogContent className="sm:max-w-md bg-surface-1 border border-hairline text-ink">
            <DialogHeader>
              <DialogTitle className="text-headline font-semibold">Manage Assignments</DialogTitle>
              <p className="text-body-sm text-ink-muted">
                Assign moderators to the campaign &ldquo;{selectedCampaign.name}&rdquo;
              </p>
            </DialogHeader>

            {/* Search Input */}
            <div className="relative mt-2">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                type="text"
                placeholder="Search moderators by name or email..."
                value={searchModQuery}
                onChange={(e) => setSearchModQuery(e.target.value)}
                className="w-full h-10 bg-surface-2 text-ink text-body-sm pl-10 pr-sm py-2 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle transition-colors"
              />
            </div>

            <div className="space-y-sm py-md max-h-[300px] overflow-y-auto">
              {moderators.length === 0 ? (
                <p className="text-body-sm text-ink-tertiary text-center italic py-md">
                  No active moderators found.
                </p>
              ) : (() => {
                const filteredModerators = moderators.filter(
                  (m) =>
                    m.legal_full_name.toLowerCase().includes(searchModQuery.toLowerCase()) ||
                    m.email.toLowerCase().includes(searchModQuery.toLowerCase())
                )

                if (filteredModerators.length === 0) {
                  return (
                    <p className="text-body-sm text-ink-tertiary text-center italic py-md">
                      No moderators match your search.
                    </p>
                  )
                }

                return filteredModerators.map((moderator) => {
                  const isAssigned = assignments.some(
                    (a) => a.campaign_id === selectedCampaign.id && a.moderator_id === moderator.id
                  )
                  return (
                    <div
                      key={moderator.id}
                      onClick={() => {
                        if (!isPending) {
                          handleToggleAssignment(selectedCampaign.id, moderator.id, isAssigned)
                        }
                      }}
                      className={`flex items-center justify-between p-sm hover:bg-surface-2 rounded-lg border border-hairline cursor-pointer select-none transition-colors ${
                        isPending ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      <div>
                        <p className="text-body-sm font-semibold text-ink">{moderator.legal_full_name}</p>
                        <p className="text-[11px] text-ink-muted">{moderator.email}</p>
                      </div>

                      <div
                        className={`h-5 w-5 rounded flex items-center justify-center border transition-all duration-150 ${
                          isAssigned
                            ? 'bg-primary border-primary'
                            : 'bg-surface-3 border-hairline-strong hover:border-ink-subtle'
                        }`}
                      >
                        {isAssigned && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            <div className="flex justify-end pt-md border-hairline border-t">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="bg-primary hover:bg-primary-hover px-lg py-2 rounded-md font-medium text-button text-primary-foreground transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteModal && campaignToDelete && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md bg-surface-1 border border-hairline text-ink">
            <DialogHeader>
              <DialogTitle className="text-headline font-semibold text-red-500">Delete Campaign</DialogTitle>
              <DialogDescription className="text-ink-muted mt-2">
                Are you sure you want to delete the campaign &ldquo;{campaignToDelete.name}&rdquo;?
                This action cannot be undone. All moderator assignments will be removed.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="bg-red-950/20 p-sm border border-red-900/50 rounded-md text-body-sm text-red-400">
                {error}
              </div>
            )}

            <DialogFooter className="flex justify-end gap-sm pt-md border-hairline border-t">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setCampaignToDelete(null)
                }}
                className="bg-surface-2 hover:bg-surface-3 px-lg py-2 border border-hairline rounded-md text-button text-ink transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-lg py-2 rounded-md font-medium text-button text-white transition-colors cursor-pointer flex items-center gap-xs"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
