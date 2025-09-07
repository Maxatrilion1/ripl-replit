# Ripl - Coworking Session App

A modern coworking session platform built with React, TypeScript, and Supabase. Connect with focused professionals at cafés and boost your productivity together.

## Features

- **Session Creation**: Step-by-step flow to create coworking sessions
- **Real-time Collaboration**: Live sprint timers and participant tracking
- **Social Features**: Join sessions, react to sprints, and connect with others
- **Authentication**: LinkedIn OAuth and email/password support
- **Mobile-First Design**: Responsive design that works great on all devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Edge Functions)
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for backend services)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ripl-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_GOOGLE_PLACES_API_KEY`: Google Places API key (optional)

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── features/           # Feature-specific components
│   └── session-flow/   # Session creation flow
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/                # Utility functions
├── pages/              # Route components
└── types/              # TypeScript type definitions
```

## Key Features

### Session Creation Flow
- **Step 1**: Choose café/workspace
- **Step 2**: Pick day (smart 6-option picker)
- **Step 3**: Select time (quarter-hour increments)
- **Step 4**: Confirm and create
- **Step 5**: Share link and invite others

### Real-time Features
- Live sprint timers synchronized across all participants
- Real-time participant presence tracking
- Instant reactions and notifications
- Live RSVP count updates

### Authentication
- LinkedIn OAuth integration
- Email/password authentication
- Anonymous guest access (view-only)
- Profile management with avatar uploads

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

Optional:
- `VITE_GOOGLE_PLACES_API_KEY` - For venue search functionality

## Deployment

The app is configured for deployment on modern hosting platforms:

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.