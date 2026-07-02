# Product Requirements Document: Mercury Marketing

---

**Product/Feature Name:** Mercury Marketing — Moderator Tracking Portal
**Status:** Draft
**Author:** Angel (Developer)
**Stakeholders:** Client (Mercury Marketing), Development Team
**Date Created:** 2026-07-02
**Last Updated:** 2026-07-02
**Version:** 1.0

---

## Executive Summary

**One-liner:** Mercury Marketing is an internal operations portal that enables content moderators to clock in/out, log shift summaries, view schedules, access response templates, manage availability, and track pay — while giving admins full oversight and control.

**Overview:**
Mercury Marketing replaces the existing ClipFarm OPS Portal (clip-mod.vercel.app) with a streamlined, purpose-built moderator management system. The current portal includes campaign management, CRM features, and marketing tools that are irrelevant to moderator workflows and create unnecessary clutter and confusion. Mercury Marketing strips these away entirely, delivering a focused experience for two distinct user types: moderators (who clock in, do their work, and log out) and admins (who oversee everything).

The portal solves a core operational pain point: tracking remote moderator activity, ensuring accountability through mandatory shift summaries, and providing transparent pay and schedule visibility. By removing unused features and gamifying shift tracking with streaks and earnings visibility, Mercury Marketing aims to improve moderator compliance, reduce admin overhead, and create a clear audit trail for all shift-related activity.

