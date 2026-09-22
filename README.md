# Pyme Analytics

SaaS de analítica de ventas para comercios independientes. El dashboard usa datos reales de PostgreSQL y puede sincronizar ventas desde Google Sheets.

## Local

```bash
npm ci
npm run dev
```

PostgreSQL local con Docker:

```bash
docker compose up -d db
npx prisma db push
npm run dev
```

## Production

Consultar [docs/deployment.md](docs/deployment.md) y [docs/production-setup.md](docs/production-setup.md).

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start
```

No hay datos demo en producción. Sin ventas sincronizadas, el dashboard muestra un estado vacío.
