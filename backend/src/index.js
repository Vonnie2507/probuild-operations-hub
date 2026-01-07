/**
 * PROBUILD OPERATIONS HUB
 * Main Server Entry Point
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Import routes
const documentsRoutes = require('./routes/documents');
const prestartRoutes = require('./routes/prestart');
const jobmanRoutes = require('./routes/jobman');
const webhooksRoutes = require('./routes/webhooks');
const filesRoutes = require('./routes/files');
const authRoutes = require('./routes/auth');
const templatesRoutes = require('./routes/templates');

// Initialise Prisma
const prisma = new PrismaClient();

// Initialise Express
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// JSON body parser (except for webhooks which need raw body)
app.use((req, res, next) => {
  if (req.path === '/api/webhooks/jobman') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/prestart', prestartRoutes);
app.use('/api/jobman', jobmanRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/templates', templatesRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({ 
      error: 'Database error',
      message: err.message 
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation error',
      details: err.errors 
    });
  }

  // Default error
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// ============================================
// START SERVER
// ============================================

async function ensureAdminUser() {
  const bcrypt = require('bcryptjs');

  // Check if admin user exists
  const adminExists = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminExists) {
    console.log('🌱 No admin user found, creating default admin...');
    const hashedPassword = await bcrypt.hash('probuild123', 10);

    await prisma.user.create({
      data: {
        email: 'admin@probuild.com.au',
        name: 'Probuild Admin',
        role: 'ADMIN',
        password: hashedPassword,
        isActive: true,
      }
    });
    console.log('✅ Default admin user created (admin@probuild.com.au)');
  }
}

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Ensure admin user exists
    await ensureAdminUser();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🟠 PROBUILD OPERATIONS HUB                          ║
║                                                       ║
║   Server running on http://localhost:${PORT}            ║
║                                                       ║
║   Endpoints:                                          ║
║   • /api/documents  - Live Project Documents          ║
║   • /api/prestart   - Pre-Start Meetings              ║
║   • /api/jobman     - Jobman API proxy                ║
║   • /api/files      - File uploads                    ║
║   • /api/webhooks   - Webhook receivers               ║
║   • /api/templates  - Form templates                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

start();

module.exports = app;
