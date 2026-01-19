require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Import middlewares
const { errorHandler, notFound } = require('./src/middlewares/error.middleware');
const { sanitizeInput } = require('./src/middlewares/validation.middleware');
const { generalLimiter } = require('./src/middlewares/rate-limit.middleware');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const departmentRoutes = require('./src/routes/department.routes');
const incidentRoutes = require('./src/routes/incident.routes');
const ideaRoutes = require('./src/routes/idea.routes');
const newsRoutes = require('./src/routes/news.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const chatRoutes = require('./src/routes/chat.routes');
const settingsRoutes = require('./src/routes/settings.routes');
// const anomalyRoutes = require('./src/routes/anomaly.routes'); // Commented out - file does not exist
const mediaRoutes = require('./src/routes/media.routes');
const emailRoutes = require('./src/routes/email.routes');
const suggestionsRoutes = require('./src/routes/suggestions.routes');

// Import Socket.io and Services
const initializeSocket = require('./src/config/socket');
const NotificationService = require('./src/services/notification.service');
const PushNotificationService = require('./src/services/push-notification.service');
const cacheService = require('./src/services/cache.service');
const { healthCheck: dbHealthCheck, getPoolStats } = require('./src/config/database');
const { connectMongoDB, checkMongoDBHealth, closeMongoDB } = require('./src/config/mongodb');

// Import Swagger
const swaggerConfig = require('./src/config/swagger');

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Trust proxy for correct IP detection behind load balancer
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      // Production Netlify
      'https://smartfactoryconnect.netlify.app',
      // Custom domain (if configured)
      'https://app.xiao.software',
      // Local development
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost',
      'http://localhost:80',
      'http://localhost:3000',
      'http://localhost:5173',
    ];
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Be permissive - allow any origin in development
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-Type'],
};
app.use(cors(corsOptions));

// Compression middleware - compress responses > 1kb
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// Body parser middleware with larger limits for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Create logs directory if it doesn't exist
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  // Create a write stream for access logs
  const accessLogStream = fs.createWriteStream(
    path.join(logDir, 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
}

// Apply rate limiting to all API routes
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true') {
  app.use('/api/', generalLimiter);
}

// Sanitize input
// Sanitize input - DISABLED due to conflicts with some routes
// app.use(sanitizeInput);

// Static files - serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await dbHealthCheck();
    const mongoHealth = await checkMongoDBHealth();

    res.json({
      success: true,
      message: 'SmartFactory CONNECT API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      databases: {
        postgresql: dbHealth,
        mongodb: mongoHealth,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service degraded',
      error: error.message,
    });
  }
});

// Metrics endpoint for monitoring
app.get('/metrics', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
    },
    database: getPoolStats(),
    cache: cacheService.getStats(),
  });
});

// Readiness probe for Kubernetes/Docker
app.get('/ready', async (req, res) => {
  try {
    const dbHealth = await dbHealthCheck();
    if (dbHealth.status === 'healthy') {
      res.json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database unhealthy' });
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// Liveness probe
app.get('/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Swagger API Documentation
app.use('/api-docs', swaggerConfig.serve, swaggerConfig.setup);
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerConfig.specs);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);
// app.use('/api/anomalies', anomalyRoutes); // Commented out - file does not exist
app.use('/api/media', mediaRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/suggestions', suggestionsRoutes);

// Room booking routes
const roomBookingRoutes = require('./src/routes/room-booking.routes');
app.use('/api/room-bookings', roomBookingRoutes);

// Kaizen Bank & White Box routes
const kaizenBankRoutes = require('./src/routes/kaizen-bank.routes');
app.use('/api/kaizen-bank', kaizenBankRoutes);

// Translation routes
const translationRoutes = require('./src/routes/translation.routes');
app.use('/api/translations', translationRoutes);

// Metadata routes (for App Mobile - enums, filters, options, navigation)
const metadataRoutes = require('./src/routes/metadata.routes');
app.use('/api/metadata', metadataRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Socket.io
const io = initializeSocket(server);

// Initialize Notification Service
const notificationService = new NotificationService(io);

// Initialize Push Notification Service (for FCM + in-app notifications)
const pushNotificationService = new PushNotificationService(io, notificationService);

// Make services available globally
app.set('io', io);
app.set('notificationService', notificationService);
app.set('pushNotificationService', pushNotificationService);
app.set('cacheService', cacheService);

// Initialize databases
async function initializeDatabases() {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    console.log('✅ MongoDB initialized');
  } catch (error) {
    console.error('⚠️ MongoDB initialization failed:', error.message);
    console.log('⚠️ Server will continue without MongoDB features');
  }
}

// Start server
async function startServer() {
  // Initialize databases first
  await initializeDatabases();

  server.listen(PORT, HOST, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏭 SmartFactory CONNECT API Server                          ║
║                                                               ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(40)}  ║
║   Server: http://${HOST}:${PORT}                                ║
║   Health: http://${HOST}:${PORT}/health                         ║
║   Metrics: http://${HOST}:${PORT}/metrics                       ║
║                                                               ║
║   Features:                                                   ║
║   ├── PostgreSQL: Pool ${process.env.DB_POOL_MAX || 50} connections                   ║
║   ├── MongoDB: GridFS Media Storage                           ║
║   ├── WebSocket: Socket.io                                    ║
║   ├── Caching: In-memory (Node-Cache)                         ║
║   ├── Compression: Enabled                                    ║
║   └── Rate Limiting: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Disabled'}                              ║
║                                                               ║
║   Status: Ready ✓                                             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} signal received: starting graceful shutdown`);

  // Close HTTP server first (stop accepting new connections)
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  // Close Socket.io connections
  if (io) {
    io.close(() => {
      console.log('✅ Socket.io server closed');
    });
  }

  // Close MongoDB connection
  try {
    await closeMongoDB();
  } catch (error) {
    console.error('⚠️ Error closing MongoDB:', error.message);
  }

  // Flush cache statistics
  console.log('📊 Final cache stats:', cacheService.getStats());

  // Database pool will close automatically via its own shutdown handler

  // Force exit after timeout
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
