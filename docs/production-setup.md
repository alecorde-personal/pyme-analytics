# Production setup

## Database

Set `DATABASE_URL` to the PostgreSQL database used by the deployment, then run:

```powershell
npm exec prisma migrate deploy
npm exec prisma generate
```

Do not use `prisma db push` in production after the first deployment. Create and review migrations with `prisma migrate dev` locally.

## Google Sheets

The backend uses a Google service account to read connected spreadsheets.

1. Create a service account in Google Cloud.
2. Enable the Google Sheets API.
3. Put the service account email in `GOOGLE_CLIENT_EMAIL`.
4. Put the private key in `GOOGLE_PRIVATE_KEY`, preserving newlines as `\\n` in `.env`.
5. Share each sales spreadsheet with the service account email as Viewer.
6. In the dashboard, paste the spreadsheet URL and choose `Conectar hoja`.
7. Choose `Sincronizar ventas` to validate and import the rows.

Required headers:

```text
fecha,producto,categoria,cantidad,precioUnitario
```

Optional headers:

```text
medioDePago,costoUnitario
```

Valid categories: `Infantil`, `Juvenil`, `Novela`, `Texto escolar`, `Papelería`, `Otros`.

Valid payment methods: `Efectivo`, `Débito`, `Crédito`, `Transferencia`, `Mercado Pago`, `Otro`.

Each sync creates a `SyncLog`. Invalid rows are stored as `SyncError` records and are not imported. A successful sync replaces the business sales snapshot atomically, so a partial import cannot reach the dashboard.
