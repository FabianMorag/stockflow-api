export interface EnvConfig {
  DATABASE_URL: string
  PORT: number
}

export function validateConfig(
  env: Record<string, string | undefined>,
): EnvConfig {
  const databaseUrl = env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  const portStr = env.PORT ?? '3000'

  const port = Number(portStr)
  if (Number.isNaN(port)) {
    throw new Error('PORT must be a valid number')
  }

  return {
    DATABASE_URL: databaseUrl,
    PORT: port,
  }
}
