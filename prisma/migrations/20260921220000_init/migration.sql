-- Initial production schema
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN');
CREATE TYPE "BusinessIndustry" AS ENUM ('LIBRARY', 'KIOSK', 'HARDWARE', 'OTHER');
CREATE TYPE "SheetStatus" AS ENUM ('PENDING', 'OK', 'ERROR');
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('FREE', 'ACTIVE', 'CANCELED', 'PAST_DUE');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'MERCADO_PAGO', 'OTHER');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'OWNER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "sessions" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

CREATE TABLE "businesses" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "industry" "BusinessIndustry" NOT NULL,
  "address" TEXT,
  "size" TEXT,
  "plan" TEXT NOT NULL DEFAULT 'free',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sheet_connections" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "googleSheetId" TEXT NOT NULL,
  "sheetUrl" TEXT NOT NULL,
  "lastSyncedAt" TIMESTAMP(3),
  "lastModifiedTime" TIMESTAMP(3),
  "status" "SheetStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sheet_connections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sheet_connections_businessId_key" ON "sheet_connections"("businessId");

CREATE TABLE "sales" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "saleDate" TIMESTAMP(3) NOT NULL,
  "product" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "paymentMethod" "PaymentMethod",
  "unitCost" DOUBLE PRECISION,
  "sourceRowNumber" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sync_logs" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "rowsRead" INTEGER NOT NULL DEFAULT 0,
  "rowsValid" INTEGER NOT NULL DEFAULT 0,
  "rowsInvalid" INTEGER NOT NULL DEFAULT 0,
  "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sync_errors" (
  "id" TEXT NOT NULL,
  "syncLogId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "column" TEXT,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_errors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "industry_templates" (
  "id" TEXT NOT NULL,
  "industry" "BusinessIndustry" NOT NULL,
  "templateSheetId" TEXT,
  "columnConfig" JSONB NOT NULL,
  "kpiConfig" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "industry_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "industry_templates_industry_key" ON "industry_templates"("industry");

CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'FREE',
  "providerRef" TEXT,
  "currentPeriodEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_preferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "weeklySummary" BOOLEAN NOT NULL DEFAULT true,
  "salesDropAlert" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");
CREATE UNIQUE INDEX "notification_preferences_businessId_key" ON "notification_preferences"("businessId");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sheet_connections" ADD CONSTRAINT "sheet_connections_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sync_errors" ADD CONSTRAINT "sync_errors_syncLogId_fkey" FOREIGN KEY ("syncLogId") REFERENCES "sync_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

