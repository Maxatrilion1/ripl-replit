# Unified Project Documentation

## Project Requirements Document

### 1. Project Overview

Ripl is a hybrid productivity and social coworking web app designed to help individuals focus on solo work sprints and join group coworking sessions. Users can start private 20- or 40-minute focus sprints, set personal goals, and track their streaks, stats, and milestone badges. At the same time, they can create or join collaborative sessions (called jams) with friends or strangers, enjoy real-time timers, react with emojis, and chat ephemerally. This combination of personal accountability and community motivation solves the problem of people struggling to maintain focus when working alone or feeling isolated when co-working remotely.

Our key objectives are to deliver a working MVP that covers both solo and group flows in one cohesive app, ensure the core features are stable and functional, and gather early feedback through a pilot. Success will be measured by user engagement—number of sprints run, sessions created, invite links used, and retention over a week. Design polish and advanced features such as paid tiers or mobile apps will come later; right now we want code that works and a simple, intuitive user experience.

### 2. In-Scope vs. Out-of-Scope

**In-Scope**

*   Solo focus sprints: 20- and 40-minute timers, goal input, private streaks, stats, milestone badges.
*   Session (jam) creation: shareable invite link, duration, privacy settings (public/private), location check-in.
*   Session lobby: teaser attendee photos, ephemeral chat, host controls to start, remove participants.
*   Live sprints in sessions: personal goals, 20/40 minute options, joinable parallel sprints, timers, emoji reactions.
*   Sprint completion: confetti animation, ephemeral post-sprint chat for feedback.
*   Friends & social layer: one-time message requests, in-app friendships, muted notifications by default, friends list in settings, toggle alerts, unfriending by deleting chat.
*   Ephemeral chats that disappear when session ends.
*   Participant cap of 50 per session with report/block moderation tools.
*   Admin dashboard (internal): key metrics (sessions created, invites sent, attendees, retention), moderation actions.
*   Authentication: LinkedIn OAuth, email/password, or phone number (SMS).
*   Integrations: Google Maps for location, Google Calendar sync, in-app notifications for sprint events.
*   Progressive web app build with basic offline support (service workers).

**Out-of-Scope**

*   Design polish beyond basic functional UI.
*   Native iOS or Android apps (PWA only for MVP).
*   Paid tiers, in-app purchases, or café partnerships (future phase).
*   Recurring session scheduling and advanced calendar features.
*   Comprehensive analytics beyond admin dashboard metrics.
*   Tutorials or guided onboarding flows.
*   Alternative map providers or custom location directories.
*   Data deletion workflows and advanced privacy settings (we will keep data for pilot).

### 3. User Flow

A new user lands on the Ripl web app and chooses to sign up via LinkedIn, email/password, or phone number. After providing credentials and any necessary verification (email link or SMS code), they arrive at the main dashboard. From here, they can immediately start a solo focus sprint by entering a goal and choosing 20 or 40 minutes, or they can explore and create group sessions by setting session details and sharing the invite link. The flow is kept minimal so users don’t get stuck on instructions.

When a user creates a session, they see a lobby with attendee teasers and a simple pre-session chat. Once the host starts the session, the interface shifts to a live session view where everyone can start or join sprints, watch timers, react with emojis, and chat after each sprint. Users can send message requests to new people, manage friendships in settings, and receive notifications when friends begin sprints. Admins access a separate dashboard for metrics and moderation.

### 4. Core Features

