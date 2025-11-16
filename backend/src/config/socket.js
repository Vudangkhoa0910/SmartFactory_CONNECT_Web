const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Initialize Socket.io server
 */
function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
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
        'SELECT id, employee_code, email, full_name, role, level, department_id FROM users WHERE id = $1 AND is_active = true',
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
    console.log(`User connected: ${socket.user.full_name} (${socket.user.id})`);
    
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
        
        const result = await db.query(
          `SELECT * FROM notifications 
           WHERE user_id = $1 
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
           WHERE id = $1 AND user_id = $2`,
          [notificationId, socket.user.id]
        );
        
        socket.emit('notification_read', { notificationId });
        
        // Send updated unread count
        const countResult = await db.query(
          'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
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
           WHERE user_id = $1 AND is_read = false`,
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
          'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
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
      console.log(`User ${socket.user.full_name} subscribed to incidents`);
    });

    // Handle ideas updates subscription
    socket.on('subscribe_ideas', () => {
      socket.join('ideas');
      console.log(`User ${socket.user.full_name} subscribed to ideas`);
    });

    // Handle news updates subscription
    socket.on('subscribe_news', () => {
      socket.join('news');
      console.log(`User ${socket.user.full_name} subscribed to news`);
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

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.full_name} (${socket.user.id})`);
    });
  });

  // Broadcast methods for server-side use
  io.broadcastIncident = (event, data) => {
    io.to('incidents').emit(event, data);
  };

  io.broadcastIdea = (event, data) => {
    io.to('ideas').emit(event, data);
  };

  io.broadcastNews = (event, data) => {
    io.to('news').emit(event, data);
  };

  io.notifyUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  io.notifyRole = (role, event, data) => {
    io.to(`role_${role}`).emit(event, data);
  };

  io.notifyDepartment = (departmentId, event, data) => {
    io.to(`dept_${departmentId}`).emit(event, data);
  };

  io.notifyLevel = (level, event, data) => {
    // Notify all users with this level and above (lower number = higher authority)
    for (let i = 1; i <= level; i++) {
      io.to(`level_${i}`).emit(event, data);
    }
  };

  console.log('✓ Socket.io initialized');
  
  return io;
}

module.exports = initializeSocket;
