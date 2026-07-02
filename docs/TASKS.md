# Implementation Task List — Clocky (Mercury Marketing)

This file tracks the implementation progress of the Clocky Moderator Portal based on the [PRD](file:///c:/Users/Angel/Desktop/CLIENT/CLOCKY/docs/PRD.md) and [Architecture Document](file:///c:/Users/Angel/Desktop/CLIENT/CLOCKY/docs/ARCHITECTURE.md).

---

## 1. Project Setup & Configuration
- [x] Initialize Next.js app in workspace root
  - [x] Configure `package.json`, `tsconfig.json`, and Next.js settings
- [x] Install dependencies
  - [x] Supabase: `@supabase/supabase-js`, `@supabase/ssr`
  - [x] Styling: `tailwindcss`, `@tailwindcss/postcss`, `postcss` (Tailwind CSS v4 setup)
  - [x] Utilities: `lucide-react`, `zod`, `date-fns`, `date-fns-tz`, `clsx`, `tailwind-merge`
- [x] Configure PostCSS (`postcss.config.mjs`) for Tailwind v4
- [x] Implement Design System in `src/app/globals.css`
  - [x] Set up `@theme` with custom color ladder (`canvas`, `surface-1` to `surface-4`)
  - [x] Set up `@theme` custom spacing and border radius values from `DESIGN.md`
  - [x] Map typography sizes (`display-xl` to `caption`) and tracking
  - [x] Write base HTML and scrollbar CSS rules

---

## 2. Database Schema & Supabase Setup
- [x] Create Supabase migrations in `supabase/migrations/`
  - [x] `00001_create_profiles.sql`: User profiles table with custom roles and default settings
  - [x] `00002_create_shifts.sql`: Shift session table with `active`, `on_break`, and `completed` status
  - [x] `00003_create_schedules.sql`: Team schedule slots for calendar visual
  - [x] `00004_create_templates.sql`: Response templates categories and details
  - [x] `00005_create_availability.sql`: Moderator availability hours
  - [x] `00006_create_pay.sql`: Pay records and pay change requests
  - [x] `00007_create_notifications.sql`: System alerts and in-app notifications
- [x] Constraints & Triggers (Database-Level)
  - [x] Define unique index `idx_one_active_shift_per_user` to prevent concurrent active shifts
  - [x] Write database function and trigger `trg_calculate_shift_durations` to compute active shift and break duration
- [x] Row Level Security (RLS) Policies
  - [x] Write select, insert, and update policies for each table ensuring admin/moderator security boundaries
- [x] Database Seeding
  - [x] Create `supabase/seed.sql` with sample admin, moderators, and initial response template categories

---

## 3. Core Libraries & Supabase Integration
- [x] Initialize Supabase clients in `src/lib/supabase/`
  - [x] `client.ts`: Anon browser client for realtime subscriptions and reads
  - [x] `server.ts`: Server-side client reading and setting session cookies
  - [x] `admin.ts`: Edge/Server service role client bypassing RLS (admin ops)
  - [x] `middleware.ts`: Next.js request middleware to check and refresh auth sessions
- [x] Add Timezone Helpers in `src/lib/utils/timezone.ts`
  - [x] Write timezone formatting and conversion utility functions (UTC ↔ User local timezone)
- [x] Define TypeScript types in `src/lib/types/`
  - [x] Auto-generate Supabase DB schemas into `database.types.ts`
  - [x] Write custom mappings in `index.ts` for clean component interfaces

---

## 4. Authentication & Route Guard
- [x] Next.js Edge Middleware (`src/middleware.ts`)
  - [x] Wire Supabase session check
  - [x] Protect `/dashboard`, `/schedule`, `/settings`, and admin routes
  - [x] Allow anonymous access only to login and auth callback
- [x] Implement Auth Actions (`src/lib/actions/auth.ts`)
  - [x] `login()` server action validating credentials against Supabase Auth
  - [x] `logout()` server action cleaning up cookies
- [x] Build Auth UI Views
  - [x] Root Layout (`src/app/layout.tsx`): Load Inter font, metadata, global styles
  - [x] Auth Layout (`src/app/(auth)/layout.tsx`): Centered frame
  - [x] Login page (`src/app/(auth)/login/page.tsx`): Clean forms, "No account? Contact your admin." notice

---

## 5. Navigation & Shared Layout
- [x] Declutter Sidebar Navigation (`src/components/layout/Sidebar.tsx`)
  - [x] Verify tabs show ONLY: *My Dashboard*, *Team Schedule*, *Response Templates*, *My Log History*, *My Availability*, *My Pay*, and *Settings*
  - [x] Remove: *Active Campaigns*, *Campaign Notes*, and *Task Log*
  - [x] Implement mobile toggle collapse and active highlight state
- [x] Global Dashboard Layout (`src/app/(dashboard)/layout.tsx`)
  - [x] Structural grid wrapping sidebar, header and page body
  - [x] Build Header component containing Page Title, User Profile chip, and NotificationBell

---

## 6. Moderator Dashboard (`src/app/(dashboard)/dashboard/page.tsx`)
- [x] Dashboard Structure
  - [x] Welcome header displaying custom greeting and instructions
  - [x] Remove hidden elements: *Needs Attention*, *Always Active*, *My Campaigns*
- [x] Clock Widget Component (`src/components/dashboard/ClockWidget.tsx`)
  - [x] State toggling for Clock-In, Clock-Out, Break, and Resume
  - [x] Implement Shift Timer running client-side (`src/lib/hooks/useTimer.ts`)
  - [x] Integrate React 19 optimistic states (`useOptimistic`) and transition indicators
  - [x] Create mandatory Shift Summary popup upon Clock-Out click (reject empty strings)
  - [x] Connect state to clock actions (`src/lib/actions/clock.ts`)
- [x] Shift Streaks Component (`src/components/dashboard/ShiftStreak.tsx`)
  - [x] Weekly calendar row showing current week's checkmarks
  - [x] Running streak counter (breaking on missed scheduled days)
- [x] Projected Monthly Pay Widget (`src/components/dashboard/PayWidget.tsx`)
  - [x] Display card displaying current month's projected compensation
  - [x] Link routing to full My Pay page

---

## 7. Team Schedule (`src/app/(dashboard)/schedule/page.tsx`)
- [x] Moderator Calendar View
  - [x] Weekly calendar view with date range controls
  - [x] Unique color-coded grid legend representing team members
  - [x] Visual highlight indicator marking the logged-in user's assignments
  - [x] Read-only view validation for moderator sessions
- [x] Admin Control Interface
  - [x] Edit controls overlay visible only to admin users
  - [x] Shift Creation Modal (day, time range picker, moderator selection dropdown)
  - [x] Shift Editing (drag-to-resize or relocate timeline blocks)
  - [x] Shift Deletion action
  - [x] Cache revalidation to push updates instantly to clients
- [x] Custom Schedule Components
  - [x] Calendar Header, WeekCalendar view, DayView toggle
  - [x] Empty state alert: "You're not assigned yet"

---

## 8. Response Templates (`src/app/(dashboard)/templates/page.tsx`)
- [x] Moderator Browsing Interface
  - [x] Category filtering tabs (*AI CONTENT*, *BOTTING*, *BRANDING*)
  - [x] Search input matching templates on title, category, or body content
  - [x] Click-to-copy utility with clipboard integration and toast feedback
- [x] Admin CRUD Panel
  - [x] Edit/create inline widgets visible to admins only
  - [x] Template CRUD Server actions (`src/lib/actions/templates.ts`)
  - [x] Add Zod validation on inputs before saving

---

## 9. Log History (`src/app/(dashboard)/logs/page.tsx`)
- [x] Moderator Log View
  - [x] Reverse chronological grid list of shift logs
  - [x] Grouping elements by date header
  - [x] Grid fields: Date, clock-in, clock-out, total hours, shift summary text
  - [x] Read-only view validation
- [x] Admin Global Log View (`src/app/(dashboard)/admin/logs/page.tsx`)
  - [x] Advanced filter bar selecting single moderator
  - [x] Data Export handler (CSV structure generation)

---

## 10. Availability (`src/app/(dashboard)/availability/page.tsx`)
- [x] Weekly Schedule Form
  - [x] 7-day row elements with availability checkboxes
  - [x] Start/end time input fields mapped to selected days
- [x] Timezone Translation Engine
  - [x] Client detection showing local timezone status
  - [x] Automatic conversion logic (entering in local timezone, translating to UTC for storage)
  - [x] Admin availability detail view mapping stored UTC back to admin timezone

---

## 11. My Pay (`src/app/(dashboard)/pay/page.tsx`)
- [x] Monthly Ledger Display
  - [x] Show current pay period details and biweekly schedule label
  - [x] Confirmed monthly total rate box
  - [x] Detail breakdown tables
- [x] Request Change Modal
  - [x] Trigger button: "Request Change"
  - [x] Forms: Requested Amount (decimal), Reason/Justification (min 10 chars)
  - [x] Zod validated payload processing (`src/lib/actions/pay.ts`)
- [x] Admin Pay Review Dashboard (Needs Review widgets)
  - [x] Approve and Deny button transitions

---

## 12. Settings & Account Profile (`src/app/(dashboard)/settings/page.tsx`)
- [x] Profile Settings form
  - [x] Read-only display fields: Admin role state, Compensation amounts
  - [x] Editable profile fields: Legal Full Name, Primary Email, Payment Method, Whop Username, Discord Username, Local Timezone
  - [x] Wire "Save Profile" server action (`src/lib/actions/settings.ts`)
- [x] Security Update Form
  - [x] New password input (minimum 6 characters), Confirm password input
  - [x] Wire "Update Password" server action

---

## 13. Admin Dashboard & Operations (`src/app/(dashboard)/admin/layout.tsx`)
- [x] Admin Route Layout Guard
  - [x] Enforce session check on JWT custom claim (`app_metadata.role === 'admin'`)
- [x] Admin Dashboard Dashboard (`src/app/(dashboard)/dashboard/page.tsx` — admin variant)
  - [x] Live stats panel: online, break, offline moderator counts
  - [x] Today's active feed listing realtime logs of clock-in/out
  - [x] "Needs Review" queue for pay change requests
- [x] User Account Provisioning Dashboard (`src/app/(dashboard)/admin/users/page.tsx`)
  - [x] List user grid with soft delete toggle status
  - [x] Create user modal (admin set credentials, roles, and monthly compensation rate)
  - [x] User activation/deactivation triggers using Supabase admin SDK client

---

## 14. Realtime & Notification Engine
- [x] In-App Notification Bell (`src/components/layout/NotificationBell.tsx`)
  - [x] Interactive indicator listing current unread badge counts
  - [x] Panel listing custom notifications with timestamps
- [x] Realtime Channel Connections
  - [x] Event listeners listening to Postgres changes on `shifts` and `notifications`
  - [x] `useNotifications.ts` & `useRealtimeShifts.ts` hooks integrating WebSocket connection
- [x] Notification Actions
  - [x] `markAsRead()` and `markAllRead()` functions on database
- [x] System Triggers
  - [x] Automatically write notification entries on schedule update, pay action, or admin announcement
