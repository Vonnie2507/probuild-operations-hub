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

  // ============================================
  // STAFF SEEDING
  // ============================================
  console.log('Seeding staff...');

  const staffData = [
    { name: 'Craig', role: 'operations' },
    { name: 'Jake', role: 'field_installer' },
    { name: 'Jarred', role: 'field_installer' },
    { name: 'George', role: 'workshop' },
    { name: 'David', role: 'field_installer' },
    { name: 'Dave', role: 'field_installer' },
    { name: 'Bradley', role: 'field_installer' },
    { name: 'Vonnie', role: 'admin' },
  ];

  for (const staff of staffData) {
    await prisma.staff.upsert({
      where: {
        id: `staff-${staff.name.toLowerCase()}`
      },
      update: {
        name: staff.name,
        role: staff.role,
        isActive: true
      },
      create: {
        id: `staff-${staff.name.toLowerCase()}`,
        name: staff.name,
        role: staff.role,
        isActive: true,
      },
    });
    console.log(`  Created/updated staff: ${staff.name} (${staff.role})`);
  }

  // ============================================
  // COMPLIANCE CHECK CONFIG SEEDING
  // ============================================
  console.log('Seeding compliance check configs...');

  const complianceConfigs = [
    { checkKey: 'clocked_in_out', checkLabel: 'Clocked in/out', applicableRoles: ['field_installer', 'workshop'], sortOrder: 1 },
    { checkKey: 'job_checkin_out', checkLabel: 'Job check-in/out', applicableRoles: ['field_installer'], sortOrder: 2 },
    { checkKey: 'progress_photos', checkLabel: 'Progress photos uploaded', applicableRoles: ['field_installer'], sortOrder: 3 },
    { checkKey: 'tasks_ticked', checkLabel: 'Tasks ticked off', applicableRoles: ['field_installer'], sortOrder: 4 },
    { checkKey: 'stock_check', checkLabel: 'Stock check on return', applicableRoles: ['field_installer'], sortOrder: 5 },
    { checkKey: 'vehicle_cleaned', checkLabel: 'Vehicle cleaned', applicableRoles: ['field_installer'], sortOrder: 6 },
    { checkKey: 'timer_start_stop', checkLabel: 'Timer start/stop for tasks', applicableRoles: ['workshop'], sortOrder: 2 },
    { checkKey: 'qa_photos', checkLabel: 'QA photos submitted', applicableRoles: ['workshop'], sortOrder: 3 },
    { checkKey: 'workshop_clean', checkLabel: 'Workshop kept clean', applicableRoles: ['workshop'], sortOrder: 4 },
  ];

  for (const config of complianceConfigs) {
    await prisma.complianceCheckConfig.upsert({
      where: { checkKey: config.checkKey },
      update: {
        checkLabel: config.checkLabel,
        applicableRoles: config.applicableRoles,
        sortOrder: config.sortOrder,
        isActive: true,
      },
      create: {
        checkKey: config.checkKey,
        checkLabel: config.checkLabel,
        applicableRoles: config.applicableRoles,
        sortOrder: config.sortOrder,
        isActive: true,
      },
    });
    console.log(`  Created/updated compliance config: ${config.checkLabel}`);
  }

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
