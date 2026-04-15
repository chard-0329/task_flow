# Deployment Guide

This repo is a monorepo:

- `client/` deploys to Vercel.
- `server/` deploys to Railway.
- Railway MySQL stores the production database.

## 1. Railway Backend And MySQL

Create two Railway services:

1. A MySQL database service.
2. A Node.js backend service from this GitHub repo.

For the backend service, set the root directory to:

```text
server
```

Railway can use `server/railway.json`, or you can manually set:

```text
Start command: npm start
```

Set these backend environment variables:

```text
NODE_ENV=production
JWT_SECRET=<generate-a-long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_ORIGINS=https://your-vercel-app.vercel.app
```

Attach or reference the Railway MySQL variables on the backend service. The server supports:

```text
MYSQLHOST
MYSQLPORT
MYSQLUSER
MYSQLPASSWORD
MYSQLDATABASE
```

It also supports the local/XAMPP-style names:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

The backend automatically creates or upgrades the required `students` and `tasks` tables on startup.

After deployment, confirm this URL works:

```text
https://your-railway-backend.up.railway.app/api/health
```

## 2. Vercel Frontend

Create a Vercel project from this GitHub repo and set the root directory to:

```text
client
```

Use the Vite defaults:

```text
Build command: npm run build
Output directory: dist
Install command: npm install
```

Set this Vercel environment variable:

```text
VITE_API_URL=https://your-railway-backend.up.railway.app/api
```

Do not set `VITE_API_URL` to your Vercel frontend URL. The value must be the Railway backend public URL ending in `/api`.

Redeploy Vercel after adding or changing environment variables.

## 3. Required Cross-Origin Settings

Because Vercel and Railway are different origins, the backend must know the Vercel URL.

In Railway:

```text
CLIENT_ORIGINS=https://your-vercel-app.vercel.app
```

Do not include a path such as `/tasks` in `CLIENT_ORIGINS`. CORS receives only the origin, for example `https://task-manage-rho.vercel.app`.

For multiple frontend URLs, separate them with commas:

```text
CLIENT_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

The backend uses secure cross-site cookies in production:

```text
SameSite=None
Secure=true
HttpOnly=true
```

## 4. Production URLs

Frontend:

```text
https://task-manage-rho.vercel.app
```

Backend:

```text
https://taskflow-production-c4a0.up.railway.app/api
```
