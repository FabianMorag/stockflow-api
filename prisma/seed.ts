import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const stocks = [
  { ticker: 'AAPL', name: 'Apple Inc.', currentPrice: 178.5 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', currentPrice: 141.25 },
  { ticker: 'MSFT', name: 'Microsoft Corporation', currentPrice: 378.9 },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', currentPrice: 178.15 },
  { ticker: 'TSLA', name: 'Tesla Inc.', currentPrice: 245.6 },
  { ticker: 'META', name: 'Meta Platforms Inc.', currentPrice: 505.75 },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', currentPrice: 875.3 },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', currentPrice: 198.4 },
]

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  await prisma.priceSnapshot.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.holding.deleteMany()
  await prisma.stock.deleteMany()
  await prisma.profile.deleteMany()

  // Create stocks
  for (const stock of stocks) {
    await prisma.stock.create({
      data: {
        ticker: stock.ticker,
        name: stock.name,
        currentPrice: stock.currentPrice,
      },
    })
    console.log(`  ✓ Created stock: ${stock.ticker}`)
  }

  // Create a default trader profile
  await prisma.profile.create({
    data: {
      email: 'trader@example.com',
      username: 'demo_trader',
      balance: 10000,
    },
  })
  console.log('  ✓ Created demo trader profile')

  console.log('✅ Seed completed successfully')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
