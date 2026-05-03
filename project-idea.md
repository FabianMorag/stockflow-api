# Project Brief: StockFlow - Financial Simulator & Portfolio Tracker

## 1. Project Context

Develop a "Paper Trading" stock market simulator where users receive a fictional initial balance to invest in real-world assets. The system must manage transactions, calculate net worth in real-time, and provide performance metrics.

## 2. Tech Stack & Infrastructure

- **Backend Framework:** NestJS.
- **ORM:** Prisma (connected to PostgreSQL).
- **Database:**
  - **Production:** Supabase (PostgreSQL) with Row Level Security (RLS) and Auth.
  - **Local Development:** PostgreSQL via Docker Compose for rapid prototyping.
- **Communication:** WebSockets (`@nestjs/websockets`) for real-time price streaming.
- **Scheduled Tasks:** NestJS Schedule (`cron`) for market data fetching.
- **Deployment:** Vercel (Frontend/API).

## 3. Data Architecture (Core Entities)

- **Profiles:** Extends `auth.users` to manage user-specific data like `balance` (default: 10000) and `username`.
- **Stocks:** A catalog of monitored assets containing `ticker`, `name`, `current_price`, and `last_updated`.
- **Portfolios:** A many-to-many relationship tracking user holdings: `user_id`, `stock_ticker`, `quantity`, and `average_purchase_price`.
- **Transactions:** An immutable ledger of all trades: `id`, `user_id`, `stock_ticker`, `type` (BUY/SELL), `amount`, `price_at_execution`, and `timestamp`.

## 4. Functional Requirements for the Agent

- **Prisma Setup:** Initialize Prisma schema mirroring the Data Architecture. Generate the Prisma Client for use within NestJS services.
- **Auth System:** Integrate with Supabase Auth. Implement Guards to ensure users can only access and modify their own financial data.
- **Market Engine (CronJobs):**
  - Synchronize asset prices every X minutes from an external market API or a mock service.
  - Store historical snapshots to generate performance charts.
- **Trading Logic:**
  - **Atomic Transactions:** Ensure that balance deductions and portfolio updates happen as a single unit of work (Prisma Transactions).
  - **Validation:** Prevent purchases if the balance is insufficient and prevent sales if the user does not own enough of the asset.
- **Real-time Updates:** Use WebSockets to push price changes to connected clients instantly.

## 5. Local Development Environment

- **Docker Compose:** Create a `docker-compose.yml` containing a simple PostgreSQL image to allow local testing without an immediate cloud dependency.
- **Prisma Migrations:** Use Prisma to sync the local database schema and generate initial seeds for testing.

## 6. Roles and Permissions (RBAC)

- **Trader (User):** Manage personal portfolio, execute trades, and view personal performance history.
- **Admin:** Manage the list of available stock tickers, adjust user balances for support, and monitor system-wide logs.

## 7. Immediate Deliverables

1.  Simple `docker-compose.yml` with PostgreSQL configuration.
2.  `schema.prisma` file reflecting the core entities.
3.  NestJS Database Module with Prisma Service integration.
4.  Initial `seed.ts` to populate local DB with mock stocks.
5.  Trading Module: `BUY` and `SELL` logic using Prisma transactions.

---

**Initial Instruction for the Agent:**
"Start by creating a simple `docker-compose.yml` for local PostgreSQL and initialize the `schema.prisma` file. Once the local database is up and the Prisma Client is generated, create a `MarketService` that simulates stock price fluctuations every 10 seconds to test the WebSocket integration."
