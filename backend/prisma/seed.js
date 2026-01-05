const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('probuild123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@probuild.com.au' },
    update: {},
    create: {
      email: 'admin@probuild.com.au',
      name: 'Probuild Admin',
      role: 'ADMIN',
      password: hashedPassword,
      isActive: true,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create a sample live document
  const sampleDoc = await prisma.liveDocument.upsert({
    where: { id: 'sample-doc-1' },
    update: {},
    create: {
      id: 'sample-doc-1',
      customerName: 'John Smith',
      customerEmail: 'john.smith@example.com',
      customerPhone: '0412 345 678',
      siteAddress: '123 Main Street, Brisbane QLD 4000',
      siteAddressLine1: '123 Main Street',
      siteCity: 'Brisbane',
      siteState: 'QLD',
      sitePostcode: '4000',
      status: 'LEAD',
      siteAccess: 'Gate on left side, code 1234',
      parkingDetails: 'Street parking available',
      groundConditions: 'Clay soil, flat terrain',
      dogOnProperty: true,
      dogDetails: 'Golden Retriever named Max - friendly',
      powerAvailable: true,
      waterAvailable: true,
      createdById: admin.id,
    },
  });

  console.log('Created sample document:', sampleDoc.customerName);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
