# Project Requirements Document (PRD)

## 1. Project Overview

Ripl is a hybrid productivity and social coworking Progressive Web App (PWA) designed to combine focused solo sprints with live group “jam” sessions. In solo mode, individuals set a personal goal, pick a 20- or 40-minute timer, and build streaks, stats, and private milestone badges. In group mode, users create or join coworking sessions via shareable links, see who’s attending, sprint together, celebrate completions, and chat—then everything vanishes at session end.

We’re building Ripl to help remote workers, students, and anyone who needs accountability to stay on task—either alone or in a small peer group. The MVP’s success criteria are straightforward: functional solo and group sprint flows, basic social features (ephemeral chat, friend requests), location-based joining rules, and an admin dashboard capturing adoption metrics (sessions created, invites sent, attendees, retention). Design polish and paid tiers come later.

---

## 2. In-Scope vs. Out-of-Scope

### In-Scope (MVP)
- **Authentication**  
  - Sign in via LinkedIn, email/password, or phone number.
- **Solo Focus Sprints**  
  - Timer options: 20 or 40 minutes  
  - Goal input, private tracking  
  - Streak counter, stats dashboard, private badges
- **Group Sessions (“Jams”)**  
  - Create session: name, duration, public/private link, location via Google Maps  
  - Session lobby: teaser attendee photos, ephemeral chat  
  - Location & remote-join rules (50 m radius; 5 remote passes/month)  
  - Soft cap of 50 participants  
  - In-session: start/join sprints, live timer, participant list, emoji reactions  
  - Post-sprint confetti animation & ephemeral feedback chat
- **Friends & Social Layer**  
  - One-time message request during sessions  
  - Muted-by-default friend notifications  
  - Friends list UI in settings with notification toggles  
  - Deleting chat = unfriending
- **Notifications & Integrations**  
  - In-app notifications for sprint start/end  
  - Google Calendar sync for joined sessions  
- **Admin Dashboard** (internal)  
  - Key metrics: sessions created, invites sent, attendee counts, retention  
  - Moderation: block/report users, remove/edit sessions/users
- **Onboarding & UX**  
  - Minimal, self-explanatory flows; no tutorials  

### Out-of-Scope (Phase 1)
- Design polish beyond basic functional UI  
- Paid tiers, in-app purchases, café partnerships  
- Push notifications (mobile OS)  
- Native iOS/Android apps  
- Advanced analytics or retention campaigns  
- Recurring event scheduling  
- Chat history beyond ephemeral scope  

---

## 3. User Flow

A first-time or returning user lands on a clean login screen offering three options: LinkedIn OAuth, email/password, or phone number verification. After authentication, the user is taken to the Home Dashboard, which clearly displays two primary actions side by side: “Start Solo Sprint” and “Find or Create Session.” A subtle notification bell indicates any pending friend requests or messages.

If the user taps **Start Solo Sprint**, they see a modal to input a personal goal and choose 20 or 40 minutes. Hitting “Start” launches the countdown screen showing the goal, remaining time, and pause/cancel controls. On completion, a summary screen reveals updated streaks, any new badges, and a button to return to the dashboard. If the user taps **Create Session**, they fill out a form (name, duration, privacy, location via Google Maps). A shareable link is generated, the session is added to their Google Calendar, and they enter the session lobby with teaser attendee avatars and pre-session chat. When the host clicks “Start Session,” the view transitions seamlessly into the live session interface, where participants can start or join sprints and use minimal reactions until the sprint or session ends.

---

## 4. Core Features

- **Authentication**  
  - LinkedIn OAuth 2.0  
  - Email/password  
  - Phone/SMS verification
- **Solo Sprint Module**  
  - 20 / 40 min timers  
  - Private goal input  
  - Streak & stats tracking  
  - Milestone badges (10, 20, etc.)
- **Session (Jam) Management**  
  - Create/join session with link  
  - Public vs. private toggle  
  - Location check (50 m radius) & remote-join passes  
  - Soft cap: 50 participants  
