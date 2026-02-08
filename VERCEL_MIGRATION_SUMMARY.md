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
| `lib/rate-limit.ts` | Added serverless documentation, new utility | Documented limitations, added `getRateLimitStatus()` |

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
