# AGENTS.md — finsim-api

## Stack

- **NestJS 11** + TypeScript 5.7
- **Package manager: pnpm** (NOT npm/yarn/bun — lockfile is `pnpm-lock.yaml`)
- Jest 30 for testing, ESLint 9 (flat config), Prettier 3

## Commands

```
pnpm install          # install deps
pnpm run start:dev    # dev server with watch (port 3000 or $PORT)
pnpm run build        # compile to dist/ (cleaned on each build)
pnpm run start:prod   # run from dist/main
pnpm run test         # unit tests (*.spec.ts in src/)
pnpm run test:e2e     # e2e tests (*.e2e-spec.ts in test/)
pnpm run test:cov     # coverage → ../coverage
pnpm run lint         # eslint --fix
pnpm run format       # prettier --write
```

## Architecture

- Single module scaffold: `src/main.ts` → `AppModule` → `AppController` + `AppService`
- No database, ORM, auth, or external services yet
- Entry point: `src/main.ts` (listens on `process.env.PORT ?? 3000`)
- Build output: `dist/` (deleted on rebuild via `nest-cli.json deleteOutDir`)

## Testing

- **Unit tests**: `*.spec.ts` inside `src/`, Jest config inline in `package.json`, `rootDir: "src"`
- **E2E tests**: `*.e2e-spec.ts` inside `test/`, separate config at `test/jest-e2e.json`
- Run a single test: `pnpm run test -- -t "test name"` or `pnpm run test -- <file>`

## Conventions & Quirks

- **Prettier**: `singleQuote: true`, `trailingComma: "all"`
- **ESLint**: flat config (`eslint.config.mjs`), uses `recommendedTypeChecked`, `no-explicit-any` is OFF, `no-floating-promises` and `no-unsafe-argument` are WARN
- **TypeScript**: `noImplicitAny: false`, `strictBindCallApply: false` — relaxed strictness, do NOT tighten without asking
- **`.env` files are gitignored** but no dotenv package installed — env vars must be set externally
- Use `nest generate` (via `@nestjs/schematics`) to add modules/controllers/services