*   Solo Focus Sprints: start a private 20/40 minute timer with goal input, pause/cancel controls, and streak/stat tracking.
*   Milestone Badges: private rewards at 10, 20, 50 sprints, visible only to the user.
*   Session Creation: hosts set title, duration, privacy, location check, then share a unique link.
*   Session Lobby: teaser attendee photos, ephemeral chat, start session button, host moderation controls.
*   Live Sprints in Sessions: participants set goals, choose timers, join others’ or start parallel sprints, see a shared timer, and react with emojis.
*   Sprint Completion: confetti animation and short-lived chat for feedback and appreciation.
*   Friends & Messaging: one-time in-session message requests, muted friendships by default, friends list in settings, toggle notifications, unfriending via chat deletion.
*   Ephemeral Chats: all session chats vanish at session end.
*   Participant Cap & Moderation: limit 50 attendees, host and admin tools to remove or block users.
*   Admin Dashboard: view sessions created, invite link uses, attendee counts, retention metrics; manage sessions and users.
*   Authentication & Integrations: LinkedIn OAuth, email/password, SMS login; Google Maps for nearby jams; Google Calendar API for sync; in-app notifications for sprint start/end.

### 5. Tech Stack & Tools

*   Frontend: React with PWA support (service workers), built via lovable.dev starter, styled with simple CSS modules or styled-components.
*   Backend: Node.js with Express for APIs, Socket.IO for real-time timers and chat, MongoDB for data, Redis for session and rate limiting.
*   Hosting & Storage: AWS S3 for assets, Docker containers orchestrated via GitHub Actions CI/CD.
*   Auth & Security: LinkedIn OAuth 2.0, JWT tokens, phone/SMS auth (e.g., Twilio), HTTPS everywhere.
*   Integrations: Google Maps API for location, Google Calendar API for event sync, Google Analytics for usage tracking.
*   Admin Tools: internal React/Express pages, secured by role-based access.

### 6. Non-Functional Requirements

*   Performance: page loads under 2 seconds, API responses under 200ms, real-time timers accurate within 1 second.
*   Scalability: support up to 50 concurrent users per session, auto-scale Node containers.
*   Security: encrypted data in transit (HTTPS), stored passwords hashed, OAuth for social login, CSRF and XSS protections.
*   Availability: 99.9% uptime target during pilot.
*   Compliance: basic privacy measures, retention of pilot data indefinitely.

### 7. Constraints & Assumptions

*   We will build a web-only PWA; no native mobile in MVP.
*   Data will be kept indefinitely for pilot analytics; no deletion workflows now.
*   Google Maps and Calendar APIs will be available under free or trial tiers.
*   Authentication via LinkedIn, email, or phone is reliable; third-party rate limits are manageable.
*   lovable.dev provides a working React/PWA scaffold.

### 8. Known Issues & Potential Pitfalls

*   Race conditions in real-time timers and chat can cause sync drift; mitigate with server-authoritative timing and reconnect logic.
*   SMS verification might incur costs and delays; consider fallback email OTP.
*   Geolocation accuracy can vary; allow manual check-in fallback.
*   Exceeding third-party API quotas; monitor usage and plan for paid tiers.
*   Session cap enforcement edge cases when many users join simultaneously; use atomic counters in Redis.

## App Flow Document

### Onboarding and Sign-In/Sign-Up

When a new visitor reaches Ripl, they are greeted by a clean login screen offering LinkedIn OAuth, email/password, or phone number sign-in. If they choose email or phone, they provide credentials and verify via code sent to their inbox or SMS. After authentication, they land on the main dashboard. For password recovery, users click "Forgot Password," receive a reset link by email, set a new password, and then return to sign in. Signing out is done from the profile menu with a single click.

### Main Dashboard or Home Page

Once logged in, users see a two-pane dashboard: on the left, a "Solo Sprint" card with goal input and timer options; on the right, a "Find or Create Session" card with a map icon. A top bar shows notifications for friend requests and in-app alerts. A sidebar holds links to Settings, Friends, and the Admin Dashboard (for privileged users). Users click on either the solo card or the session card to start their desired flow.

### Detailed Feature Flows and Page Transitions

If the user chooses a solo sprint, a modal appears where they type a goal and select 20 or 40 minutes. Hitting "Start Sprint" closes the modal and transitions to a full-screen timer view. Controls for pause, cancel, and return to dashboard appear at the bottom. When time’s up, the view switches to a summary showing updated streak, stats, and any earned badge, with a button back to dashboard.

