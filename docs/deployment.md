# Production deployment

## Required services

- PostgreSQL 16+
- Node.js 20+ or the included Docker image
- Google Sheets service account credentials for synchronization

## Environment

Copy `.env.example` to the deployment secret store. Never commit `.env`.

Required values:

```text
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
```

## Docker

Build and run the application:

```bash
docker build -t pyme:latest .
docker run --env-file .env.production -p 3000:3000 pyme:latest
```

Run migrations before starting the application:

```bash
npx prisma migrate deploy
```

The deployment health endpoint is `/api/health`. It returns HTTP 200 only when PostgreSQL is reachable.

## GitHub Actions

The workflow at `.github/workflows/ci.yml` runs on pushes and pull requests to `main` and `master`. It starts PostgreSQL, generates Prisma Client, checks types, runs tests, and builds Next.js.

The workflow at `.github/workflows/docker.yml` publishes `ghcr.io/OWNER/REPOSITORY` on pushes to `main` and version tags. The server can pull that image and run it with the production environment file.

## GitHub

Create an empty repository, then run from this folder:

```bash
git init
git add .
git commit -m "Prepare production deployment"
git branch -M main
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
```

Use a GitHub token or SSH key for the push. Do not put credentials in the repository or in the remote URL.
