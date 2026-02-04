FROM node:20-alpine AS base

# FIX 1: Install OpenSSL and libc6-compat globally for all stages
# This fixes the "PrismaClientInitializationError" and missing libssl.so.1.1
RUN apk add --no-cache openssl libc6-compat

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (Now works because OpenSSL is in 'base')
RUN npx prisma generate

# Build the app
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions for nextjs user
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy the generated prisma client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create uploads directory with permissions
RUN mkdir -p ./public/uploads && chown nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]

