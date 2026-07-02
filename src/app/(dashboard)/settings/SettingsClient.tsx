'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2, Lock, User, Eye, EyeOff } from 'lucide-react'
import { saveProfile, updatePassword } from '@/lib/actions/settings'
import { Profile } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const TIMEZONES = [
  'Asia/Manila',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const PAYMENT_METHODS = [
  { value: 'Mercury Bank Transfer', label: 'Mercury Bank Transfer' },
  { value: 'PayPal', label: 'PayPal' },
  { value: 'Wise', label: 'Wise' },
  { value: 'GCash', label: 'GCash' },
  { value: 'Other', label: 'Other' },
]

interface SettingsClientProps {
  profile: Profile | null
  isAdmin: boolean
}

export default function SettingsClient({ profile, isAdmin }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [pwPending, startPwTransition] = useTransition()
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(profile?.legal_full_name || '')
  const [email, setEmail] = useState(profile?.email || '')
  const [paymentMethod, setPaymentMethod] = useState(profile?.payment_method || '')
  const [whopUsername, setWhopUsername] = useState(profile?.whop_username || '')
  const [discordUsername, setDiscordUsername] = useState(profile?.discord_username || '')
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Manila')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    startTransition(async () => {
      const res = await saveProfile({
        legal_full_name: fullName,
        email,
        payment_method: paymentMethod || null,
        whop_username: whopUsername || null,
        discord_username: discordUsername || null,
        timezone,
      })
      if (res?.error) setProfileError(res.error)
      else { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000) }
    })
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { setPwError("Passwords don't match."); return }
    startPwTransition(async () => {
      const res = await updatePassword({ newPassword, confirmPassword })
      if (res?.error) setPwError(res.error)
      else {
        setPwSaved(true)
        setNewPassword('')
        setConfirmPassword('')
        setShowNewPassword(false)
        setShowConfirmPassword(false)
        setTimeout(() => setPwSaved(false), 3000)
      }
    })
  }

  const inputCls = 'w-full bg-surface-2 text-ink text-body px-sm py-2 rounded-md border border-hairline focus:outline-2 focus:outline-primary-focus placeholder:text-ink-subtle transition-colors duration-150'
  const readOnlyCls = 'w-full bg-surface-2/50 text-ink-subtle text-body px-sm py-2 rounded-md border border-hairline cursor-not-allowed'
  const labelCls = 'text-caption font-medium tracking-wider text-ink-subtle uppercase block mb-1'

  return (
    <div className="space-y-xl">

      {/* ── Profile Section ── */}
      <section className="bg-surface-1 border border-hairline rounded-xl p-xl shadow-sm space-y-lg">
        <div className="flex items-center gap-xs pb-xs border-b border-hairline">
          <User className="h-5 w-5 text-ink-subtle" />
          <h2 className="text-subhead font-medium text-ink">Profile Settings</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-lg">
          {profileError && (
            <div className="p-sm text-body-sm text-red-400 bg-red-950/20 border border-red-900/50 rounded-md">{profileError}</div>
          )}

          {/* Row 1: Read-only Role + Compensation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className={labelCls}>Your Role</label>
              <input type="text" readOnly value={isAdmin ? 'Admin' : 'Moderator'} className={readOnlyCls} />
              <p className="text-caption text-ink-tertiary mt-1">Contact admin to change your role.</p>
            </div>
            <div>
              <label className={labelCls}>Monthly Compensation</label>
              <input type="text" readOnly
                value={profile?.pay_rate ? `$${Number(profile.pay_rate).toFixed(2)}` : 'N/A'}
                className={readOnlyCls} />
              <p className="text-caption text-ink-tertiary mt-1">Managed by admin.</p>
            </div>
          </div>

          {/* Row 2: Full Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className={labelCls} htmlFor="fullName">Legal Full Name</label>
              <input id="fullName" type="text" required value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your legal full name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="email">Primary Email</label>
              <input id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" className={inputCls} />
            </div>
          </div>

          {/* Row 3: Payment Method + Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className={labelCls}>Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full bg-surface-2 border-hairline text-ink focus:outline-primary-focus">
                  <SelectValue placeholder="Select payment method..." />
                </SelectTrigger>
                <SelectContent className="bg-surface-2 border border-hairline text-ink">
                  <SelectGroup>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelCls}>Local Timezone</label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="w-full bg-surface-2 border-hairline text-ink focus:outline-primary-focus">
                  <SelectValue placeholder="Select timezone..." />
                </SelectTrigger>
                <SelectContent className="bg-surface-2 border border-hairline text-ink">
                  <SelectGroup>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Whop + Discord */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className={labelCls} htmlFor="whopUsername">Whop Username</label>
              <input id="whopUsername" type="text" value={whopUsername}
                onChange={(e) => setWhopUsername(e.target.value)}
                placeholder="@username" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="discordUsername">Discord Username</label>
              <input id="discordUsername" type="text" value={discordUsername}
                onChange={(e) => setDiscordUsername(e.target.value)}
                placeholder="username#0000" className={inputCls} />
            </div>
          </div>

          <div className="flex items-center gap-sm pt-sm border-t border-hairline">
            <button type="submit" disabled={isPending}
              className="inline-flex items-center gap-xs bg-primary hover:bg-primary-hover active:bg-primary-focus text-primary-foreground px-lg py-2 rounded-md font-medium text-button transition-colors cursor-pointer disabled:opacity-50 shadow-md">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Profile
            </button>
            {profileSaved && (
              <span className="flex items-center gap-xxs text-body-sm text-semantic-success font-medium">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </form>
      </section>

      {/* ── Security Section ── */}
      <section className="bg-surface-1 border border-hairline rounded-xl p-xl shadow-sm space-y-lg">
        <div className="flex items-center gap-xs pb-xs border-b border-hairline">
          <Lock className="h-5 w-5 text-ink-subtle" />
          <h2 className="text-subhead font-medium text-ink">Change Password</h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-md">
          {pwError && (
            <div className="p-sm text-body-sm text-red-400 bg-red-950/20 border border-red-900/50 rounded-md">{pwError}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className={labelCls} htmlFor="newPassword">New Password</label>
              <div className="relative">
                <input id="newPassword" type={showNewPassword ? "text" : "password"} minLength={6} required value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters" className={`${inputCls} pr-10`} />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink cursor-pointer focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password" className={`${inputCls} pr-10`} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink cursor-pointer focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-sm pt-sm border-t border-hairline">
            <button type="submit" disabled={pwPending}
              className="inline-flex items-center gap-xs bg-primary hover:bg-primary-hover active:bg-primary-focus text-primary-foreground px-lg py-2 rounded-md font-medium text-button transition-colors cursor-pointer disabled:opacity-50 shadow-md">
              {pwPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
            </button>
            {pwSaved && (
              <span className="flex items-center gap-xxs text-body-sm text-semantic-success font-medium">
                <Check className="h-4 w-4" /> Password updated
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
