# Doria — Frontend

Frontend single-page application for Doria, an invoice automation platform. This React (Vite) app provides the user interface for authenticating, searching invoices, creating downloadable packages, and managing role-based views. The backend handles OAuth, invoice indexing, ZIP generation, and storage; the frontend focuses on user-facing workflows.

## Key features
- User authentication and session handling (integrates with backend OAuth endpoints)
- Main dashboard with invoice search and filters
- Create and download invoice packages (ZIPs)
- Package history and status tracking
- Admin views for role-based actions and management
- Client-side API calls with Axios and client routing via React Router

## High-level UI flow
1. User signs in (redirect to backend OAuth / sign-in flow).
2. After successful authentication, the app opens the dashboard.
3. User searches/selects invoices and requests package generation.
4. Backend generates and stores ZIPs; frontend shows status in package history.
5. User downloads completed packages from the history page.

## Tech stack
- React (Vite)
- Tailwind CSS
- Axios (HTTP client)
- React Router (client-side routing)
- JavaScript / TypeScript (depending on branch)

## Project structure (high level)
- src/
  - pages/        — top-level routes (Login, Dashboard, History, Admin)
  - components/   — reusable UI components
  - services/     — API clients, authentication helpers
  - hooks/        — custom React hooks
  - styles/       — Tailwind config and global styles
  - assets/       — static files and images
- public/         — static public assets
- vite.config.*   — Vite configuration

(Structure is intentionally high level — see the repo for the full tree.)

## Configuration
The only required runtime configuration for local development is the backend base URL:
- VITE_API_URL — base URL for the backend API (e.g. https://api.example.com)

Do not commit secrets to the repository. Use a local .env file or your environment to provide VITE_API_URL.

## Running locally (quick)
- Install: npm install
- Dev server: npm run dev
- Build: npm run build
- Preview production build: npm run preview

## Status
This frontend is implemented for production-style use and is maintained alongside the backend services. It focuses on user workflows (authentication, search, package generation and downloads) and is designed to operate with the backend that performs OAuth, indexing, ZIP creation, and S3 storage.

## Contributing
Bug reports and pull requests are welcome. Keep changes focused and include a short description of the UI change and any API expectations.