If the user opts to create a session, they fill out a form page with session name, duration, privacy setting (public link or invite only), and location check. Submitting generates an invite link, syncs the session to their Google Calendar, and navigates to the session lobby. In the lobby, teaser avatars and a small chat box load at the bottom. The host can remove participants or start the session with a button at the top. When the host starts, the page seamlessly transitions to the live session view.

In the live session, all attendees see a list of participants on the left, a large shared timer area, and buttons to "Start Your Sprint" or join someone else’s in the center. Tapping "Start Your Sprint" opens a mini modal to choose goal and timer, then returns to update the main view. During the sprint, emoji reaction buttons float on the right. At completion, confetti overlays and a short-lived chat panel slides up. When the host ends the session, everyone is redirected back to the dashboard.

### Settings and Account Management

The Settings page lets users update their profile (name, photo), manage login methods (add/remove email or phone), and toggle notifications for friend sprint alerts. A Friends tab shows current connections with switches to mute or unmute notifications. A "Delete Friendship" button appears alongside each friend. From this page, users can return to the dashboard by clicking the logo in the header.

### Error States and Alternate Paths

If a user enters invalid credentials, a red error message appears under the input fields prompting correction. For lost connectivity during a sprint, the timer freezes locally but reconnection logic tries every five seconds; a banner explains the issue until it resolves. If a user tries to join a session beyond the 50-person cap or remote join limit, the "Join" button is disabled and an explanatory tooltip shows. In case of server errors, a generic "Something went wrong" page offers a retry button.

### Conclusion and Overall App Journey

From landing on the login screen to completing a focused work sprint or a collaborative jam, Ripl guides users through each step with minimal friction. The journey emphasizes simplicity: sign in, choose solo or session, run a timer, celebrate completion, and see your progress or connect socially. Admin users can step into a separate dashboard to monitor metrics and moderate activity, ensuring a smooth experience for everyone.

## Tech Stack Document

### Frontend Technologies

*   React: component-based UI framework for building scalable, responsive user interfaces.
*   PWA with Service Workers: enables offline support, faster load times, and installable web app behavior.
*   CSS Modules or styled-components: scoped styling to avoid clashes and support dynamic theming.
*   lovable.dev starter kit: accelerates development with preconfigured React/PWA setup.

### Backend Technologies

*   Node.js with Express: handles HTTP APIs, authentication, and session management.
*   Socket.IO: powers real-time timers, chat, and event broadcasts across clients.
*   MongoDB: stores user profiles, sprint records, session data, and chats.
*   Redis: manages rate limiting, session counters (participant caps), and pub/sub for real-time events.

### Infrastructure and Deployment

*   Docker: containerizes services for consistency across environments.
*   GitHub Actions CI/CD: automates build, test, and deployment pipelines.
*   AWS S3: hosts static assets such as images, scripts, and icons.
*   Hosting on a cloud provider (e.g., AWS ECS or similar): ensures auto-scaling and high availability.

### Third-Party Integrations

*   LinkedIn OAuth 2.0: quick social login with professional profiles.
*   Twilio (or similar) SMS API: phone number verification and authentication.
*   Google Maps API: geolocation and map display for finding nearby sessions.
*   Google Calendar API: syncs session events to users’ calendars.
*   Google Analytics: tracks user engagement, page views, and conversion metrics.

### Security and Performance Considerations

*   HTTPS everywhere: encrypts data in transit.
*   JWT Authentication: stateless, secure token-based user sessions.
*   Password hashing: uses bcrypt or similar to protect stored credentials.
*   Input validation and sanitization: prevents XSS and SQL/NoSQL injection.
*   Server-authoritative timers: avoids client drift in sprint timing.
*   CDN for static assets: reduces load times and improves caching.

### Conclusion and Overall Tech Stack Summary

We chose a modern JavaScript stack—React for the front end and Node/Express on the back end—to speed up development and support real-time interactions with Socket.IO. MongoDB and Redis cover both persistence and fast state management. The PWA approach ensures a broad reach, while integrations with LinkedIn, Google Maps, and Calendar add key functionality without reinventing the wheel. Docker and CI/CD pipelines make deployment reliable and maintainable.

