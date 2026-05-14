# ─── Stage 1: build TS → JS in dist/ ──────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Copy manifests first so npm ci can cache the layer when src/ changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Stage 2: runtime image — production deps only ───────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Run as non-root for safety.
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 5000

# Optional but recommended — the orchestrator can hit /healthz.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:5000/healthz || exit 1

CMD ["node", "dist/app.js"]
