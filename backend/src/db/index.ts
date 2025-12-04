import { PrismaClient } from '@prisma/client';

// Singleton Prisma-klient
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;

// Hjälpfunktion för att testa databasanslutning
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Databasanslutning lyckades');
    return true;
  } catch (error) {
    console.error('❌ Databasanslutning misslyckades:', error);
    return false;
  }
}

// Hjälpfunktion för att stänga databasanslutning
export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('🔌 Databasanslutning stängd');
}
