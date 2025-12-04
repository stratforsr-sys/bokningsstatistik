import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config, validateConfig } from './config';
import { testDatabaseConnection, disconnectDatabase } from './db';

// Routes
import authRoutes from './routes/auth';
import meetingsRoutes from './routes/meetings';
import statsRoutes from './routes/stats';
import usersRoutes from './routes/users';

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true, // Allow cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servera frontend (React-app från dist-mappen)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Request logging middleware (development)
if (config.nodeEnv === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Info endpoint (för API-dokumentation)
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Telink Boknings-statistik API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth',
      users: '/api/users',
      meetings: '/api/meetings',
      stats: '/api/stats',
    },
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/stats', statsRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
  });
});

// SPA fallback - Servera React-appen för alla andra routes (client-side routing)
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Start server
async function startServer() {
  // Validera konfiguration
  validateConfig();

  // Testa databasanslutning
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('⚠️  Servern startar, men databasanslutningen misslyckades');
    console.error('Se till att PostgreSQL körs och DATABASE_URL är korrekt konfigurerad');
  }

  // Starta server
  app.listen(config.port, () => {
    console.log('🚀 Server startad!');
    console.log(`📡 Lyssnar på http://localhost:${config.port}`);
    console.log(`🌍 Miljö: ${config.nodeEnv}`);
  });
}

// Hantera graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Stänger av servern...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Stänger av servern...');
  await disconnectDatabase();
  process.exit(0);
});

// Starta servern
startServer().catch((error) => {
  console.error('❌ Fel vid start av server:', error);
  process.exit(1);
});
