import prisma from './db';

async function seed() {
  console.log('🌱 Seeding database...');

  // Skapa demo-användare
  const demoUser = await prisma.user.upsert({
    where: { id: 'demo-user' },
    update: {},
    create: {
      id: 'demo-user',
      email: 'demo@telink.se',
      name: 'Demo Användare',
      role: 'BOOKER',
    },
  });

  console.log('✅ Demo-användare skapad:', demoUser);

  console.log('✨ Database seeding completed!');
}

seed()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
