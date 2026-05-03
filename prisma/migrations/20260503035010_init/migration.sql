-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TRADER', 'ADMIN');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 10000,
    "role" "Role" NOT NULL DEFAULT 'TRADER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentPrice" DECIMAL(12,2) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("ticker")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "stockTicker" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "quantity" DECIMAL(12,6) NOT NULL,
    "priceAtExecution" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "stockTicker" TEXT NOT NULL,
    "quantity" DECIMAL(12,6) NOT NULL,
    "averagePurchasePrice" DECIMAL(12,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_snapshots" (
    "id" TEXT NOT NULL,
    "stockTicker" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE INDEX "transactions_profileId_idx" ON "transactions"("profileId");

-- CreateIndex
CREATE INDEX "transactions_stockTicker_idx" ON "transactions"("stockTicker");

-- CreateIndex
CREATE INDEX "transactions_timestamp_idx" ON "transactions"("timestamp");

-- CreateIndex
CREATE INDEX "holdings_profileId_idx" ON "holdings"("profileId");

-- CreateIndex
CREATE INDEX "holdings_stockTicker_idx" ON "holdings"("stockTicker");

-- CreateIndex
CREATE UNIQUE INDEX "holdings_profileId_stockTicker_key" ON "holdings"("profileId", "stockTicker");

-- CreateIndex
CREATE INDEX "price_snapshots_stockTicker_idx" ON "price_snapshots"("stockTicker");

-- CreateIndex
CREATE INDEX "price_snapshots_recordedAt_idx" ON "price_snapshots"("recordedAt");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_stockTicker_fkey" FOREIGN KEY ("stockTicker") REFERENCES "stocks"("ticker") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_stockTicker_fkey" FOREIGN KEY ("stockTicker") REFERENCES "stocks"("ticker") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_stockTicker_fkey" FOREIGN KEY ("stockTicker") REFERENCES "stocks"("ticker") ON DELETE CASCADE ON UPDATE CASCADE;
