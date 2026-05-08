import { PrismaClient } from '@prisma/client'
import { neonConfig, Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws
neonConfig.pipelineConnect = false // Improves reliability in some environments
neonConfig.useSecureWebSocket = true

const connectionString = `${process.env.DATABASE_URL}`

// Increase connection timeout for the pool
const pool = new Pool({ 
  connectionString,
  connectionTimeoutMillis: 30000, // 30 seconds
  idleTimeoutMillis: 10000,      // 10 seconds
})
const adapter = new PrismaNeon(pool)


const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
