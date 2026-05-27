# ── Stage 1: build the React app ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY src/package.json src/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY src/ .

ARG VITE_API_BASE_URL=/api
ARG VITE_SITE_URL=https://koboko.dev
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

RUN pnpm build

# ── Stage 2: serve via nginx ───────────────────────────────────────────────────
FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1
