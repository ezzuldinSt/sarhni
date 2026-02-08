# Vercel Migration Summary

This document summarizes all code changes made to migrate Sarhni from Docker-based deployment to Vercel.

## Overview of Changes

### Files Modified

| File | Changes | Reason |
|------|---------|--------|
| `lib/prisma.ts` | Removed redundant datasources config, updated logging | Prisma auto-reads env vars; optimized for serverless |
| `prisma/schema.prisma` | Updated binaryTargets, added DIRECT_URL documentation | Vercel handles binary automatically |
| `lib/actions/confess.ts` | Added Vercel IP header support | `x-vercel-forwarded-for` header |
| `lib/actions/search.ts` | Added Vercel IP header support | `x-vercel-forwarded-for` header |
| `lib/actions/auth.ts` | **CRITICAL BUG FIX:** Added Vercel IP header to registerUser/loginUser | Fixed global rate limit bug affecting all users |
| `lib/rate-limit.ts` | Added serverless documentation, new utility | Documented limitations, added `getRateLimitStatus()` |
| `lib/actions/user.ts` | Updated deleteProfileImage to use Vercel Blob | Replaced filesystem operations with `del()` from `@vercel/blob` |
| `.env.example` | Updated with .env.local documentation and Vercel-specific instructions | Clarified environment variable priority and usage |

### Files Previously Modified (Earlier Session)

| File | Changes |
|------|---------|
| `next.config.mjs` | Removed `standalone` output, added Blob domain |
| `lib/actions/upload.ts` | Replaced local filesystem with Vercel Blob |
| `package.json` | Added `@vercel/blob` dependency |
| `vercel.json` | Created Vercel build config |
| `.env.example` | Created environment variable docs |
| `app/api/uploads/[filename]/route.ts` | Removed (no longer needed) |
| `scripts/migrate-uploads.js` | Created file migration script |

---

## Detailed Changes

### 1. lib/prisma.ts

**Before:**
```typescript
new PrismaClient({
  log: process.env.NODE_ENV === 'production'
    ? ['error']
    : ['warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Redundant!
    },
  },
})
```

**After:**
```typescript
new PrismaClient({
  log: process.env.NODE_ENV === 'production'
    ? ['error', 'warn']
    : ['query', 'info', 'warn', 'error'],
  // datasources removed - Prisma auto-reads DATABASE_URL
})
```

**Why:** Prisma automatically reads `DATABASE_URL` from environment. The `datasources` override was redundant and could cause issues.

---

### 2. prisma/schema.prisma

**Before:**
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"] // Docker-specific
}
```

**After:**
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native"] // Vercel handles the rest
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL") // Required for Vercel Postgres migrations
}
```

**Why:** Vercel automatically uses the correct binary for the platform. The `directUrl` is required for Prisma migrations on Vercel Postgres.

---

### 3. IP Detection (confess.ts & search.ts)

**Before:**
```typescript
let ip = headerList.get("x-real-ip");
if (!ip) {
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
        ip = forwarded.split(",")[0].trim();
    }
}
```

**After:**
```typescript
let ip = headerList.get("x-vercel-forwarded-for") ||    // Vercel's trusted header
         headerList.get("x-real-ip") ||                   // Docker/nginx standard
         headerList.get("x-forwarded-for")?.split(",")[0].trim(); // Fallback
```

**Why:** Vercel provides the `x-vercel-forwarded-for` header which contains the actual client IP address.

---

### 4. lib/rate-limit.ts

Added comprehensive documentation about serverless limitations and a new utility function:

```typescript
/**
 * Get current rate limit status for an IP
 */
export function getRateLimitStatus(ip: string) {
  const record = rateLimitMap.get(ip);
  const now = Date.now();

  if (!record || now > record.resetTime) {
    return {
      remaining: MAX_REQUESTS,
      resetAt: now + WINDOW_SIZE
    };
  }

  return {
    remaining: Math.max(0, MAX_REQUESTS - record.count),
    resetAt: record.resetTime
  };
}
```

**Why:** In-memory rate limiting has limitations on serverless (stateless executions). Added documentation and utility for future improvements.

---

### 5. lib/actions/user.ts

**Before (deleteProfileImage):**
```typescript
import fs from "node:fs/promises";
import path from "node:path";

// Delete file from filesystem
try {
  const filePath = path.join(process.cwd(), "public", "uploads", filename);
  await fs.unlink(filePath);
} catch (error) {
  // Handle filesystem errors
}
```

**After:**
```typescript
import { del } from "@vercel/blob";

// Delete from Vercel Blob Storage (if it's a Blob URL)
if (user.image.includes('blob.vercel-storage.com')) {
  try {
    await del(user.image);
  } catch (error) {
    // Log but don't fail - blob might already be deleted
    console.warn(`Failed to delete blob: ${error}`);
  }
}
```

**Why:** Vercel Blob Storage doesn't use the local filesystem. The `del()` function from `@vercel/blob` removes files from Vercel's CDN. The token is auto-detected from `BLOB_READ_WRITE_TOKEN` environment variable.

---

### 6. .env.example Updates

**Before:**
```bash
# Copy this file to .env and fill in the values
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

**After:**
```bash
# LOCAL DEVELOPMENT (Vercel):
#   1. Run: vercel env pull .env.local
#   2. This downloads all env vars from your Vercel project
#   3. .env.local is gitignored and used by Next.js automatically

