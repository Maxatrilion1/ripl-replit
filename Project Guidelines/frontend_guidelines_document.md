# Frontend Guideline Document

Welcome to the Ripl frontend guidelines. This document explains how our web app is built, styled, and organized. It’s written in simple terms so anyone—technical or not—can understand how things fit together.

## Frontend Architecture

**What we use:**
- React: our main library for building user interfaces.
- PWA support: Service Workers and a web app manifest to let Ripl behave like an app on your phone or desktop.
- CSS Modules / Plain CSS: for writing scoped, easy-to-manage styles.
- lovable.dev: AI-powered scaffolding tool that helps kickstart components.

**How it’s organized:**
- **Entry point (index.js)** loads the root React component, sets up the Service Worker, and mounts the app.
- **Components folder** holds reusable pieces of UI (buttons, cards, timers).
- **Pages folder** groups higher-level screens (Home, Sprint, Jam Lobby, Admin Dashboard).
- **Services folder** contains helpers for calling back-end APIs, working with Socket.IO, and integrating Google APIs.
- **Assets folder** stores images, icons, and fonts.

**Why this works:**
- **Scalability:** React’s component model means we can add new features without rewriting everything. CSS Modules keep styles local so they don’t clash.
- **Maintainability:** Our clear folder structure and consistent use of lovable.dev make it easy for new developers to find and update code.
- **Performance:** PWA features, code splitting, and lazy loading ensure fast load times and smooth interactions.

## Design Principles

1. **Usability:** Interfaces are simple and self-explanatory. Buttons and links look clickable, and feedback (like loading spinners) appears instantly.
2. **Accessibility:** We follow WCAG guidelines—using proper contrast ratios, keyboard navigation, and screen-reader labels.
3. **Responsiveness:** The app works on phones, tablets, and desktops. Layouts adapt with flexible grids and media queries.
4. **Consistency:** Colors, typography, and component styles stay uniform across the app.

*How we apply these:*
- All interactive elements have `aria-labels` and focus outlines.
- The layout grid shifts from one column on mobile to two or three on desktop.
- Primary actions look the same everywhere—same color, shape, and hover effect.

## Styling and Theming

**Approach:**
- CSS Modules for scoped styles. Plain CSS where global styles or resets are needed.
- No heavy frameworks—this keeps our bundle size small.

**Style flavor:** Modern flat design with subtle glassmorphism touches (soft shadows and slight transparency on cards).

**Color palette:**
- Background: #EFEDE1 (off-white)
- Primary blue shades:
  - Light: #B0E2E8
  - Mid: #7FB0B6
  - Dark button: #508086
- Accent orange shades:
  - Light: #FFC081
  - Mid: #FF8F53
  - Dark button: #C76026
- Text: #10263E (dark slate blue)

**Font:**
- We use “Inter” for its readability and modern look. Headings are semi-bold, body text is regular.

**Theming:**
- All colors and font sizes live in a central `theme.css` (or `theme.module.css`) file.
- To tweak the theme, update variables there and the rest of the app adapts.

## Component Structure

- **Atomic components:** Buttons, Inputs, Cards, Icons—pure UI pieces with minimal logic.
- **Molecules:** Combinations like `SprintTimer` (timer + controls), `UserAvatar` (image + status badge).
- **Organisms:** Larger sections like `JamLobbyList`, `ChatWindow`, or `FriendsSidebar`.
- **Pages:** Complete screens assembled from these building blocks.

**Why this helps:**
- Promotes reuse—no duplicate code.
- Simplifies testing—each small component can be tested on its own.
- Makes updates easy—change a button style in one file and it updates everywhere.

## State Management

- **Local state:** React’s `useState` and `useReducer` inside components for things like form inputs or toggles.
- **Shared state:** React Context API to share user info, jam session data, and theme settings across the app.
- **Real-time updates:** Socket.IO events feed into context or local state, so timers, chats, and participant lists update live.

Flow example:
1. User joins a jam → event from Socket.IO updates `JamContext`.
2. All components subscribed to `JamContext` refresh automatically.

## Routing and Navigation

- **Library:** React Router.
- **Structure:**
  - `/` → Home / Dashboard
  - `/sprint` → Solo Sprint screen
  - `/jam/:id` → Jam session page (lobby or live sprint)
  - `/friends` → Friends & social settings
  - `/admin` → Admin dashboard (metrics & moderation)
  - Fallback `*` → 404 Not Found

**Linking:**
- `<Link>` and `<NavLink>` components for client-side navigation (no full page reloads).
- Protected routes wrap with an authentication check to redirect unauthorized users to login.

## Performance Optimization

1. **Code splitting:** React.lazy and dynamic imports to load pages only when needed.
2. **Lazy loading images:** Only load avatar images when they scroll into view.
3. **Asset optimization:** Compress icons and use SVGs where possible.
4. **PWA caching:** Service Workers cache static assets and API responses for offline support and blazing-fast reloads.
5. **Debouncing inputs:** Prevent spamming API calls during typing.

These measures keep Ripl snappy, even on slower networks.

## Testing and Quality Assurance

- **Unit tests:** Jest + React Testing Library for components, hooks, and utility functions.
- **Integration tests:** Focus on key flows—login, session creation, sprint timer—using React Testing Library.
- **End-to-end tests:** Cypress to simulate real user behavior (joining a jam, sending chat messages, syncing calendar).
- **Linting & formatting:** ESLint and Prettier enforce code style and catch errors before commits.
- **CI/CD checks:** GitHub Actions run tests and linting on every pull request. Builds fail early if something breaks.

## Conclusion and Overall Frontend Summary

Ripl’s frontend is built with React and PWA best practices, styled with a modern flat look enhanced by subtle glassmorphism. We keep code modular with CSS Modules, a clear component hierarchy, and share state via React Context and Socket.IO for real-time features. Routing is handled by React Router, and performance is optimized with lazy loading, code splitting, and caching. Testing spans unit, integration, and end-to-end layers, all automated in our CI pipeline.

These guidelines ensure Ripl remains scalable, maintainable, and fast—delivering a seamless coworking and productivity experience to users.
