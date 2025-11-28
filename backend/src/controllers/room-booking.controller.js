/**
 * ROOM BOOKING CONTROLLER
 * Handles all room booking operations with approval workflow
 */

const { pool } = require('../config/database');

/**
 * Get all rooms with availability info
 */
exports.getRooms = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, room_code, room_name, capacity, location, 
        facilities, description, is_active
      FROM rooms
      WHERE is_active = true
      ORDER BY room_code
    `);

    res.json({ rooms: result.rows });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách phòng họp' });
  }
};

/**
 * Get bookings for a specific week
 * Can filter by room, status, date range
 */
exports.getBookings = async (req, res) => {
  try {
    const { 
      week_number, 
      year, 
      room_id, 
      status, 
      date_from, 
      date_to 
    } = req.query;

    let query = `
      SELECT 
        rb.id,
        rb.room_id,
        r.room_code,
        r.room_name,
        rb.title,
        rb.description,
        rb.meeting_type,
        rb.attendees_count,
        TO_CHAR(rb.booking_date, 'YYYY-MM-DD') as booking_date,
        rb.start_time,
        rb.end_time,
        rb.week_number,
        rb.year,
        rb.booked_by_user_id,
        rb.booked_by_name,
        rb.department_name,
        rb.status,
        rb.approved_by_name,
        rb.approved_at,
        rb.rejection_reason,
        rb.color,
        rb.notes,
        rb.created_at,
        rb.updated_at
      FROM room_bookings rb
      JOIN rooms r ON rb.room_id = r.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (week_number && year) {
      query += ` AND rb.week_number = $${paramIndex++} AND rb.year = $${paramIndex++}`;
      params.push(week_number, year);
    } else if (date_from && date_to) {
      query += ` AND rb.booking_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(date_from, date_to);
    } else {
      // Default: current week
      query += ` AND rb.week_number = EXTRACT(WEEK FROM CURRENT_DATE) 
                 AND rb.year = EXTRACT(YEAR FROM CURRENT_DATE)`;
    }

    if (room_id) {
      query += ` AND rb.room_id = $${paramIndex++}`;
      params.push(room_id);
    }

    if (status) {
      query += ` AND rb.status = $${paramIndex++}`;
      params.push(status);
    } else {
      // Default: only show active bookings
      query += ` AND rb.status IN ('pending', 'confirmed')`;
    }

    query += ` ORDER BY rb.booking_date, rb.start_time`;

    const result = await pool.query(query, params);

    console.log('📅 Query params:', { date_from, date_to, room_id, status });
    console.log('📅 Found bookings:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('📅 First booking:', {
        id: result.rows[0].id,
        booking_date: result.rows[0].booking_date,
        status: result.rows[0].status,
        title: result.rows[0].title
      });
    }

    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đặt phòng' });
  }
};

/**
 * Get booking by ID with full details
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        rb.*,
        r.room_code,
        r.room_name,
        r.capacity,
        r.location,
        r.facilities,
        u.email as booked_by_email,
        d.name as department_full_name
      FROM room_bookings rb
      JOIN rooms r ON rb.room_id = r.id
      JOIN users u ON rb.booked_by_user_id = u.id
      LEFT JOIN departments d ON rb.department_id = d.id
      WHERE rb.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch đặt phòng' });
    }

    // Get history
    const historyResult = await pool.query(`
      SELECT 
        action,
        performed_by_name,
        details,
        created_at
      FROM room_booking_history
      WHERE booking_id = $1
      ORDER BY created_at DESC
    `, [id]);

    res.json({ 
      booking: result.rows[0],
      history: historyResult.rows 
    });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin đặt phòng' });
  }
};

/**
 * Create new booking
 */
exports.createBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      room_id,
      title,
      description,
      meeting_type,
      attendees_count,
      booking_date,
      start_time,
      end_time,
      color,
      notes
    } = req.body;

    const userId = req.user.id;
    const userName = req.user.full_name;
    const departmentId = req.user.department_id;
    const departmentName = req.user.department_name;

    // Validate required fields
    if (!room_id || !title || !booking_date || !start_time || !end_time) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Check if room exists and is active
    const roomCheck = await client.query(
      'SELECT is_active FROM rooms WHERE id = $1',
      [room_id]
    );

    if (roomCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Phòng họp không tồn tại' });
    }

    if (!roomCheck.rows[0].is_active) {
      return res.status(400).json({ message: 'Phòng họp này hiện không khả dụng' });
    }

    // Check for conflicts
    const conflictCheck = await client.query(
      'SELECT check_booking_conflict($1, $2, $3, $4) as has_conflict',
      [room_id, booking_date, start_time, end_time]
    );

    if (conflictCheck.rows[0].has_conflict) {
      return res.status(409).json({ 
        message: 'Phòng đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác.' 
      });
    }

    // Calculate week number and year
    console.log('📅 Received booking_date from frontend:', booking_date);
    // Parse date in UTC to avoid timezone issues
    const [year, month, day] = booking_date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    console.log('📅 Parsed dateObj:', dateObj.toISOString(), 'Year:', year, 'Month:', month, 'Day:', day);
    const weekNumber = getWeekNumber(dateObj);

    // Get meeting type color if not provided
    const bookingColor = color || getMeetingTypeColor(meeting_type);

    console.log('💾 About to INSERT with values:', {
      room_id, title, meeting_type, attendees_count,
      booking_date, start_time, end_time, weekNumber, year,
      userId, userName, departmentId, departmentName
    });

    // Insert booking
    const insertResult = await client.query(`
      INSERT INTO room_bookings (
        room_id, title, description, meeting_type, attendees_count,
        booking_date, start_time, end_time, week_number, year,
        booked_by_user_id, booked_by_name, department_id, department_name,
        color, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending')
      RETURNING id
    `, [
      room_id, title, description, meeting_type, attendees_count,
      booking_date, start_time, end_time, weekNumber, year,
      userId, userName, departmentId, departmentName,
      bookingColor, notes
    ]);

    const bookingId = insertResult.rows[0].id;

    await client.query('COMMIT');

    // Send notification to admins (async, don't wait)
    sendBookingNotification(bookingId, 'created', userId).catch(console.error);

    res.status(201).json({ 
      message: 'Đặt phòng thành công. Vui lòng chờ admin phê duyệt.',
      booking_id: bookingId 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Lỗi khi tạo lịch đặt phòng' });
  } finally {
    client.release();
  }
};

/**
 * Update booking (only by owner)
 */
exports.updateBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check ownership
    const ownerCheck = await client.query(
      'SELECT booked_by_user_id, status FROM room_bookings WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch đặt phòng' });
    }

    const booking = ownerCheck.rows[0];

    // Only owner can edit (unless admin)
    if (booking.booked_by_user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa lịch đặt phòng này' });
    }

    // Can only edit pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        message: `Không thể chỉnh sửa lịch đặt phòng đã ${booking.status === 'confirmed' ? 'được phê duyệt' : 'bị hủy/từ chối'}` 
      });
    }

    const {
      room_id,
      title,
      description,
      meeting_type,
      attendees_count,
      booking_date,
      start_time,
      end_time,
      color,
      notes
    } = req.body;

    // Check for conflicts if time/room changed
    if (room_id || booking_date || start_time || end_time) {
      const conflictCheck = await client.query(
        'SELECT check_booking_conflict($1, $2, $3, $4, $5) as has_conflict',
        [
          room_id, 
          booking_date, 
          start_time, 
          end_time,
          id // Exclude current booking
        ]
      );

      if (conflictCheck.rows[0].has_conflict) {
        return res.status(409).json({ 
          message: 'Phòng đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác.' 
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (room_id) {
      updates.push(`room_id = $${paramIndex++}`);
      values.push(room_id);
    }
    if (title) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (meeting_type) {
      updates.push(`meeting_type = $${paramIndex++}`);
      values.push(meeting_type);
      // Update color based on meeting type if not explicitly provided
      if (!color) {
        updates.push(`color = $${paramIndex++}`);
        values.push(getMeetingTypeColor(meeting_type));
      }
    }
    if (attendees_count) {
      updates.push(`attendees_count = $${paramIndex++}`);
      values.push(attendees_count);
    }
    if (booking_date) {
      updates.push(`booking_date = $${paramIndex++}`);
      values.push(booking_date);
      
      const dateObj = new Date(booking_date);
      updates.push(`week_number = $${paramIndex++}`);
      values.push(getWeekNumber(dateObj));
      updates.push(`year = $${paramIndex++}`);
      values.push(dateObj.getFullYear());
    }
    if (start_time) {
      updates.push(`start_time = $${paramIndex++}`);
      values.push(start_time);
    }
    if (end_time) {
      updates.push(`end_time = $${paramIndex++}`);
      values.push(end_time);
    }
    if (color) {
      updates.push(`color = $${paramIndex++}`);
      values.push(color);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Không có thông tin nào được cập nhật' });
    }

    values.push(id);
    const updateQuery = `
      UPDATE room_bookings 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await client.query(updateQuery, values);
    await client.query('COMMIT');

    res.json({ message: 'Cập nhật lịch đặt phòng thành công' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật lịch đặt phòng' });
  } finally {
    client.release();
  }
};

/**
 * Approve booking (admin only)
 */
exports.approveBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const userId = req.user.id;
    const userName = req.user.name;
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền phê duyệt' });
    }

    // Check if booking exists and is pending
    const bookingCheck = await client.query(
      'SELECT booked_by_user_id, status FROM room_bookings WHERE id = $1',
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch đặt phòng' });
    }

    if (bookingCheck.rows[0].status !== 'pending') {
      return res.status(400).json({ 
        message: 'Lịch đặt phòng này đã được xử lý' 
      });
    }

    // Approve booking
    await client.query(`
      UPDATE room_bookings
      SET status = 'confirmed',
          approved_by_user_id = $1,
          approved_by_name = $2,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [userId, userName, id]);

    await client.query('COMMIT');

    // Send notification to booker (async)
    const bookedByUserId = bookingCheck.rows[0].booked_by_user_id;
    sendBookingNotification(id, 'approved', bookedByUserId, userName).catch(console.error);

    res.json({ message: 'Đã phê duyệt lịch đặt phòng thành công' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve booking error:', error);
    res.status(500).json({ message: 'Lỗi khi phê duyệt lịch đặt phòng' });
  } finally {
    client.release();
  }
};

/**
 * Reject booking (admin only)
 */
exports.rejectBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền từ chối' });
    }

    // Check if booking exists and is pending
    const bookingCheck = await client.query(
      'SELECT booked_by_user_id, status FROM room_bookings WHERE id = $1',
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch đặt phòng' });
    }

    if (bookingCheck.rows[0].status !== 'pending') {
      return res.status(400).json({ 
        message: 'Lịch đặt phòng này đã được xử lý' 
      });
    }

    // Reject booking
    await client.query(`
      UPDATE room_bookings
      SET status = 'rejected',
          approved_by_user_id = $1,
          approved_by_name = $2,
          approved_at = CURRENT_TIMESTAMP,
          rejection_reason = $3
      WHERE id = $4
    `, [userId, userName, reason || 'Không phù hợp', id]);

    await client.query('COMMIT');

    // Send notification to booker (async)
    const bookedByUserId = bookingCheck.rows[0].booked_by_user_id;
    sendBookingNotification(id, 'rejected', bookedByUserId, userName, reason).catch(console.error);

    res.json({ message: 'Đã từ chối lịch đặt phòng' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reject booking error:', error);
    res.status(500).json({ message: 'Lỗi khi từ chối lịch đặt phòng' });
  } finally {
    client.release();
  }
};

/**
 * Mark booking as completed (admin only)
 */
exports.completeBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const userId = req.user.id;
    const userName = req.user.name;
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền đánh dấu hoàn thành' });
    }

    // Check if booking exists and is confirmed
    const bookingCheck = await client.query(
      'SELECT booked_by_user_id, status FROM room_bookings WHERE id = $1',
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch đặt phòng' });
    }

    if (bookingCheck.rows[0].status !== 'confirmed') {
      return res.status(400).json({ 
        message: 'Chỉ có thể đánh dấu hoàn thành cho lịch đã được duyệt' 
      });
    }

    // Mark as completed
    await client.query(`
      UPDATE room_bookings
      SET status = 'completed'
      WHERE id = $1
    `, [id]);

    // Add history entry
    await client.query(`
      INSERT INTO booking_history (booking_id, action, performed_by_user_id, performed_by_name)
      VALUES ($1, 'completed', $2, $3)
    `, [id, userId, userName]);

    await client.query('COMMIT');

    res.json({ message: 'Đã đánh dấu cuộc họp là hoàn thành' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Complete booking error:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
  } finally {
    client.release();
  }
};

/**
 * Cancel booking (by owner or admin)
 */
exports.cancelBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const userId = req.user.id;
    const userName = req.user.name;
    const userRole = req.user.role;

    // Check ownership
    const bookingCheck = await client.query(
      'SELECT booked_by_user_id, status FROM room_bookings WHERE id = $1',
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch đặt phòng' });
    }

    const booking = bookingCheck.rows[0];

    // Only owner can cancel their own booking, admin can cancel any
    if (booking.booked_by_user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền hủy lịch đặt phòng này' });
    }

    // Can only cancel pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Không thể hủy lịch đặt phòng này' 
      });
    }

    // Cancel booking
    await client.query(`
      UPDATE room_bookings
      SET status = 'cancelled',
          approved_by_user_id = $1,
          approved_by_name = $2,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [userId, userName, id]);

    await client.query('COMMIT');

    // If admin cancelled someone else's booking, notify them
    if (userRole === 'admin' && booking.booked_by_user_id !== userId) {
      const bookedByUserId = booking.booked_by_user_id;
      sendBookingNotification(id, 'cancelled_by_admin', bookedByUserId, userName).catch(console.error);
    }

    res.json({ message: 'Đã hủy lịch đặt phòng thành công' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Lỗi khi hủy lịch đặt phòng' });
  } finally {
    client.release();
  }
};

/**
 * Bulk approve bookings (admin only)
 */
exports.bulkApproveBookings = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { booking_ids } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền phê duyệt' });
    }

    if (!Array.isArray(booking_ids) || booking_ids.length === 0) {
      return res.status(400).json({ message: 'Danh sách booking_ids không hợp lệ' });
    }

    // Get all pending bookings from the list
    const bookingsResult = await client.query(`
      SELECT id, booked_by_user_id
      FROM room_bookings
      WHERE id = ANY($1) AND status = 'pending'
    `, [booking_ids]);

    if (bookingsResult.rows.length === 0) {
      return res.status(400).json({ message: 'Không có lịch đặt phòng nào đang chờ phê duyệt' });
    }

    // Approve all
    await client.query(`
      UPDATE room_bookings
      SET status = 'confirmed',
          approved_by_user_id = $1,
          approved_by_name = $2,
          approved_at = CURRENT_TIMESTAMP
      WHERE id = ANY($3) AND status = 'pending'
    `, [userId, userName, booking_ids]);

    await client.query('COMMIT');

    // Send notifications (async)
    bookingsResult.rows.forEach(booking => {
      sendBookingNotification(booking.id, 'approved', booking.booked_by_user_id, userName).catch(console.error);
    });

    res.json({ 
      message: `Đã phê duyệt ${bookingsResult.rows.length} lịch đặt phòng thành công`,
      approved_count: bookingsResult.rows.length 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk approve bookings error:', error);
    res.status(500).json({ message: 'Lỗi khi phê duyệt hàng loạt' });
  } finally {
    client.release();
  }
};

