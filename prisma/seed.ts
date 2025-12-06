import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Skapa admin-användare
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@telink.se' },
    update: {},
    create: {
      email: 'admin@telink.se',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Skapa vanlig användare
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@telink.se' },
    update: {},
    create: {
      email: 'user@telink.se',
      name: 'Test User',
      passwordHash: userPassword,
      role: 'USER',
      isActive: true,
    },
  });

  console.log('✅ Regular user created:', user.email);

  console.log('\n🎉 Seeding completed!\n');
  console.log('📝 Test accounts:');
  console.log('  Admin: admin@telink.se / admin123');
  console.log('  User:  user@telink.se / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
