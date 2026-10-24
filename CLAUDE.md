# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack hackathon project with:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (browser-based SPA)
- **Backend**: Node.js/Express 5 + TypeScript with Zod validation and Helmet security

The project is organized as two separate npm projects (backend/ and frontend/) that communicate via HTTP. Both use modern TypeScript with strict mode enabled and ESLint.

## Common Commands

### Frontend (from `frontend/` directory)
- `npm run dev` — Start Vite dev server with HMR (http://localhost:5173 by default)
- `npm run build` — Compile TypeScript and build with Vite for production
- `npm run lint` — Run ESLint on source files
- `npm run preview` — Preview production build locally

### Backend (from `backend/` directory)
- `npm run dev` — Start development server with tsx watch (auto-reload on file changes)
- `npm run build` — Compile TypeScript from src/ to dist/
- `npm run start` — Run compiled server from dist/server.js
- `npm run typecheck` — Check TypeScript types without building
- `npm run lint` — Run ESLint on source files

**Note**: Both projects need dependencies installed first. Run `npm install` in each directory.

## Architecture

### Tech Stack Summary
- **Frontend**: Vite (bundler with instant HMR), React hooks, Tailwind CSS with Vite plugin, flat ESLint config
- **Backend**: Express, Zod for schema validation, Helmet for HTTP security headers, CORS enabled for frontend communication, tsx for dev-time TypeScript execution

### Key Design Decisions
1. **Vite-based frontend** — Modern, fast bundler with near-instant module reloading during development
2. **TypeScript strict mode** — Both projects use strict tsconfig for comprehensive type safety
3. **Monorepo TypeScript setup** — tsconfig.json references used for multi-config composition (frontend has app + node configs)
4. **Runtime validation with Zod** — Backend uses Zod schemas for runtime validation of inputs
5. **Security-first backend** — Helmet middleware applied for HTTP header security, CORS configured for frontend access
6. **Development workflow** — Backend uses tsx watch for instant reload; frontend uses Vite HMR. Both support hot reloading for rapid iteration

### Directory Structure
```
backend/
├── src/              (TypeScript source, currently empty - add server.ts here)
├── dist/             (Compiled JavaScript output)
├── package.json      (Node.js ES2022 target)
└── tsconfig.json

frontend/
├── src/
│   ├── App.tsx       (Root component, currently demo counter)
│   ├── main.tsx      (React entry point with StrictMode)
│   ├── App.css
│   ├── index.css
│   └── assets/       (Images and SVGs)
├── public/           (Static assets served as-is)
├── index.html        (HTML template with root div)
├── vite.config.ts    (Vite config with React + Tailwind plugins)
├── eslint.config.js  (Flat config format)
└── tsconfig.json     (ES2023 target, includes references)
```

### Backend Setup Notes
- Create `src/server.ts` as the entry point (Express.js server)
- Environment variables go in `.env` file (gitignored)
- Helmet and CORS are already in dependencies and should be configured in server setup
- Build step compiles to `dist/` which `npm start` runs

### Frontend Setup Notes
- Vite config already includes React and Tailwind plugins
- ESLint uses flat config format for better composability
- Static files in `public/` are served at root; assets in `src/assets/` are bundled
- Tailwind CSS is ready to use with utilities in `index.css`

## Development Workflow

1. **Frontend development**: `cd frontend && npm run dev` — Vite will start hot reloading server
2. **Backend development**: `cd backend && npm run dev` — tsx will watch and restart on changes
3. **Type checking**: `npm run typecheck` (backend) to verify types without building
4. **Linting**: `npm run lint` in either directory to check code quality
5. **Production build**: `npm run build` in both directories, then `npm start` for backend

## Important Notes

- **No test setup**: Neither project has Jest, Vitest, or other test runners configured yet
- **No CI/CD**: No GitHub Actions workflows; you'll need to set these up if needed
- **Early stage**: Backend src/ is empty; frontend is a starter template. Both have solid configuration foundations
- **Package manager**: Uses npm (with package-lock.json). Keep version consistency between frontend and backend
