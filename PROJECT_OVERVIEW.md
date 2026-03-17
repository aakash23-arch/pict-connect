# PICT Connect — Project Overview

## 🎯 Core Idea

**PICT Connect** is a college social platform exclusively for students of **PICT (Pune Institute of Computer Technology)**. It is gated behind `@ms.pict.edu` institutional email authentication, ensuring only verified PICT students can access it.

Think of it as a **campus-only mini social network** — combining a community feed, club management, academic resource sharing, event tracking, direct messaging, and announcements all in one place.

---

## 🧱 Tech Stack

| Layer        | Tech                                      |
|--------------|-------------------------------------------|
| Framework    | Next.js (TypeScript, App Router)          |
| Styling      | Tailwind CSS                              |
| Database     | Firebase Firestore (real-time)            |
| Auth         | Firebase Auth (Google + Email-Link)       |
| Theme        | next-themes (Light / Dark mode)           |

---

## 📄 Pages & Features

### 🔐 Login (`/login`)
- Google Sign-In (restricted to `@ms.pict.edu` domain)
- Passwordless email-link sign-in
- Redirects unauthenticated users away from all protected pages

### 🏠 Dashboard (`/dashboard`)
- Central hub with navigation cards to all major sections
- Shows logged-in user email

### 📢 Announcements & Polls (`/announcements`)
- **Announcements Tab**: Aggregates announcements from all clubs; searchable and filterable by category (Academic, Club Activity, Exam, Placement, Sports, General); "New" badge for recent posts
- **Polls Tab**: Campus-wide polls with live vote counts and percentage bars; any student can create a poll; one-vote-per-user enforced via Firestore transaction

### 📅 Events & Workshops (`/events`)
- Lists upcoming events with date, venue, organizer, and attendee count
- **RSVP** toggle (Going / Not Going)
- **List View** and **Calendar View** (custom built month calendar)
- Organizers (admin/club emails) can create new events
- Pre-seeded academic events for the semester

### 🏛️ Clubs (`/clubs`, `/clubs/[id]`)
- Grid of all PICT clubs with search
- Individual club pages (dynamic route)
- Club membership tracked in Firestore subcollections

### 📚 Academics (`/academics`)
- Subject selector (CoA, DSA, DBMS, OS, Maths)
- Three tabs: **Notes**, **Previous Year Papers**, **Resources**
- All logged-in students can view; only CRs (emails with `cr@ms.pict.edu`) can upload
- Links open externally (Google Drive / PDF URLs)

### 🌐 Community Feed (`/feed`)
- Twitter-like post feed (real-time Firestore)
- Post with tags: `#General`, `#Doubt`, `#LostFound`, `#News`, `#Confession`
- **Likes** (optimistic update) and **Comments** (collapsible)
- Batch badge shown on each post (FE/SE/TE/BE inferred from email)

### 💬 Inbox & Chat (`/inbox`, `/chat/[id]`)
- Start one-to-one chats with other `@ms.pict.edu` students
- Inbox shows recent conversations with last message preview
- Real-time messaging in individual chat rooms

### 👤 My Profile (`/profile`)
- Editable profile: Display Name, Enrollment No., Branch, Year, Division, Roll No.
- Per-semester SGPA grades (dynamic based on year)
- Skills, Interests, Achievements (free text)
- Relationship Status field (Single / Committed / Interested / Not Interested)
- Saved to Firestore under `users/{email}`

### 🛡️ Admin (`/admin`)
- Stats: Total Students, Total Posts, Active Events
- Recent users table with join date
- Access controlled (email must contain `admin` or `pict.edu`)

---

## 🔧 Components

| Component            | Purpose                                                    |
|----------------------|------------------------------------------------------------|
| `Navbar`             | Sticky top nav, all page links, logout, dark/light toggle  |
| `PostCard`           | Feed post with likes, comments, batch badge                |
| `ProtectedPage`      | Auth guard — redirects unauthenticated users to `/login`   |
| `UserContext`        | Global React context: `user`, `profile`, `refreshProfile`  |
| `ActiveMembersNav`   | Shows active/online members count in the nav bar           |
| `ThemeProvider`      | Wraps app with next-themes for dark mode                   |

---

## 🗄️ Firestore Collections

| Collection                        | Purpose                          |
|-----------------------------------|----------------------------------|
| `clubs/{id}/announcements`        | Per-club announcements           |
| `clubs/{id}/members`              | Club membership                  |
| `posts`                           | Community feed posts             |
| `posts/{id}/comments`             | Comments on posts                |
| `events`                          | Campus events                    |
| `polls`                           | Campus polls with vote tracking  |
| `academics/{subject}/resources`   | Notes, PYQs, resources           |
| `users/{email}`                   | User profiles                    |
| `users/{email}/chats`             | Inbox / chat summaries           |
| `chats/{chatId}`                  | Chat room metadata               |
| `chats/{chatId}/messages`         | Real-time messages               |

---

## 🔐 Roles & Access Control

| Role             | Check                                      | Permissions                          |
|------------------|--------------------------------------------|--------------------------------------|
| Student          | Any `@ms.pict.edu` email                  | View everything, post, vote, chat    |
| CR (Class Rep)   | Email contains `cr` + `@ms.pict.edu`      | Upload academic resources            |
| Organizer        | Email contains `admin` or `club`           | Create events                        |
| Admin            | Email contains `admin` or `pict.edu`       | Admin dashboard access               |

---

## 📁 Project Structure

```
pict-connect/
├── app/
│   ├── academics/       # Academic resources page
│   ├── admin/           # Admin dashboard
│   ├── announcements/   # Announcements + Polls
│   ├── chat/[id]/       # Chat room (dynamic)
│   ├── clubs/           # Clubs list + [id] detail
│   ├── dashboard/       # Home dashboard
│   ├── events/          # Events + Calendar
│   ├── feed/            # Community feed
│   ├── inbox/           # Messaging inbox
│   ├── login/           # Auth page
│   ├── profile/         # User profile
│   ├── layout.tsx       # Root layout with Navbar
│   └── globals.css      # Global styles
├── components/
│   ├── Navbar.tsx
│   ├── PostCard.tsx
│   ├── ProtectedPage.tsx
│   ├── UserContext.tsx
│   ├── ActiveMembersNav.tsx
│   └── ThemeProvider.tsx
├── lib/
│   ├── firebase.ts          # Firebase init
│   ├── academic-events.ts   # Static event data
│   ├── batch-utils.ts       # Batch badge helper
│   └── data/clubs.ts        # Static clubs data
├── FIREBASE_SETUP.md        # Firebase config guide
└── PROJECT_OVERVIEW.md      # This file
```