- **Session Lobby**  
  - Teaser attendee photos  
  - Ephemeral pre-session chat  
  - Host tools: start session, remove participants
- **In-Session Sprint Collaboration**  
  - Any participant can start/join a sprint  
  - Live timer widget & participant list  
  - Minimal emoji reactions  
  - Confetti animation on completion  
  - Ephemeral post-sprint chat
- **Friends & Messaging**  
  - One-time request during session  
  - Muted notifications by default  
  - Friends list in settings  
  - Unfriend on chat deletion
- **Notifications & Calendar**  
  - In-app sprint start/end alerts  
  - Google Calendar sync on session join
- **Admin & Moderation**  
  - Adoption metrics dashboard  
  - Report/block users  
  - Host vs. admin permissions  
- **Data Retention**  
  - Keep all jam data/history for pilot

---

## 5. Tech Stack & Tools

- **Front-end**  
  - React (with PWA support via Service Workers)  
  - lovable.dev for AI-powered code scaffolding  
- **Back-end**  
  - Node.js + Express  
  - MongoDB for primary data store  
  - Redis for real-time state (active timers, lobby)  
  - Socket.IO for real-time communication
- **APIs & Integrations**  
  - LinkedIn OAuth 2.0  
  - JWT for session auth  
  - Twilio (or similar) for SMS auth  
  - Google Maps API (location, cafe finder)  
  - Google Calendar API (event sync)  
  - Google Analytics
- **Infrastructure & DevOps**  
  - AWS S3 for asset storage  
  - Docker containers  
  - GitHub Actions for CI/CD  
  - lovabel.dev plugin/integration for rapid front-end generation

---

## 6. Non-Functional Requirements

- **Performance**  
  - Initial load under 2 seconds on 3G network  
  - Real-time events (timer updates, chat) sub-second latency
- **Security**  
  - TLS for all traffic  
  - JWT tokens with short-lived expiry  
  - Secure storage of OAuth and SMS credentials  
- **Scalability**  
  - Support up to 50 concurrent participants per session  
  - Horizontal scaling via Docker + stateless servers
- **Reliability & Availability**  
  - 99.5% uptime target  
  - Graceful fallback to solo mode if real-time service degrades
- **Usability**  
  - Responsive layout for desktop & mobile browsers  
  - Minimal onboarding; intuitive icons and labels
- **Compliance & Privacy**  
  - GDPR-ready data model (users can request deletion, though pilot retains all data)  
  - Ephemeral chat purged immediately at session end

---

## 7. Constraints & Assumptions

- The MVP is delivered as a PWA; no native mobile apps in Phase 1.  
- Google Maps and Calendar quotas are sufficient for pilot usage.  
- LinkedIn OAuth and SMS gateway services (e.g., Twilio) are available and configured.  
- Users accept in-app notifications; push notifications deferred.  
- Data retention is unlimited for pilot; future privacy requests handled later.  
- lovable.dev AI code generation will bootstrap front-end forms and basic styling.

---

## 8. Known Issues & Potential Pitfalls

- **API Rate Limits**  
  - Google Maps / Calendar and LinkedIn may throttle; implement caching and exponential backoff.
- **Location Accuracy**  
  - GPS drift could block legitimate users; consider a margin of error (e.g., 10 m extra).
- **Time Synchronization**  
  - Client clocks may skew timers; maintain server-authoritative timestamps.
- **Real-time Scaling**  
  - Socket.IO may strain under many concurrent timers; use Redis pub/sub and horizontal autoscaling.
- **Ephemeral Chat Deletion**  
  - Ensure all chat copies are purged on session end; audit logs do not store content.
- **User Experience**  
  - Minimal design risks confusion; run quick hallway tests to catch flow blockers.

This PRD provides a single source of truth for the AI model to generate all subsequent artifacts—app flow diagrams, tech stack docs, frontend/backend guidelines, security rules, and beyond—without ambiguity.