# StockFlow API

Paper-trading stock market simulator. Users get $10,000 virtual balance, buy/sell stocks with real-time price simulation, track portfolio performance. Built with NestJS 11, Prisma 7, PostgreSQL, WebSocket.

## Quick Start

```bash
pnpm install                     # install dependencies
docker compose up -d             # start PostgreSQL (port 5435)
pnpm exec prisma migrate deploy  # create tables
pnpm exec tsx prisma/seed.ts     # load sample stocks + demo profile
pnpm run start:dev               # start dev server → http://localhost:3000
```

Open Swagger UI at **http://localhost:3000/api**.

## Stack

| Category | Technology |
|----------|------------|
| Framework | NestJS 11 |
| Language | TypeScript 5 (module: nodenext) |
| ORM | Prisma 7 with pg adapter |
| Database | PostgreSQL 17 (Docker, port 5435) |
| Real-time | WebSocket (ws) |
| Scheduling | @nestjs/schedule (cron) |
| Validation | class-validator + class-transformer |
| Testing | Jest 30 (168 unit tests, 31 suites) |
| Docs | Swagger / OpenAPI at `/api` |
| Package manager | pnpm |

## Project Structure

```
src/
├── admin/         # RBAC guard, ticker management, balance adjustment
├── auth/          # Mock JWT guard (dev), Supabase JWT guard (prod)
│   ├── guards/
│   └── decorators/
├── config/        # @nestjs/config: DATABASE_URL, PORT validation
├── market/        # Cron price simulator (±5% every 5s), WebSocket gateway
├── portfolio/     # Holdings with P&L, net worth, transaction history
├── prisma/        # PrismaService (DB connection), PrismaModule
├── profiles/      # Profile CRUD with balance management
├── stocks/        # Stock CRUD (ticker-based)
├── trading/       # BUY/SELL with atomic Prisma transactions
├── app.module.ts  # Root module
└── main.ts        # Bootstrap: CORS, ValidationPipe, Swagger, WebSocket
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Public | Hello world |
| `GET` | `/health` | Public | Health check |
| `GET` | `/stocks` | Public | List all stocks |
| `GET` | `/stocks/:ticker` | Public | Get stock by ticker |
| `POST` | `/stocks` | Public | Create stock |
| `PATCH` | `/stocks/:ticker` | Public | Update stock |
| `DELETE` | `/stocks/:ticker` | Public | Delete stock |
| `GET` | `/profiles` | Auth | List profiles |
| `GET` | `/profiles/:id` | Auth | Get profile |
| `POST` | `/profiles` | Auth | Create profile |
| `PATCH` | `/profiles/:id` | Auth | Update profile |
| `POST` | `/trades/buy` | Auth | Buy shares |
| `POST` | `/trades/sell` | Auth | Sell shares |
| `GET` | `/portfolio/holdings` | Auth | Holdings with P&L |
| `GET` | `/portfolio/net-worth` | Auth | Net worth summary |
| `GET` | `/portfolio/history` | Auth | Transaction history |
| `POST` | `/admin/profiles/:id/adjust-balance` | Admin | Adjust balance |
| `POST` | `/admin/tickers` | Admin | Create ticker |
| `PATCH` | `/admin/tickers/:ticker` | Admin | Update ticker |
| `DELETE` | `/admin/tickers/:ticker` | Admin | Delete ticker |

## Authentication

Dev mode uses `MockJwtAuthGuard` — any JWT-shaped token works. Header:

```
Authorization: Bearer <token>
```

Token payload (base64url JSON):

```json
{ "sub": "<profile-uuid>", "role": "TRADER" }
```

- `sub` → profile UUID
- `role` → `TRADER` or `ADMIN` (required for `/admin` endpoints)
- No auth header → defaults to `dev-anonymous`

Production uses `SupabaseJwtAuthGuard` (validates against Supabase JWKS).

## WebSocket

Connect to `ws://localhost:3000`. Server broadcasts every 5 seconds:

```json
{ "event": "priceUpdate", "ticker": "AAPL", "price": 179.25 }
```

## Data Models

| Model | Key Fields |
|-------|-----------|
| **Profile** | id (UUID), email (unique), username (unique), balance (Decimal, default 10000), role (TRADER\|ADMIN) |
| **Stock** | ticker (PK), name, currentPrice, lastUpdated, createdAt |
| **Transaction** | id (UUID), profileId, stockTicker, type (BUY\|SELL), quantity, priceAtExecution, totalAmount, timestamp |
| **Holding** | id, profileId, stockTicker (unique pair), quantity, averagePurchasePrice, updatedAt |
| **PriceSnapshot** | id, stockTicker, price, recordedAt |

## Commands

```bash
pnpm run start:dev     # dev server with watch mode
pnpm run build         # compile TypeScript
pnpm run start:prod    # run compiled output
pnpm run test          # 168 unit tests
pnpm run test:e2e      # e2e tests
pnpm run test:cov      # coverage report
pnpm run lint          # ESLint --fix
pnpm run format        # Prettier
```

## Environment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `PORT` | No | `3000` | Server port |
| `CORS_ORIGIN` | No | `http://localhost:5173` | CORS origin |
| `SUPABASE_URL` | No | — | Required for Supabase JWT auth |

## Key Decisions

- **Port 5435 for Docker** — local PostgreSQL occupies 5432 and 5433
- **pnpm** over bun/npm — project lockfile is `pnpm-lock.yaml`
- **`#` subpath imports** — `#prisma/prisma.service` for clean module references
- **`noImplicitAny: false`** — relaxed TypeScript strictness per project convention
- **Prisma 7 + pg adapter** — custom output at `generated/prisma`, driver adapter for PostgreSQL
