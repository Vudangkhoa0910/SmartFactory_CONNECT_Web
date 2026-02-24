const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * =============================================================
 * SOCKET.IO SERVER CONFIGURATION
 * =============================================================
 * Optimized for 2000-3000 concurrent users
 * 
 * Scaling options:
 * 1. Single server: This implementation (up to ~5000 connections)
 * 2. Horizontal scaling: Use Redis adapter (commented below)
 * =============================================================
 */

// Connection tracking for monitoring
const connectionStats = {
  totalConnections: 0,
  currentConnections: 0,
  peakConnections: 0,
  messagesSent: 0,
  messagesReceived: 0,
};

/**
 * Initialize Socket.io server with optimized settings
 */
function initializeSocket(server) {
  const isProduction = process.env.NODE_ENV === 'production';

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.FRONTEND_URL || 'http://localhost:5173',
          'https://xiaojunhd.me',
          'https://www.xiaojunhd.me',
          'https://api.xiaojunhd.me',
          'http://localhost',
          'http://localhost:80',
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          // Temporarily allow all for debugging if issues persist
          console.log('[Socket] Origin check warn:', origin);
          callback(null, true);
        }
      },
      credentials: true,
    },
    // Connection settings optimized for scale
    pingTimeout: 60000,           // 60 seconds before considering disconnected
    pingInterval: 25000,          // Send ping every 25 seconds
    upgradeTimeout: 10000,        // 10 seconds to upgrade connection
    maxHttpBufferSize: 1e6,       // 1MB max message size
    transports: ['websocket', 'polling'], // Prefer WebSocket
    allowUpgrades: true,
    // Per-message compression (disable for better CPU usage at scale)
    perMessageDeflate: false,
    // Connection limits
    connectTimeout: 45000,
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const result = await db.query(
        'SELECT id, employee_code, email, full_name, role, level, department_id, preferred_language FROM users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = result.rows[0];
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    // Update stats
    connectionStats.totalConnections++;
    connectionStats.currentConnections++;
    if (connectionStats.currentConnections > connectionStats.peakConnections) {
      connectionStats.peakConnections = connectionStats.currentConnections;
    }

    // Always log connection for debugging
    console.log(`[Socket] User connected: ${socket.user.full_name} (${socket.user.id}) - Total: ${connectionStats.currentConnections}`);

    // Join user-specific room
    socket.join(`user_${socket.user.id}`);

    // Join role-specific room
    socket.join(`role_${socket.user.role}`);

    // Join department-specific room
    if (socket.user.department_id) {
      socket.join(`dept_${socket.user.department_id}`);
    }

    // Join level-specific rooms (for hierarchical broadcasting)
    socket.join(`level_${socket.user.level}`);

    // Send connection success event with user info
    socket.emit('connected', {
      message: 'Connected to SmartFactory CONNECT',
      user: {
        id: socket.user.id,
        name: socket.user.full_name,
        role: socket.user.role
      }
    });

    // Handle client requesting notifications
    socket.on('get_notifications', async (data) => {
      try {
        const page = data?.page || 1;
        const limit = data?.limit || 20;
        const offset = (page - 1) * limit;
        const lang = socket.user?.preferred_language || 'vi';

        const result = await db.query(
          `SELECT 
             n.*,
             COALESCE(${lang === 'ja' ? 'n.title_ja' : 'NULL'}, n.title) as title,
             COALESCE(${lang === 'ja' ? 'n.message_ja' : 'NULL'}, n.message) as message
           FROM notifications n
           WHERE recipient_id = $1 
           ORDER BY created_at DESC 
           LIMIT $2 OFFSET $3`,
          [socket.user.id, limit, offset]
        );

        socket.emit('notifications_list', {
          notifications: result.rows,
          page,
          limit
        });
      } catch (error) {
        console.error('Error getting notifications:', error);
        socket.emit('error', { message: 'Failed to get notifications' });
      }
    });

    // Handle mark notification as read
    socket.on('mark_read', async (data) => {
      try {
        const { notificationId } = data;

        await db.query(
          `UPDATE notifications 
           SET is_read = true, read_at = CURRENT_TIMESTAMP 
           WHERE id = $1 AND recipient_id = $2`,
          [notificationId, socket.user.id]
        );

        socket.emit('notification_read', { notificationId });

        // Send updated unread count
        const countResult = await db.query(
          'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = $1 AND is_read = false',
          [socket.user.id]
        );

        socket.emit('unread_count', { count: parseInt(countResult.rows[0].count) });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });

    // Handle mark all as read
    socket.on('mark_all_read', async () => {
      try {
        await db.query(
          `UPDATE notifications 
           SET is_read = true, read_at = CURRENT_TIMESTAMP 
           WHERE recipient_id = $1 AND is_read = false`,
          [socket.user.id]
        );

        socket.emit('all_notifications_read');
        socket.emit('unread_count', { count: 0 });
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        socket.emit('error', { message: 'Failed to mark all notifications as read' });
      }
    });

    // Handle get unread count
    socket.on('get_unread_count', async () => {
      try {
        const result = await db.query(
          'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = $1 AND is_read = false',
          [socket.user.id]
        );

        socket.emit('unread_count', { count: parseInt(result.rows[0].count) });
      } catch (error) {
        console.error('Error getting unread count:', error);
        socket.emit('error', { message: 'Failed to get unread count' });
      }
    });

    // Handle incident updates subscription
    socket.on('subscribe_incidents', () => {
      socket.join('incidents');
      console.log(`[Socket] User ${socket.user.full_name} subscribed to incidents`);
    });

    // Handle ideas updates subscription
    socket.on('subscribe_ideas', () => {
      socket.join('ideas');
      console.log(`[Socket] User ${socket.user.full_name} subscribed to ideas`);
    });

    // Handle news updates subscription
    socket.on('subscribe_news', () => {
      socket.join('news');
      console.log(`[Socket] User ${socket.user.full_name} subscribed to news`);
    });

    // Handle typing indicator (for comments/responses)
    socket.on('typing', (data) => {
      const { reference_type, reference_id } = data;
      socket.to(`${reference_type}_${reference_id}`).emit('user_typing', {
        user: socket.user.full_name,
        reference_type,
        reference_id
      });
    });

    // Handle subscribe to specific idea room (for real-time responses)
    socket.on('subscribe_idea', (data) => {
      const { idea_id } = data;
      if (idea_id) {
        socket.join(`idea_${idea_id}`);
        console.log(`[Socket] User ${socket.user.full_name} subscribed to idea_${idea_id}`);
      }
    });

    // Handle unsubscribe from specific idea room
    socket.on('unsubscribe_idea', (data) => {
      const { idea_id } = data;
      if (idea_id) {
        socket.leave(`idea_${idea_id}`);
        console.log(`[Socket] User ${socket.user.full_name} unsubscribed from idea_${idea_id}`);
      }
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      connectionStats.currentConnections--;
      console.log(`[Socket] User disconnected: ${socket.user.full_name} (${socket.user.id}) - Reason: ${reason}`);
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.id}:`, error);
    });
  });

  // =========================================================
  // BROADCAST METHODS FOR SERVER-SIDE USE
  // =========================================================

  io.broadcastIncident = (event, data) => {
    connectionStats.messagesSent++;
    io.to('incidents').emit(event, data);
  };

  io.broadcastIdea = (event, data) => {
    connectionStats.messagesSent++;
    console.log(`[Socket] Broadcasting idea event: ${event}, ideaId: ${data?.id}`);
    io.to('ideas').emit(event, data);
  };

  io.broadcastNews = (event, data) => {
    connectionStats.messagesSent++;
    io.to('news').emit(event, data);
  };

  io.notifyUser = (userId, event, data) => {
    connectionStats.messagesSent++;
    io.to(`user_${userId}`).emit(event, data);
  };

  io.notifyRole = (role, event, data) => {
    connectionStats.messagesSent++;
    io.to(`role_${role}`).emit(event, data);
  };

  io.notifyDepartment = (departmentId, event, data) => {
    connectionStats.messagesSent++;
    io.to(`dept_${departmentId}`).emit(event, data);
  };

  // Notify users subscribed to a specific idea (for real-time chat)
  io.notifyIdeaSubscribers = (ideaId, event, data) => {
    connectionStats.messagesSent++;
    io.to(`idea_${ideaId}`).emit(event, data);
  };

  io.notifyLevel = (level, event, data) => {
    // Notify all users with this level and above (lower number = higher authority)
    for (let i = 1; i <= level; i++) {
      connectionStats.messagesSent++;
      io.to(`level_${i}`).emit(event, data);
    }
  };

  // Batch notification for efficiency
  io.notifyUsers = (userIds, event, data) => {
    connectionStats.messagesSent += userIds.length;
    userIds.forEach(userId => {
      io.to(`user_${userId}`).emit(event, data);
    });
  };

  // Get connection statistics
  io.getStats = () => ({
    ...connectionStats,
    rooms: io.sockets.adapter.rooms.size,
  });

  console.log('✓ Socket.io initialized (optimized for scale)');

  return io;
}

module.exports = initializeSocket;