# PRIORITY ORDER (Next.js loads in this order):
#   1. .env.$(NODE_ENV).local (e.g., .env.production.local)
#   2. .env.local (recommended for local development with Vercel)
#   3. .env.$(NODE_ENV) (e.g., .env.production)
#   4. .env (fallback, also used by Docker Compose)

DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

**Why:** Next.js automatically loads `.env.local` for local development. Using `vercel env pull .env.local` keeps your local environment in sync with Vercel without manual configuration.

---

### 7. lib/actions/auth.ts - Critical Bug Fix (Registration/Login Rate Limiting)

**Issue Found (Feb 8, 2026):**
After Vercel migration, registration and login were failing for all users due to rate limiting being applied globally instead of per-IP.

**Root Cause:**
The `registerUser()` and `loginUser()` functions only checked `x-real-ip` header for IP detection. On Vercel, this header is not set; instead, `x-vercel-forwarded-for` is used. This caused all users to be assigned IP = "unknown", sharing the same rate limit bucket.

**Before:**
```typescript
// registerUser (line 24-25)
const headerList = await headers();
let ip = headerList.get("x-real-ip") || "unknown";

// loginUser (lines 70-81)
const headerList = await headers();
let ip = headerList.get("x-real-ip");
if (!ip) {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    ip = forwarded.split(",")[0].trim();
  }
}
ip = ip || "unknown";
```

**After:**
```typescript
// registerUser - Now supports Vercel header
const headerList = await headers();
let ip = headerList.get("x-vercel-forwarded-for") ||  // Vercel's trusted header
         headerList.get("x-real-ip") ||                  // Docker/nginx standard
         "unknown";

// loginUser - Updated with Vercel support
const headerList = await headers();
let ip = headerList.get("x-vercel-forwarded-for") ||  // Vercel's trusted header
         headerList.get("x-real-ip");                  // Docker/nginx standard
if (!ip) {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    ip = forwarded.split(",")[0].trim();
  }
}
ip = ip || "unknown";
```

**Why:** This ensures rate limiting works correctly on Vercel by detecting real user IPs instead of lumping everyone into the "unknown" bucket. The fix maintains backward compatibility with Docker/nginx deployments.

**Impact:** After this fix, each user gets their own rate limit bucket (3 registrations/hour, 5 logins/15min) instead of sharing a global bucket.

---

## Environment Variables for Vercel

Add these in Vercel Dashboard > Settings > Environment Variables:

| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | Pooled connection (PgBouncer) | Vercel Postgres |
| `DIRECT_URL` | Direct connection (for migrations) | Vercel Postgres |
| `BLOB_READ_WRITE_TOKEN` | Blob storage access token | Vercel Blob |
| `AUTH_SECRET` | NextAuth JWT secret | Generate or reuse |
| `NEXTAUTH_URL` | Auth callback URL | Your domain |
| `NEXT_PUBLIC_URL` | Public app URL | Your domain |
| `OWNER_USERNAME` | Auto-owner username | Optional |

---

## Deployment Steps

1. **Create Vercel project:**
   ```bash
   vercel login
   vercel link
   ```

2. **Create Vercel Postgres database:**
   - Dashboard > Storage > Create Database > Postgres

3. **Create Vercel Blob storage:**
   - Dashboard > Storage > Create Store > Blob

4. **Set environment variables** (see table above)

5. **Deploy to preview:**
   ```bash
   vercel
   ```

6. **Test preview URL**, then deploy to production:
   ```bash
   vercel --prod
   ```

---

## Migration Scripts

### Database Migration

```bash
# Export from Docker
docker compose exec -T db pg_dump -U sarhni sarhni_db > backup.sql

# Import to Vercel Postgres
psql $DATABASE_URL < backup.sql
```

### File Migration

```bash
# Install dependencies
npm install @vercel/blob

# Set token
export BLOB_READ_WRITE_TOKEN="your_token"

# Run migration
node scripts/migrate-uploads.js

# Update database URLs
UPDATE "User"
SET image = REPLACE(image, '/api/uploads/', 'https://YOUR_BLOB_STORE_URL.public.blob.vercel-storage.com/')
WHERE image LIKE '/api/uploads/%';
```

---

## Known Limitations & Recommendations

### Rate Limiting on Serverless

The current in-memory rate limiting works within a single serverless function execution but resets on cold starts. For production:

1. **Vercel Firewall** (Pro plan+) - Best for DDoS protection
2. **Upstash Redis** - Global distributed rate limiting
3. **Database-backed** - Use Prisma with RateLimiter model

### Connection Pooling

Vercel Postgres uses PgBouncer connection pooling automatically via `DATABASE_URL`. No additional configuration needed.

---

## Sources

- [Vercel KB: Next.js + Prisma + Postgres](https://vercel.com/kb/guide/nextjs-prisma-postgres)
- [Vercel Blob: Server Uploads](https://vercel.com/docs/vercel-blob/server-upload)
- [Prisma: Shadow Database](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-databases)
- [Connection Pooling with Vercel Functions](https://vercel.com/kb/guide/connection-pooling-with-functions)
- [Prisma for Vercel](https://vercel.com/marketplace/prisma)

---

## Rollback Strategy

If issues arise:

1. **Immediate (1 hour):** Update DNS CNAME back to Docker server
2. **Short-term (24 hours):** Export Vercel data, import back to Docker
3. **Keep Docker running** during migration window for zero-downtime rollback
