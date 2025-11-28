require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Import middlewares
const { errorHandler, notFound } = require('./src/middlewares/error.middleware');
const { sanitizeInput } = require('./src/middlewares/validation.middleware');

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
const roomBookingRoutes = require('./src/routes/room-booking.routes');

// Import Socket.io and Notification Service
const initializeSocket = require('./src/config/socket');
const NotificationService = require('./src/services/notification.service');

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser middleware
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

// Sanitize input
app.use(sanitizeInput);

// Static files - serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SmartFactory CONNECT API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
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
app.use('/api/room-bookings', roomBookingRoutes);

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

// Make notificationService and io available globally
app.set('io', io);
app.set('notificationService', notificationService);

// Start server
server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏭 SmartFactory CONNECT API Server                     ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                  ║
║   Server: http://${HOST}:${PORT}                           ║
║   Health Check: http://${HOST}:${PORT}/health             ║
║                                                           ║
║   Database: PostgreSQL                                    ║
║   WebSocket: Socket.io                                    ║
║   Status: Ready ✓                                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Unhandled rejection handler
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
