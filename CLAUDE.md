# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sarhni is an anonymous messaging/confession platform built with Next.js (App Router), TypeScript, PostgreSQL, and Prisma. Users share a profile link, receive anonymous or public messages, reply, pin favorites, and generate shareable stickers.

## Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000
npm run build            # Production build (standalone output)
npm run start            # Start production server
npm run lint             # ESLint

# Database
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:push      # Push schema changes to database (dev)

# Docker
docker compose up -d --build   # Build and start full stack (app + PostgreSQL)
docker compose down            # Stop containers
```

## Architecture

### Data Flow Pattern

Server Components fetch data via Prisma directly in `page.tsx` files. Mutations go through **Server Actions** in `lib/actions/*.ts`, which return `{ success: true }` or `{ error: string }`. After mutations, `revalidatePath()` refreshes cached data. Client components use optimistic updates via the `useConfessionActions` hook.

### Key Directories

- **`app/`** - Next.js App Router pages. Route groups: `(auth)` for login/register, `u/[username]` for public profiles, `dashboard` for authenticated inbox, `admin` and `owner` for role-protected management.
- **`lib/actions/`** - All Server Actions (mutations). Each file is `"use server"`. Actions: `auth.ts` (registration), `confess.ts` (send message + rate limit), `manage.ts` (delete/reply/pin), `admin.ts` (ban/promote/delete users), `user.ts` (profile updates), `search.ts` (user search), `upload.ts` (image upload).
- **`lib/auth.ts`** - NextAuth.js v5 config. Credentials provider with JWT strategy. Session callback fetches fresh user data (role, ban status) on every request.
- **`lib/rate-limit.ts`** - In-memory IP-based rate limiter (5 requests/60 seconds).
- **`components/`** - React components. `ui/` has reusable primitives (Button, Card, Switch). Feature components handle confessions, feeds, sticker generation, admin dashboard.
- **`hooks/useConfessionActions.ts`** - Manages optimistic updates for pin/delete/reply operations.
- **`middleware.ts`** - Route middleware. Protects `/dashboard`, `/admin`, `/owner`; redirects authenticated users away from `/login`, `/register`.

### Database Schema (Prisma)

Two models: `User` and `Confession`. Three roles: `USER`, `ADMIN`, `OWNER`. Confessions have optional `senderId` (null for anonymous). Cascade deletes on user removal. Compound index on `(receiverId, isPinned, createdAt)` for efficient feed queries.

### Authentication & Authorization

- NextAuth.js v5 with Credentials provider (username/password, bcrypt hashing)
- JWT-based sessions with role stored in token
- Banned users blocked at login and checked in session callback
- Role hierarchy: OWNER > ADMIN > USER. Admins cannot ban other admins/owners.
- Cookie names checked: `authjs.session-token`, `__Secure-authjs.session-token`, `next-auth.session-token`

## Conventions

- **Server Components by default.** Only add `"use client"` when hooks or event listeners are needed.
- **Server Actions** handle all mutations - must return serializable objects, never throw.
- **Validation** with Zod schemas in server actions before any database operation.
- **Styling:** Tailwind CSS with custom "leather" theme palette (`leather-900`, `leather-800`, `leather-700`, `leather-pop`, `leather-accent`). Use `cn()` from `lib/utils.ts` for conditional class merging.
- **Components:** PascalCase filenames. **Utilities/actions:** camelCase filenames.
- **Path alias:** `@/*` maps to project root.
- **Prisma client:** Singleton pattern in `lib/prisma.ts`. Binary targets include `linux-musl-openssl-3.0.x` for Alpine/Docker.

## Environment Variables

Required: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_URL`. For Docker: also `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.

## Docker

Multi-stage Dockerfile using `node:20-alpine`. Standalone Next.js output mode. Runs as non-root user `nextjs` (uid 1001). PostgreSQL 15-Alpine with healthcheck in docker-compose. Upload files persisted via volume mount at `public/uploads`.