/**
 * Get pending bookings for admin approval
 */
exports.getPendingBookings = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền xem danh sách chờ duyệt' });
    }

    const result = await pool.query(`
      SELECT * FROM v_pending_bookings
    `);

    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách chờ duyệt' });
  }
};

/**
 * Get my bookings (for current user)
 */
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, date_from, date_to } = req.query;

    let query = `
      SELECT 
        rb.*,
        r.room_code,
        r.room_name
      FROM room_bookings rb
      JOIN rooms r ON rb.room_id = r.id
      WHERE rb.booked_by_user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND rb.status = $${paramIndex++}`;
      params.push(status);
    }

    if (date_from && date_to) {
      query += ` AND rb.booking_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(date_from, date_to);
    }

    query += ` ORDER BY rb.booking_date DESC, rb.start_time DESC`;

    const result = await pool.query(query, params);

    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đặt phòng của bạn' });
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate ISO week number
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Get color based on meeting type
 */
function getMeetingTypeColor(meetingType) {
  const colorMap = {
    'department_meeting': '#3B82F6',    // Blue
    'team_standup': '#10B981',          // Green
    'project_review': '#8B5CF6',        // Purple
    'training_session': '#F59E0B',      // Amber
    'client_meeting': '#EC4899',        // Pink
    'interview': '#EF4444',             // Red
    'workshop': '#06B6D4',              // Cyan
    'company_event': '#F97316',         // Orange
    'celebration': '#A855F7',           // Violet
    'technical_discussion': '#6366F1',  // Indigo
    'brainstorming': '#14B8A6',         // Teal
    'presentation': '#84CC16',          // Lime
    'other': '#6B7280'                  // Gray
  };

  return colorMap[meetingType] || '#3B82F6';
}

/**
 * Send booking notification
 */
async function sendBookingNotification(bookingId, action, recipientUserId, adminName = null, reason = null) {
  try {
    // Get booking details
    const bookingResult = await pool.query(`
      SELECT 
        rb.title,
        TO_CHAR(rb.booking_date, 'YYYY-MM-DD') as booking_date,
        rb.start_time,
        rb.end_time,
        r.room_name
      FROM room_bookings rb
      JOIN rooms r ON rb.room_id = r.id
      WHERE rb.id = $1
    `, [bookingId]);

    if (bookingResult.rows.length === 0) return;

    const booking = bookingResult.rows[0];
    const dateStr = new Date(booking.booking_date).toLocaleDateString('vi-VN');

    let title, message, type;

    switch (action) {
      case 'created':
        // Notify all admins
        title = '🔔 Yêu cầu đặt phòng mới';
        message = `Có yêu cầu đặt phòng "${booking.title}" tại ${booking.room_name} vào ${dateStr} (${booking.start_time} - ${booking.end_time})`;
        type = 'booking_request';
        
        // Send to all admins
        await pool.query(`
          INSERT INTO notifications (user_id, type, title, message, reference_id)
          SELECT id, $1, $2, $3, $4
          FROM users
          WHERE role = 'admin' AND is_active = true
        `, [type, title, message, bookingId]);
        break;

      case 'approved':
        title = '✅ Lịch đặt phòng đã được phê duyệt';
        message = `Lịch đặt phòng "${booking.title}" tại ${booking.room_name} vào ${dateStr} (${booking.start_time} - ${booking.end_time}) đã được ${adminName} phê duyệt`;
        type = 'booking_approved';
        
        await pool.query(`
          INSERT INTO notifications (user_id, type, title, message, reference_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [recipientUserId, type, title, message, bookingId]);
        break;

      case 'rejected':
        title = '❌ Lịch đặt phòng đã bị từ chối';
        message = `Lịch đặt phòng "${booking.title}" tại ${booking.room_name} vào ${dateStr} đã bị ${adminName} từ chối${reason ? `: ${reason}` : ''}`;
        type = 'booking_rejected';
        
        await pool.query(`
          INSERT INTO notifications (user_id, type, title, message, reference_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [recipientUserId, type, title, message, bookingId]);
        break;

      case 'cancelled_by_admin':
        title = '🚫 Lịch đặt phòng đã bị hủy';
        message = `Lịch đặt phòng "${booking.title}" tại ${booking.room_name} vào ${dateStr} đã bị ${adminName} hủy`;
        type = 'booking_cancelled';
        
        await pool.query(`
          INSERT INTO notifications (user_id, type, title, message, reference_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [recipientUserId, type, title, message, bookingId]);
        break;
    }
  } catch (error) {
    console.error('Send booking notification error:', error);
  }
}
