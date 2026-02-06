# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sarhni is an anonymous messaging/confession platform built with Next.js (App Router), TypeScript, PostgreSQL, and Prisma. Users share a profile link, receive anonymous or public messages, reply, pin favorites, and generate shareable stickers.

**Tech Stack:**
- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL 15 with Prisma ORM
- **Authentication:** NextAuth.js v5
- **Styling:** Tailwind CSS with custom "leather" theme
- **Deployment:** Docker Compose (multi-stage build)

---

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

# Docker Deployment (Production)
docker compose up -d --build    # Build and start full stack (app + PostgreSQL)
docker compose down             # Stop containers
docker compose logs -f app      # View app logs
docker compose exec app sh      # Access container shell
docker compose ps               # Check container status
```

---

## Architecture

### Data Flow Pattern

Server Components fetch data via Prisma directly in `page.tsx` files. Mutations go through **Server Actions** in `lib/actions/*.ts`, which return `{ success: true }` or `{ error: string }`. After mutations, `revalidatePath()` or `revalidateTag()` refreshes cached data. Client components use optimistic updates via the `useConfessionActions` hook for instant UI feedback.

### Directory Structure

```
/opt/sarhni/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   └── uploads/[filename]/   # File upload API
│   ├── (auth)/                   # Auth route group (login/register)
│   ├── dashboard/                # Protected user dashboard
│   ├── admin/                    # Admin-only routes
│   ├── owner/                    # Owner-only routes
│   ├── u/[username]/             # Public user profiles
│   ├── layout.tsx                # Root layout with providers
│   └── globals.css               # Global styles + theme
├── components/                   # React components
│   ├── ui/                       # Reusable UI primitives
│   ├── Confession*.tsx           # Message-related components
│   ├── AdminDashboard.tsx        # Admin interface
│   └── Navbar.tsx                # Navigation
├── lib/                          # Core libraries
│   ├── actions/                  # Server Actions (all "use server")
│   │   ├── auth.ts               # User registration
│   │   ├── confess.ts            # Send message + rate limit
│   │   ├── manage.ts             # Delete/reply/pin operations
│   │   ├── admin.ts              # Ban/promote/delete users
│   │   ├── search.ts             # User search + rate limit
│   │   ├── upload.ts             # Image upload
│   │   └── user.ts               # Profile updates
│   ├── auth.ts                   # NextAuth configuration
│   ├── cache.ts                  # Caching utilities
│   ├── prisma.ts                 # Prisma client singleton
│   ├── rate-limit.ts             # Rate limiting
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utility functions
├── hooks/                        # Custom React hooks
│   └── useConfessionActions.ts   # Optimistic updates manager
├── prisma/
│   └── schema.prisma             # Database schema
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Container orchestration
├── next.config.mjs               # Next.js configuration
└── middleware.ts                 # Route protection middleware
```

---

## Database Schema (Prisma)

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String   // bcrypt hashed
  image     String?  // Profile image URL
  bio       String?  // User bio
  role      Role     @default(USER)
  isBanned  Boolean  @default(false)
  createdAt DateTime @default(now())
  confessions Confession[] @relation("ReceivedConfessions")
  sent       Confession[] @relation("SentConfessions")
}
```

### Confession Model
```prisma
model Confession {
  id           String    @id @default(cuid())
  content      String
  reply        String?
  replyAt      DateTime?
  isPinned     Boolean   @default(false)
  isAnonymous  Boolean   @default(true)
  createdAt    DateTime  @default(now())
  receiverId   String
  receiver     User      @relation("ReceivedConfessions", fields: [receiverId], references: [id], onDelete: Cascade)
  senderId     String?
  sender       User?     @relation("SentConfessions", fields: [senderId], references: [id], onDelete: SetNull)

  @@index([receiverId, isPinned, createdAt]) // Compound index for feed queries
}
```

**Roles:** `USER`, `ADMIN`, `OWNER` (hierarchy: OWNER > ADMIN > USER)

---

## Authentication & Authorization

### NextAuth.js v5 Configuration (`lib/auth.ts`)
- **Provider:** Credentials (username + bcrypt password hashing)
- **Strategy:** JWT with role and ban status in token
- **Session Callback:** Refreshes user data every 5 minutes to catch ban/role changes
- **Ban Enforcement:** Blocked at login and verified in session callback

### Middleware (`middleware.ts`)
- **Protected Routes:** `/dashboard`, `/admin`, `/owner`
- **Redirects:** Authenticated users away from `/login`, `/register`
- **Cookie Detection:** `authjs.session-token`, `__Secure-authjs.session-token`, `next-auth.session-token`

### Role Hierarchy
- **OWNER:** Full access + can promote/demote admins + delete users completely
- **ADMIN:** Can ban users + delete confessions (cannot affect other admins/owners)
- **USER:** Can manage own confessions + profile

---

## Server Actions (`lib/actions/`)

All Server Actions return objects, never throw errors:
- Success: `{ success: true, [key: string]: any }`
- Failure: `{ error: string }`

| Action File | Operations | Key Features |
|-------------|------------|--------------|
| `auth.ts` | User registration | bcrypt hashing, auto-owner promotion |
| `confess.ts` | Send message | IP rate limit (5/60s), anonymous flag |
| `manage.ts` | Delete/reply/pin | Max 3 pinned, optimistic updates |
| `admin.ts` | Ban/promote/delete | Role hierarchy enforcement |
| `search.ts` | User search | IP rate limit (20/60s), filtered results |
| `upload.ts` | Image upload | Magic number verification, 5MB limit |
| `user.ts` | Profile updates | Bio, image management |

---

## Caching Strategy (`lib/cache.ts`)

Uses Next.js `unstable_cache` with tag-based revalidation:

| Data Type | Cache Time | Revalidation |
|-----------|------------|--------------|
| User header | 120s | On profile update |
| Confessions | 60s | On new/delete/pin/reply |
| Admin users | 30s | On role/ban changes |
| Search results | 60s | Tag-based |

---

## Rate Limiting (`lib/rate-limit.ts`)

In-memory IP-based rate limiting using `x-real-ip` header:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Send message | 5 requests | 60 seconds |
| Search | 20 requests | 60 seconds |

Factory pattern for creating independent limiters.

---

## Security Features

### Authentication
- bcrypt password hashing (10 rounds)
- Ban status enforced at multiple layers
- JWT tokens with short expiration
- Session refresh mechanism

### Input Validation
- Zod schemas for all form inputs
- SQL injection prevention via Prisma
- XSS protection via React

### File Upload
- Magic number verification (file type detection)
- 5MB size limit
- Sanitized filenames (UUID-based)
- Type restrictions (images only)

### API Security
- IP-based rate limiting
- CORS configuration
- Security headers (X-Frame-Options, CSP, Referrer-Policy)

---

## Docker Deployment

### Dockerfile (Multi-stage)
```dockerfile
# Stage 1: Base
FROM node:20-alpine (with OpenSSL)

# Stage 2: Dependencies
npm ci (frozen-lockfile)

# Stage 3: Builder
Prisma generate + Next.js build (standalone)

# Stage 4: Runner
Non-root user (nextjs:1001)
Node environment: production
```

### Docker Compose Services
1. **app:** Next.js application
   - Port: 3000
   - Depends on: PostgreSQL (with healthcheck)
   - Restart: unless-stopped
   - Volume: `./public/uploads:/app/public/uploads`

2. **postgres:** PostgreSQL 15-Alpine
   - Port: 5432
   - Healthcheck: pg_isready
   - Volume: `postgres_data:/var/lib/postgresql/data`

### Environment Variables for Docker
```env
# Application
DATABASE_URL=postgresql://USER:PASSWORD@postgres:5432/DATABASE
AUTH_SECRET=your-secret-key
NEXT_PUBLIC_URL=https://your-domain.com
OWNER_USERNAME=optional-auto-owner

# Database (for postgres container)
POSTGRES_USER=sarhni
POSTGRES_PASSWORD=secure-password
POSTGRES_DB=sarhni
```

### Production Deployment Steps
```bash
1. Set environment variables in .env file
2. Run: docker compose up -d --build
3. Run: docker compose exec app npx prisma migrate deploy
4. Access at: http://localhost:3000
```

---

## Styling & Theme

### Custom "Leather" Theme Palette
```css
leather-900: #2C1A1D  /* Deep espresso (background) */
leather-800: #3E2723  /* Saddle brown (cards) */
leather-700: #4E342E  /* Milk chocolate (borders) */
leather-pop: #FFB74D  /* Burnt orange (CTAs) */
leather-accent: #D7CCC8  /* Creamy latte (text) */
```

### Typography
- **Primary:** Varela Round (headings)
- **Secondary:** Tajawal (body)

### Utilities
- `cn()` from `lib/utils.ts` for conditional class merging
- Tailwind CSS for all styling
- Custom animations (glitch effect)

---

## Key Components

### ConfessionCard
- Displays individual messages
- Pin indicators (max 3)
- Delete/reply/share actions
- Sticker generation (html2canvas)
- Anonymous sender display

### ConfessionFeed
- Infinite scroll (Intersection Observer)
- Grid/list layout toggle
- Empty states
- Optimistic updates integration

### AdminDashboard
- User management (ban/promote/delete)
- Role-based action visibility
- Search functionality

---

## Conventions

### Code Organization
- **Server Components by default** - Only add `"use client"` for hooks/event listeners
- **Server Actions for mutations** - Must return objects, never throw
- **Zod validation first** - Validate before any database operation
- **Components:** PascalCase filenames
- **Utilities/actions:** camelCase filenames
- **Path alias:** `@/*` maps to project root

### Performance Patterns
- Use `unstable_cache` for expensive queries
- Implement optimistic UI updates
- Revalidate cache tags after mutations
- Use Suspense boundaries for streaming

### Security Patterns
- Never trust client input (always validate with Zod)
- Check authorization (role/ban status) before actions
- Use Prisma for SQL injection prevention
- Implement rate limiting on public endpoints

---

## Configuration Files

### next.config.mjs
- Standalone output for Docker
- Server Actions body size: 5MB
- Image optimization: localhost + sarhni.zhrworld.com
- Security headers enabled

### tailwind.config.ts
- Custom color palette
- Font families configured
- Custom animations defined
- Background texture support

### tsconfig.json
- Path aliases: `@/*`
- Strict mode enabled
- ES2020 target
