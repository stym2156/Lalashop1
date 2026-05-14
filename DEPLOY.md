# Lalashop Deploy Guide

Quick reference for getting the four services into production. Assumes the
backend runs on a container host (Render / Fly / Railway / Kubernetes / your
own VM) and the three Next.js frontends run on Vercel.

---

## Backend (`backend/`)

### Build & run with Docker

```bash
cd backend
docker build -t lalashop-api .
docker run -p 5000:5000 --env-file .env lalashop-api
```

The Dockerfile is multi-stage — final image is ~150 MB on `node:20-alpine`,
runs as a non-root `app` user, and ships a `HEALTHCHECK` against `/healthz`.

### Required env vars (see `backend/.env.example`)

| Var | Notes |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string. Rotate = sign-out everyone |
| `FRONTEND_URL` | OAuth callbacks redirect here. **No trailing slash** |
| `SELLER_DASHBOARD_URL` | KYC approval emails link here |
| `ALLOWED_ORIGINS` | Comma-separated. Backend rejects everything else |
| `R2_*` | Cloudflare R2 credentials for KYC/products/posts/chat |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail SMTP (app password — not your real one) |
| `GOOGLE_CLIENT_ID` / `_SECRET` | OAuth (omit to disable Google login) |

### Health check

`GET /healthz` returns `200` when MongoDB is connected, `503` otherwise.
Wire your platform's liveness probe to this path.

### CORS

`ALLOWED_ORIGINS` is a comma-separated allowlist:

```
ALLOWED_ORIGINS=https://app.lalashop.com,https://admin.lalashop.com,https://seller.lalashop.com
```

Empty/unset = allow all (dev convenience). Never leave empty in prod.

### Rate limiting

`/api/auth/{login,register,seller-login,forgot-password,verify-reset-code,reset-password}`
are limited to 10 attempts / 15 min per IP. If you sit behind Cloudflare /
nginx, set `app.set("trust proxy", 1)` and the express-rate-limit middleware
will read the real client IP from `X-Forwarded-For`.

---

## Three Next.js frontends (`frontend/`, `Admin/`, `seller/`)

All three are stock Next.js apps. Vercel is the easiest target.

### Vercel

1. Import each directory as a separate Vercel project.
2. **Build command** (default): `next build`
3. **Output directory** (default): `.next`
4. **Environment variables** per project:

| Var | Used by | Notes |
|---|---|---|
| `BACKEND_INTERNAL_URL` | `next.config` rewrite | Your backend's public URL, e.g. `https://api.lalashop.com` |
| `NEXT_PUBLIC_API_URL` | client-side `apiClient.ts` | Same backend URL, with `/api` suffix on some clients — check `services/apiClient.ts` |
| `NEXT_PUBLIC_FRONTEND_URL` | seller "open shop" link | Used in `seller/src/pages/login.tsx` |

### Self-host alternative (one Dockerfile each)

If you'd rather containerize the frontends, use Next.js's `output: "standalone"`
in `next.config` and copy `.next/standalone` + `.next/static` + `public/` into a
slim node image. Each app needs its own Dockerfile.

---

## Smoke checks after deploy

```bash
# Backend healthy?
curl -s https://api.lalashop.com/healthz | jq

# CORS allowing your frontend?
curl -s -I -H "Origin: https://app.lalashop.com" https://api.lalashop.com/healthz | grep -i access-control

# Auth rate limit working?
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.lalashop.com/api/auth/login \
    -H 'Content-Type: application/json' -d '{"email":"a@a","password":"x"}'
done
# Last 2 should return 429.
```

---

## Things deliberately NOT in this repo

- Cloudflare R2 bucket setup — create the bucket + bind a public domain manually
- Google OAuth client config — add your prod redirect URIs in Google Console
- MongoDB Atlas IP allowlist — add your container egress IPs
- TLS certificates — terminate at the load balancer / Vercel
