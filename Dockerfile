# syntax=docker/dockerfile:1

# ---- base ----
FROM node:26-bookworm-slim AS base
WORKDIR /app

# ---- deps (incl. dev, needed to build) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/data
RUN groupadd -r app && useradd -r -g app app \
    && mkdir -p /data && chown -R app:app /data

# Next.js standalone server + its traced node_modules (incl. native libSQL).
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

USER app
EXPOSE 3000
VOLUME ["/data"]

# Simple Node-based healthcheck (no curl/wget in the slim image).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
