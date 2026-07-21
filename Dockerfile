# syntax=docker/dockerfile:1

# Multi-stage production image for Render (single instance + persistent disk).
# Does not use Next.js standalone output: migrate/seed scripts, Drizzle SQL,
# generated framework JSON, and the pinned OSCAL SSP schema must remain on disk.

FROM node:22-bookworm-slim AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build \
  && npm prune --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Render sets PORT; default for local docker run
ENV PORT=3000
# Render must override this to the persistent disk path
ENV DATABASE_PATH=/var/data/oscal-author.db

RUN apt-get update \
  && apt-get install -y --no-install-recommends libstdc++6 \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /var/data \
  && chown nextjs:nodejs /var/data

# App runtime (Next.js)
COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./

# Production startup needs migrate/seed sources + Drizzle SQL + OSCAL schema
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/vendor/oscal/v1.2.2/schema ./vendor/oscal/v1.2.2/schema

USER nextjs

EXPOSE 3000

# Preserve /var/data for Render persistent disk mounts
VOLUME ["/var/data"]

CMD ["npm", "start"]
