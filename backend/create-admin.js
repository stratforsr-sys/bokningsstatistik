const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Kolla om admin redan finns
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@telink.se' },
    });

    if (existingAdmin) {
      console.log('❌ Admin-användare finns redan!');
      console.log('Email:', existingAdmin.email);
      console.log('Namn:', existingAdmin.name);
      console.log('\nLogga in på http://localhost:5173/login med:');
      console.log('Email: admin@telink.se');
      console.log('Lösenord: admin123');
      await prisma.$disconnect();
      return;
    }

    // Hash:a lösenord
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Skapa admin
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@telink.se',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Admin-användare skapad!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:', admin.id);
    console.log('Namn:', admin.name);
    console.log('Email:', admin.email);
    console.log('Roll:', admin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 Nu kan du logga in på http://localhost:5173/login');
    console.log('\n📧 Email: admin@telink.se');
    console.log('🔑 Lösenord: admin123');
    console.log('\n💡 Tips: Byt lösenord efter första inloggningen!');
  } catch (error) {
    console.error('❌ Fel vid skapande av admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