**Quick Facts:**
- **Target Users:** Content moderators (remote workers) and Admin/Managers
- **Problem Solved:** Cluttered ops portal with irrelevant features; no accountability for shift work; manual tracking of moderator hours and pay
- **Key Metric:** Moderator clock-in/out compliance rate (100% shift summary completion)
- **Target Launch:** TBD (pending client timeline)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Goals & Objectives](#goals--objectives)
3. [User Personas](#user-personas)
4. [User Stories & Requirements](#user-stories--requirements)
5. [Success Metrics](#success-metrics)
6. [Scope](#scope)
7. [Technical Considerations](#technical-considerations)
8. [Design & UX Requirements](#design--ux-requirements)
9. [Timeline & Milestones](#timeline--milestones)
10. [Risks & Mitigation](#risks--mitigation)
11. [Dependencies & Assumptions](#dependencies--assumptions)
12. [Open Questions](#open-questions)
13. [Stakeholder Sign-Off](#stakeholder-sign-off)

---

## Problem Statement

### The Problem

The existing ClipFarm OPS Portal is a general-purpose operations tool built for multiple roles including marketers, campaign managers, and moderators. Moderators are forced to navigate a cluttered interface filled with campaign management, CRM features, and marketing tools they never use. There is no streamlined way to track shift hours, enforce end-of-shift accountability, or give moderators transparent visibility into their pay and schedule.

### Current State

Moderators currently use the ClipFarm OPS Portal at `clip-mod.vercel.app` which includes:
- Campaign management features they don't need (Active Campaigns, Campaign Notes, Task Log)
- Dashboard sections irrelevant to their workflow (Needs Attention, Always Active, My Campaigns)
- A time-clock system that doesn't enforce shift summaries
- Manual or ad-hoc shift tracking that lacks accountability

Admins must manually track moderator activity across multiple channels (Whop Chat, Discord tickets, support chats) without a unified audit trail.

### Impact

**User Impact:**
- Moderators waste time navigating irrelevant features
- No enforced accountability at end of shift leads to incomplete work logs
- Moderators lack clear visibility into their pay schedule and earnings
- Schedule confusion across timezones (team operates in EST but moderators are in various timezones like Asia/Manila)

**Business Impact:**
- Admin overhead in manually tracking moderator hours and activity
- Difficulty auditing moderator performance without structured shift summaries
- Pay disputes or confusion due to unclear pay period definitions
- No reliable way to verify moderator work quality or quantity

### Why Now?

The current platform has accumulated features (campaigns, CRM, marketing tools) that actively hinder moderator productivity. The team is growing (visible moderators: mngz636, Zain, Hassan, Bianca, Zyson, Seji) and manual tracking is becoming unsustainable. A purpose-built tool will reduce friction, improve accountability, and scale with the team.

---

## Goals & Objectives

### Business Goals

1. **Operational Efficiency:** Eliminate moderator confusion by removing all non-essential features, reducing onboarding time and support requests.
2. **Accountability & Compliance:** Enforce mandatory end-of-shift summaries so every logged hour has a documented work description.
3. **Transparent Payroll:** Provide clear, self-service pay visibility to moderators, reducing pay-related inquiries to admins.

### User Goals

1. **Moderators:** Quick clock-in/out with minimal friction; clear view of schedule, pay, and shift history.
2. **Moderators:** Access to response templates for fast, consistent communication during shifts.
3. **Admins:** Full visibility into who is working, when they worked, what they did, and how much they're owed.

### Non-Goals

- Building a campaign management or CRM system
- Social media analytics or content performance tracking
- Client-facing features or public-facing pages
- Mobile native app (web-responsive is sufficient)
- Real-time chat or messaging between moderators and admins (handled externally via Discord/Whop)

---

## User Personas

### Primary Persona: The Moderator

**Demographics:**
- Age range: 18–30
- Role/Title: Content Moderator (Remote)
- Tech savviness: Medium
- Location: Various (Philippines — Asia/Manila timezone observed), working in EST shifts. System displays times in user's local timezone.

**Behaviors:**
- Works scheduled shifts (typically 01:00–07:00 EST, Mon–Fri)
- Handles Whop Chat support, Discord tickets, clip approvals, and analytics review
- Approves 30–70 clips per shift; bans users for analytics manipulation
- Needs to clock in/out and summarize work at end of shift

**Needs & Motivations:**
- Clear schedule visibility (system auto-converts to their local timezone)
- Quick access to canned response templates for common moderation actions (AI content warnings, botting warnings, branding corrections)
- Transparent view of biweekly pay and pay period details
- Simple, distraction-free interface

**Pain Points:**
- Current portal is cluttered with campaigns and marketing features
- Timezone confusion (previously had to manually convert local time to EST)
- No enforced structure for shift summaries

**Quote:** _"I just want to clock in, do my work, log what I did, and see when I get paid."_

### Secondary Persona: The Admin/Manager

**Demographics:**
- Age range: 25–40
- Role/Title: Operations Manager / Team Lead
- Tech savviness: High
- Location: US-based (EST timezone)

**Behaviors:**
- Creates and manages moderator accounts
- Sets work schedules and assigns shift times
- Reviews shift summaries and log history for quality assurance
- Manages pay rates and processes payout requests

**Needs & Motivations:**
- Full oversight of all moderator activity
- Ability to create/edit team schedules
- Access to shift logs and summaries for auditing
- Control over pay rates and ability to approve pay change requests

**Pain Points:**
- Manual tracking of who worked when and what they did
- No way to enforce shift summary completion
- Pay disputes due to unclear pay structure

**Quote:** _"I need to know who's online, what they did, and that they actually worked their shift — without chasing them for details."_

---

## User Stories & Requirements

### Epic 1: Authentication & Onboarding

#### Must-Have Stories (P0)

##### Story 1: Email/Password Sign-In

**User Story:**
```
As a moderator,
I want to sign in with my email and password,
So that I can access my dashboard securely.
```

**Acceptance Criteria:**
- [ ] Given I am on the login page, when I enter my email and password, then I am authenticated and redirected to My Dashboard
- [ ] Given I enter invalid credentials, when I submit, then I see an error message
- [ ] Given I don't have an account, when I view the login page, then I see "No account? Contact your admin."
- [ ] Passwords must be at least 6 characters
- [ ] Admin can create user accounts and provision temporary passwords

**Priority:** Must Have (P0)
**Effort:** M

> [!NOTE]
> **Resolved:** Client confirmed Email/Password authentication. No Google OAuth required.

---

### Epic 2: Moderator Dashboard

#### Must-Have Stories (P0)

##### Story 2: Dashboard Overview

**User Story:**
```
As a moderator,
I want to see a simplified dashboard when I log in,
So that I can quickly understand my status and start working.
```

**Acceptance Criteria:**
- [ ] Dashboard displays a personalized greeting (e.g., "Good morning, [Name]")
- [ ] Dashboard shows instruction text: "Clock in, work your assignments, then save one clear recap when you clock out."
- [ ] Dashboard displays core stats: Today Shifts count, Logged Days (X/7)
- [ ] The following sections are NOT displayed: Needs Attention, Always Active, My Campaigns, Campaigns count
- [ ] Dashboard is the default landing page after login

**Priority:** Must Have (P0)
**Effort:** M

---

##### Story 3: Clock-In

**User Story:**
```
As a moderator,
I want to clock in to start my shift,
So that my working hours are tracked automatically.
```

**Acceptance Criteria:**
- [ ] Given I am on the dashboard, when I click "Clock In", then the shift timer starts
- [ ] The dashboard shows a visible running timer indicating active shift duration
- [ ] The clock-in timestamp is recorded in the system
- [ ] Only one active shift session is allowed at a time

**Priority:** Must Have (P0)
**Effort:** M

---

##### Story 4: Clock-Out with Mandatory Summary

**User Story:**
```
As a moderator,
I want to be required to write a shift summary when I clock out,
So that my work is documented for accountability.
```

**Acceptance Criteria:**
- [ ] Given I am clocked in, when I click "Clock Out", then a text popup appears immediately
- [ ] The popup requires me to write a paragraph summarizing my shift's tasks
- [ ] Given I submit an empty summary, when I try to confirm, then the system rejects it
- [ ] Given I write a summary and submit, when I confirm, then the shift is logged with timestamps and summary text
- [ ] The summary is saved to My Log History

**Priority:** Must Have (P0)
**Effort:** M

---

##### Story 5: Break Timer

**User Story:**
```
As a moderator,
I want to pause my shift timer for a break,
So that break time is tracked separately from active work time.
```

**Acceptance Criteria:**
- [ ] Given I am clocked in, when I click "Break", then the active timer pauses
- [ ] Given I am on break, when I click "Resume", then the timer continues
- [ ] Break duration is recorded separately in the shift log
- [ ] Multiple breaks within a single shift are supported

**Priority:** Must Have (P0)
**Effort:** S

---

##### Story 6: Gamification — Shift Streaks

**User Story:**
```
As a moderator,
I want to see my shift streak counter,
So that I am motivated to maintain consistent attendance.
```

**Acceptance Criteria:**
- [ ] Dashboard displays a "This Week" section with day-by-day checkmarks
- [ ] Each day I complete a scheduled shift, the day receives a checkmark
- [ ] A streak counter (e.g., "3 day streak") is displayed
- [ ] Missed days break the streak

**Priority:** Must Have (P0)
**Effort:** S

---

##### Story 7: Monthly Pay Widget

**User Story:**
```
As a moderator,
I want to see my projected monthly pay on the dashboard,
So that I know my current earnings at a glance.
```

**Acceptance Criteria:**
- [ ] Dashboard shows "My Pay" widget with current month's projected earnings (e.g., "$100.00")
- [ ] Shows the projection month (e.g., "Projected for July 2026")
- [ ] Tapping/clicking navigates to the full My Pay page

**Priority:** Must Have (P0)
**Effort:** S

---

### Epic 3: Navigation & Sidebar

#### Must-Have Stories (P0)

##### Story 8: Simplified Sidebar Navigation

**User Story:**
```
As a moderator,
I want a clean sidebar with only the tools I need,
So that I can navigate without confusion.
```

**Acceptance Criteria:**
- [ ] Sidebar displays ONLY the following items:
  - My Dashboard
  - Team Schedule
  - Response Templates
  - My Log History
  - My Availability
  - My Pay
  - Settings
- [ ] The following tabs are NOT present: Active Campaigns, Campaign Notes, Task Log
- [ ] Active page is visually highlighted in the sidebar
- [ ] Sidebar is collapsible on mobile

**Priority:** Must Have (P0)
**Effort:** S

---

### Epic 4: Team Schedule

#### Must-Have Stories (P0)

##### Story 9: View Team Schedule

**User Story:**
```
As a moderator,
I want to view the team schedule,
So that I can see when I and my teammates are working.
```

**Acceptance Criteria:**
- [ ] Schedule displays a weekly calendar view with date range (e.g., "Jun 29 – Jul 5")
- [ ] Each team member is represented by a unique color in the legend
- [ ] My own shifts are visually highlighted
- [ ] Schedule shows time slots with moderator names and shift times (e.g., "mngz636 4:00 AM–10:00...")
- [ ] Toggle between "Week" and "Day" views
- [ ] Navigate forward/backward between weeks
- [ ] Schedule is read-only for moderators
- [ ] Section header: "CHAT COVERAGE"
- [ ] Shows alert if moderator is not yet assigned ("You're not assigned yet")

**Priority:** Must Have (P0)
**Effort:** L

---

##### Story 10: Admin — Create/Edit Schedule

**User Story:**
```
As an admin,
I want to create and edit the team schedule,
So that I can assign moderators to shifts.
```

**Acceptance Criteria:**
- [ ] Given I have admin permissions, when I view the schedule, then I see edit controls
- [ ] I can create new shift blocks by selecting a day, time range, and moderator
- [ ] I can drag to resize or move shift blocks
- [ ] I can delete existing shift assignments
- [ ] Changes are saved and immediately visible to moderators

**Priority:** Must Have (P0)
**Effort:** L

---

### Epic 5: Response Templates

#### Must-Have Stories (P0)

##### Story 11: Browse & Copy Response Templates

**User Story:**
```
As a moderator,
I want to browse categorized response templates and copy them,
So that I can quickly respond to common moderation scenarios.
```

**Acceptance Criteria:**
- [ ] Templates are organized by category (e.g., AI CONTENT, BOTTING, BRANDING)
- [ ] Each template has a title, body text, and "Click to copy" action
- [ ] Given I click "Click to copy", when the action completes, then the template text is copied to my clipboard
- [ ] A search bar allows filtering templates by title, category, or content
- [ ] Categories include at minimum:
  - **AI CONTENT:** "AI Content Detected" template
  - **BOTTING:** "Fake Engagement Warning" template
  - **BRANDING:** "Branding Incorrect" template

**Priority:** Must Have (P0)
**Effort:** M

---

##### Story 12: Admin — Manage Response Templates

**User Story:**
```
As an admin,
I want to create, edit, and delete response templates,
So that moderators always have up-to-date canned responses.
```

**Acceptance Criteria:**
- [ ] Given I have admin permissions, when I view templates, then I see create/edit/delete controls
- [ ] I can create a new template with a title, category, and body text
- [ ] I can edit existing templates
- [ ] I can delete templates
- [ ] Changes are immediately visible to all moderators

**Priority:** Must Have (P0)
**Effort:** M

---

### Epic 6: Log History

#### Must-Have Stories (P0)

##### Story 13: View My Log History

**User Story:**
```
As a moderator,
I want to view my shift log history,
So that I can review my past work and verify my records.
```

**Acceptance Criteria:**
- [ ] Log history displays entries in reverse chronological order (most recent first)
- [ ] Each entry shows: date, clock-in time, clock-out time, total hours, and the shift summary paragraph
- [ ] Entries are grouped by date with date headers (e.g., "Wednesday, July 1, 2026")
- [ ] Multiple log entries can exist for the same date (e.g., split shifts)
- [ ] Log history is read-only for moderators

**Priority:** Must Have (P0)
**Effort:** M

---

##### Story 14: Admin — View All Moderator Logs

**User Story:**
```
As an admin,
I want to view log history for all moderators,
So that I can audit shift activity and verify work quality.
```

**Acceptance Criteria:**
- [ ] Given I have admin permissions, when I view log history, then I can filter by moderator
- [ ] I can view any moderator's full shift history
- [ ] I can export log data for payroll/audit purposes

**Priority:** Must Have (P0)
**Effort:** M

---

### Epic 7: Availability

#### Must-Have Stories (P0)

##### Story 15: Set My Availability

**User Story:**
```
As a moderator,
I want to set my weekly availability,
So that my admin knows when I can work.
```

**Acceptance Criteria:**
- [ ] Page displays all 7 days of the week with checkbox to mark available/unavailable
- [ ] For each available day, I can set a start time and end time
- [ ] Times are entered in the moderator's local timezone (system stores as UTC and converts automatically)
- [ ] The page displays the moderator's detected timezone (e.g., "Your timezone: Asia/Manila") with an option to change it in Settings
- [ ] Given I click "Update Availability", when the save completes, then my schedule is updated
- [ ] Unavailable days display "Not available" text
- [ ] Admins viewing availability see times converted to their own timezone

**Priority:** Must Have (P0)
**Effort:** M

---

### Epic 8: My Pay

#### Must-Have Stories (P0)

##### Story 16: View My Pay

**User Story:**
```
As a moderator,
I want to view my pay details for the current month,
So that I know how much I will be paid and when.
```

**Acceptance Criteria:**
- [ ] Page shows current month and year (e.g., "July 2026")
- [ ] Displays "Confirmed for this month" section with locked-in amount
- [ ] Shows breakdown: Monthly rate and Total
- [ ] Displays pay frequency: "Pay periods are biweekly (15th and end of month)"
- [ ] A "Request Change" button allows moderators to request additional pay (extra coverage, overtime, bonus)
- [ ] Request includes a reason/description field
- [ ] Admin reviews and approves/denies pay change requests
- [ ] This is display-only — there is NO payment integration; actual payouts happen externally
- [ ] Pay computation logic is TBD (to be defined by client when ready)

**Priority:** Must Have (P0)
**Effort:** M

> [!NOTE]
> **Resolved:** Client confirmed pay is biweekly (15th and end of month). Moderators only see their pay — no payment processing integration. Pay computation formula is currently undefined and will be provided by the client later.

---

### Epic 9: Settings

#### Must-Have Stories (P0)

##### Story 17: View & Edit Profile

**User Story:**
```
As a moderator,
I want to view and update my profile settings,
So that my information is always current.
```

**Acceptance Criteria:**
- [ ] Settings page displays:
  - **Your Role:** Shows current role (e.g., "Moderator") — read-only, with "Contact admin to change your role" note
  - **Compensation:** Shows Monthly Pay and Per Pay Period amounts — read-only
  - **Profile fields (editable):** Legal Full Name, Primary Email Address, Payment Method (dropdown — e.g., Mercury bank transfer), Whop Username, Discord Username, Timezone (dropdown — e.g., Asia/Manila)
- [ ] "Save Profile" button saves all editable fields
- [ ] Role and compensation fields are admin-controlled (read-only for moderators)

**Priority:** Must Have (P0)
**Effort:** M

---

##### Story 18: Change Password

**User Story:**
```
As a moderator,
I want to change my password,
So that I can keep my account secure.
```

**Acceptance Criteria:**
- [ ] Settings page includes a "Change Password" section
- [ ] Fields: New Password, Confirm New Password
- [ ] Password must be at least 6 characters
- [ ] Given passwords don't match, when I submit, then I see an error
- [ ] "Update Password" button saves the new password

**Priority:** Must Have (P0)
**Effort:** S

---

### Epic 10: Admin Dashboard

#### Must-Have Stories (P0)

##### Story 19: Admin Dashboard Overview

**User Story:**
```
As an admin,
I want a centralized dashboard showing all moderator activity at a glance,
So that I can manage my team effectively without navigating multiple pages.
```

**Acceptance Criteria:**
- [ ] Admin dashboard displays a summary panel with: total active moderators (currently clocked in), total on break, total offline
- [ ] Shows a "Today's Activity" feed with recent clock-in/out events across all moderators
- [ ] Displays aggregate stats: total shifts today, total hours logged today, pending pay change requests
- [ ] Shows a "Needs Review" section for pending pay change requests with approve/deny actions
- [ ] Quick-access links to: Team Schedule, All Logs, User Management
- [ ] All timestamps display in the admin's local timezone (auto-detected)

**Priority:** Must Have (P0)
**Effort:** L

---

##### Story 20: Admin User Management

**User Story:**
```
As an admin,
I want to create, edit, and deactivate moderator accounts,
So that I can manage who has access to the portal.
```

**Acceptance Criteria:**
- [ ] Admin can view a list of all moderator accounts with status (active/deactivated)
- [ ] Admin can create a new moderator account by providing: email, temporary password, legal name, pay rate
- [ ] Admin can edit moderator profile fields (role, pay rate, payment method)
- [ ] Admin can deactivate a moderator account (soft delete — data is preserved)
- [ ] Admin can reactivate a previously deactivated account
- [ ] Deactivated moderators cannot log in

**Priority:** Must Have (P0)
**Effort:** M

---

##### Story 21: In-App Notifications

**User Story:**
```
As a moderator,
I want to receive in-app notifications for important updates,
So that I stay informed about schedule changes, pay updates, and admin messages.
```

**Acceptance Criteria:**
- [ ] A notification bell icon in the header shows unread notification count
- [ ] Clicking the bell opens a notification dropdown/panel with recent notifications
- [ ] Notifications are triggered for: schedule changes, pay change request approved/denied, admin announcements
- [ ] Each notification shows: title, message, timestamp, read/unread status
- [ ] Moderator can mark notifications as read (individually or all)
- [ ] Notifications persist until dismissed
- [ ] Email notifications are out of scope for V1 (planned for future release)

**Priority:** Must Have (P0)
**Effort:** M

---

### Functional Requirements Summary

| Req ID | Description | Priority | Status |
|--------|-------------|----------|--------|
| FR-001 | Email/Password authentication with admin-provisioned accounts | Must Have | Open |
| FR-002 | Moderator dashboard with greeting, stats, clock-in/out, streak | Must Have | Open |
| FR-003 | Clock-In starts shift timer and records timestamp | Must Have | Open |
| FR-004 | Clock-Out triggers mandatory shift summary popup | Must Have | Open |
| FR-005 | Break button pauses active timer | Must Have | Open |
| FR-006 | Shift streak gamification (daily checkmarks, streak counter) | Must Have | Open |
| FR-007 | Monthly pay widget on dashboard | Must Have | Open |
| FR-008 | Simplified sidebar (7 items only, removed tabs excluded) | Must Have | Open |
| FR-009 | Team Schedule — weekly calendar, color-coded, read-only for mods | Must Have | Open |
| FR-010 | Team Schedule — admin create/edit/delete shifts | Must Have | Open |
| FR-011 | Response Templates — categorized, searchable, click-to-copy | Must Have | Open |
| FR-012 | Response Templates — admin CRUD management | Must Have | Open |
| FR-013 | Log History — reverse-chronological shift log with summaries | Must Have | Open |
| FR-014 | Log History — admin view all moderators' logs | Must Have | Open |
| FR-015 | Availability — weekly schedule with auto timezone conversion | Must Have | Open |
| FR-016 | My Pay — biweekly view with rate breakdown and change request (display only, no payment integration) | Must Have | Open |
| FR-017 | Settings — profile edit (name, email, payment, usernames, timezone) | Must Have | Open |
| FR-018 | Settings — change password (min 6 chars) | Must Have | Open |
| FR-019 | Admin Dashboard — aggregate moderator stats, activity feed, pending reviews | Must Have | Open |
| FR-020 | Admin User Management — create, edit, deactivate moderator accounts | Must Have | Open |
| FR-021 | In-App Notifications — bell icon, notification panel, triggered by schedule/pay/admin events | Must Have | Open |

### Non-Functional Requirements

| Req ID | Category | Description | Target |
|--------|----------|-------------|--------|
| NFR-001 | Performance | Page load time | < 2 seconds |
| NFR-002 | Availability | Uptime SLA | 99.9% |
| NFR-003 | Security | Password minimum length | 6 characters |
| NFR-004 | Security | Admin-only account provisioning | Enforced |
| NFR-005 | Accessibility | WCAG compliance | Level AA |
| NFR-006 | Responsiveness | Mobile-responsive web design | All pages |
| NFR-007 | Timezone | All times auto-convert to user's local timezone | Auto-detect from profile/browser |
| NFR-008 | Browser Support | Modern browsers | Chrome, Safari, Firefox, Edge |
| NFR-009 | Data | No payment integration | Display-only (external payouts) |

---

## Success Metrics

### Key Performance Indicators (KPIs)

#### Primary Metric (North Star)

**Metric:** Shift Summary Completion Rate
**Definition:** Percentage of clock-out events that include a submitted shift summary
**Current Baseline:** Unknown (no enforcement in current system)
**Target:** 100% (enforced by system — cannot clock out without summary)
**Why This Metric:** Ensures every worked shift is documented, directly solving the accountability problem

#### Secondary Metrics

| Metric | Current | Target | Timeframe |
|--------|---------|--------|-----------|
| Moderator clock-in compliance (shifts with clock-in) | Unknown | > 95% | Month 1 |
| Average time on irrelevant features | High (cluttered UI) | 0 (features removed) | Launch |
| Admin pay inquiry tickets | Frequent | < 2/month | Month 2 |
| Moderator onboarding time | ~30 min (complex UI) | < 10 min | Launch |
| Shift streak average (days/week) | Unknown | > 4 days/week | Month 3 |

### HEART Framework Application

| Dimension | Signal | Metric | Target |
|-----------|--------|--------|--------|
| **Happiness** | Moderator satisfaction | Survey NPS | > 40 |
| **Engagement** | Daily active usage | DAU/total moderators | > 90% on workdays |
| **Adoption** | Feature usage | % mods using clock-in daily | > 95% |
| **Retention** | Moderator retention | Monthly churn rate | < 10% |
| **Task Success** | Clock-out completion | Summary submission rate | 100% |

---

## Scope

### In Scope

- Email/Password authentication (admin-provisioned accounts)
- Moderator dashboard with clock-in/out, break, streaks, and pay widget
- Mandatory end-of-shift summary enforcement
- Simplified sidebar navigation (7 items)
- Team schedule (weekly calendar view, admin edit)
- Response templates (categorized, searchable, click-to-copy, admin CRUD)
- Log history (per moderator and admin aggregate view)
- Availability management (weekly, auto timezone conversion)
- My Pay (biweekly view, rate breakdown, change request — display only)
- Settings (profile edit, password change)
- Two user roles: Admin and Moderator
- Admin Dashboard with aggregate stats, user management, and activity feed
- In-app notification system
- Mobile-responsive web application
- Automatic timezone adjustment per user

### Out of Scope

- Campaign management (Active Campaigns, Campaign Notes)
- Task Log
- "Needs Attention" dashboard section
- "Always Active" dashboard section
- "My Campaigns" dashboard section
- Google OAuth / SSO
- Native mobile apps (iOS/Android)
- Real-time messaging or chat
- Content analytics or social media integration
- Payment processing / payment integration (payouts handled externally via Mercury bank transfer)
- Email notifications (planned for future release)
- "POWERED BY CONTENT REWARDS" branding (removed)
- Multi-language support (English only for V1)
- Data migration from existing ClipFarm portal (fresh start)

---

## Technical Considerations

> Full details in [architecture.md](file:///c:/Users/Angel/Desktop/CLIENT/CLOCKY/docs/architecture.md)

### Architecture

- **Frontend:** Next.js (App Router) with TypeScript and Server Components
- **Backend:** Next.js Server Actions + API Routes (serverless)
- **Database:** Supabase (managed PostgreSQL with Row Level Security)
- **Auth:** Supabase Auth (Email/Password, admin-provisioned accounts via service role)
- **Realtime:** Supabase Realtime (WebSocket-based Postgres changes for live updates)
- **Hosting:** Vercel on a new custom domain (separate from existing ClipFarm infrastructure)
- **Styling:** Vanilla CSS (CSS Modules) with CSS custom properties for design tokens
- **Timezone Handling:** All timestamps stored in UTC; converted to user's local timezone (detected from profile setting or browser) on display

### Dependencies

- **Supabase JS Client:** `@supabase/supabase-js` (browser + server + admin clients)
- **Timezone:** `date-fns-tz` + native `Intl.DateTimeFormat`
- **Type Generation:** Supabase CLI (`supabase gen types typescript`)
- **Platforms:** Whop and Discord (referenced in moderator workflows but not integrated)

### Security & Privacy

- Password hashing (bcrypt or equivalent)
- Role-based access control (Admin vs. Moderator)
- Admin-only account creation (no self-registration)
- Session management with secure tokens
- HTTPS enforced
- PII handling (legal names, email addresses, payment methods) must comply with data protection standards
- Moderator profile data (Discord username, Whop username) stored securely

---

## Design & UX Requirements

### Design System

- **Theme:** Dark mode (Linear-inspired dark canvas system — Mercury Marketing brand identity)
- **Primary Color:** Lavender-blue (`#5e6ad2` / accents and CTAs)
- **Secondary Colors:** Surface layers (`#0e0f11` to `#222428`) for cards, panels, and dropdowns
- **Borders:** Hairline borders (`#23252a`)
- **Typography:** Inter (sans-serif) for display/body, JetBrains Mono for monospace code/status tokens
- **Cards:** Dark bordered panels (`rounded-lg` / 12px corners)
- **Buttons:** Lavender-blue for primary actions, charcoal (`bg-surface-1` with hairline border) for secondary actions

### User Flows

**Moderator Daily Flow:**
1. Open app → Login page (if not authenticated)
2. Login → My Dashboard
3. Dashboard → Clock In
4. Work shift (access Response Templates, handle support chats/tickets)
5. Dashboard → Clock Out → Mandatory Summary Popup → Submit
6. (Optional) Check My Pay, Log History, Team Schedule

**Admin Flow:**
1. Login → Admin Dashboard (aggregate moderator overview: active/break/offline counts, today's activity feed)
2. Review "Needs Review" panel — approve/deny pay change requests
3. Navigate to User Management — create/edit/deactivate moderator accounts
4. View/edit Team Schedule — assign shifts, manage coverage
5. Review Log History across all moderators — filter by moderator, export for payroll
6. Manage Response Templates — create/edit/delete canned responses
7. Receive in-app notifications for moderator clock events and pay requests

### UX Principles

- **Minimal friction:** Clock-in should be one tap from dashboard
- **Enforced accountability:** Cannot bypass shift summary
- **Clear hierarchy:** Important info (pay, schedule, clock) visible at a glance
- **Timezone intelligence:** System auto-detects and converts all times to the user's local timezone; no manual conversion needed
- **Mobile-first responsive:** Moderators may access from mobile devices

### Accessibility

- WCAG 2.1 AA Compliance
- Screen reader compatibility
- Sufficient color contrast (especially on dark theme)
- Keyboard navigation support

---

## Timeline & Milestones

| Milestone | Deliverables | Target Date |
|-----------|--------------|-------------|
| Specification Approved | PRD signed off by client | TBD |
| Design Freeze | High-fi mockups completed | TBD |
| Alpha Release | Core features (auth, dashboard, clock, sidebar) | TBD |
| Beta Release | All features complete, internal testing | TBD |
| General Availability | Live in production | TBD |

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Pay computation formula undefined | M | H | System displays admin-set amounts; computation logic to be added when client provides formula |
| Timezone auto-detection fails | M | L | Fallback to timezone set in user profile (Settings); allow manual override |
| Mockups include removed sections | L | H | Development follows PRD (not mockups) for section inclusion/exclusion |
| Moderators resist mandatory shift summaries | M | M | Keep summary form simple; educate on purpose during onboarding |
| Scope creep from re-introducing campaign features | H | M | Strict adherence to "Out of Scope" list; change request process |
| New domain SEO/discoverability | L | L | Internal tool — SEO not a concern; distribute URL directly to team |

---

## Dependencies & Assumptions

### Dependencies

- Design assets / style guide for Mercury Marketing branding (or approval to create new brand identity based on dark theme)
- List of response template categories and content from client
- Moderator roster and pay rates from client
- Pay computation formula from client (currently undefined)
- New domain registration and hosting setup

### Assumptions

- Moderators have reliable internet access during shifts
- The system auto-detects and adjusts all displayed times to the user's local timezone (stored as UTC internally). Moderators and admins each see times in their own timezone.
- Payment processing happens entirely outside the system (Mercury bank transfer); the portal only displays pay amounts set by the admin
- Pay is biweekly (15th and end of month) — display only
- Admin accounts are pre-configured (no self-registration for any role)
- Branding will be "Mercury Marketing" — no ClipFarm or "POWERED BY CONTENT REWARDS" branding
- No data migration from the existing ClipFarm portal — this is a fresh build
- English is the only required language for V1
- The portal will be a web application accessed via browser (not a native app)
- The portal will be hosted on a new, separate domain
- In-app notifications will be available at launch; email notifications are deferred to a future release

---

## Open Questions

- [x] **Authentication Method:** ~~Google OAuth vs Email/Password~~ → **Resolved: Email/Password**
- [x] **Pay Frequency:** ~~Biweekly vs monthly~~ → **Resolved: Biweekly (15th and end of month), display only, no payment integration**
- [ ] **Pay Computation Formula:** Client does not currently know the computation method. System will display admin-set amounts until formula is defined. **Awaiting client input.**
- [x] **Admin Dashboard:** ~~What features?~~ → **Resolved: Designed with aggregate stats (active/break/offline counts), today's activity feed, needs review panel, user management, and quick-access navigation. See Epic 10.**
- [x] **Branding:** ~~Mercury Marketing vs ClipFarm~~ → **Resolved: Mercury Marketing**
- [x] **Content Rewards:** ~~Keep "POWERED BY CONTENT REWARDS"?~~ → **Resolved: Removed**
- [x] **Notification System:** ~~In-app, email, or both?~~ → **Resolved: In-app notifications at launch. Email notifications deferred to future release.**
- [x] **Data Migration:** ~~Migrate from ClipFarm?~~ → **Resolved: No migration. Fresh start.**
- [x] **Hosting & Domain:** ~~New domain or subdomain?~~ → **Resolved: New domain**

---

## Stakeholder Sign-Off

| Stakeholder | Role | Status | Date |
|-------------|------|--------|------|
| Client (Mercury Marketing) | Product Owner | Pending | - |
| Angel | Developer / Author | Draft | 2026-07-02 |
| TBD | UX Designer | Pending | - |
| TBD | QA Lead | Pending | - |

---

*This PRD is based on the client's raw requirements document and OCR analysis of 11 UI mockup screenshots from the existing ClipFarm OPS Portal. All previously identified conflicts have been resolved with client input (see Open Questions section). The only remaining open item is the pay computation formula.*