## Frontend Guidelines Document

### Frontend Architecture

Ripl’s frontend follows a component-based architecture using React. Each UI element (buttons, modals, timers) lives in its own component folder with related styles and tests. Service workers enable offline caching of core assets and API fallbacks. State that concerns global data (user info, session list) is managed at a top level and passed down via context or props to child components.

### Design Principles

We focus on usability, clarity, and minimalism. Interfaces guide users without overwhelming them, with large actionable buttons and clear labels. Accessibility standards (WCAG) are followed: semantic HTML, proper aria attributes, and keyboard navigation. The layout is fully responsive, adapting seamlessly from small mobile screens to desktop.

### Styling and Theming

We use CSS Modules or styled-components for local scoping. The color palette includes soft blues (B0E2E8, 7FB0B6, 508086) and accent oranges (FFC081, FF8F53, C76026) on a light white background (EFEDE1). Text uses a dark navy (10263E). We follow a flat design with subtle shadows for depth. Theme variables (colors, fonts, spacing) are centralized in a theme file for easy adjustments.

### Component Structure

Components live under `src/components`, grouped by feature (e.g., `Timer`, `SessionLobby`, `Chat`). Each folder has an index file, style file, and test file. Reusable UI primitives (Button, Input, Modal) live in a `ui` folder. This structure fosters reusability and maintainability.

### State Management

We use React Context for global state like user auth and session list. Local component state handles UI toggles and form inputs. For larger flows (live session data, participant lists), we subscribe to Socket.IO events and update context state. No heavy state libraries are needed for MVP.

### Routing and Navigation

React Router manages navigation. Main routes include `/dashboard`, `/solo`, `/session/:id`, and `/settings`. Route guards check authentication and redirect to login if needed. A catch-all route shows a friendly 404 page.

### Performance Optimization

We load components lazily with React’s `lazy` and `Suspense`, splitting code by route. Images and icons are optimized and served via CDN. Critical CSS is inlined for faster first paint. Service workers cache API responses for short-term offline resilience.

### Testing and Quality Assurance

Unit tests with Jest cover components and utility functions. Integration tests with React Testing Library simulate user interactions. End-to-end tests with Cypress verify key flows: login, solo sprint, session creation, and sprint participation. CI runs all tests and lints code on each push.

### Conclusion and Overall Frontend Summary

This frontend setup balances speed of development with scalability and maintainability. React’s component model, combined with PWA capabilities and clear styling guidelines, ensures a consistent and reliable user experience. Testing at multiple levels gives confidence in core flows as we gather pilot feedback.

## Implementation Plan

1.  Initialize the codebase using lovable.dev’s PWA starter and set up the repository in GitHub.
2.  Configure CI/CD with GitHub Actions and Docker for containerized builds and deployments.
3.  Build the authentication system: LinkedIn OAuth, email/password, and SMS login flows.
4.  Develop the solo sprint feature: goal input, timers, streak tracking, and milestone badges.
5.  Integrate Socket.IO for real-time timer synchronization and basic chat functionality.
6.  Create session (jam) creation flow with Google Maps location check and Google Calendar sync.
7.  Build the session lobby: attendee teasers, ephemeral chat, host moderation controls.
8.  Implement live sessions: personal and group sprint start/join, emoji reactions, confetti, post-sprint chat.
9.  Add the friends and messaging layer: one-time requests, muted friendship notifications, settings toggles.
10. Build the admin dashboard: metrics display, moderation actions, user and session management.
11. Implement non-functional requirements: response time monitoring, error handling, service worker caching.
12. Write tests: unit, integration, and end-to-end for all critical flows.
13. Perform internal QA, fix bugs, and iterate based on pilot feedback.
14. Deploy MVP to a staging environment, collect analytics, then promote to production.
15. Document the code and hand over for design polish and next-phase feature planning.
