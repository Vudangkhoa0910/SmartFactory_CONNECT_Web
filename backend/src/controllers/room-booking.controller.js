/**
 * ROOM BOOKING CONTROLLER
 * Handles all room booking operations with approval workflow
 */

const { pool, query } = require('../config/database');

/**
 * Get all rooms with availability info
 */
exports.getRooms = async (req, res) => {
  try {
    console.log('🔍 getRooms called');
    const result = await query(`
      SELECT 
        id, code, name, name_ja, capacity, floor, building,
        description, is_active, status, requires_approval
      FROM rooms
      WHERE is_active = true
      ORDER BY code
    `);

    console.log(`✅ getRooms found ${result.rowCount} active rooms`);
    res.json({ rooms: result.rows || [] });
  } catch (error) {
    console.error('❌ Get rooms error:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách phòng họp',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get bookings for a specific week
 * Can filter by room, status, date range
 */
exports.getBookings = async (req, res) => {
  try {
    const {
      room_id,
      status,
      date_from,
      date_to
    } = req.query;

    let sql = `
      SELECT 
        rb.id,
        rb.room_id,
        r.code as room_code,
        r.name as room_name,
        rb.title,
        rb.title_ja,
        rb.description,
        rb.purpose,
        rb.expected_attendees,
        rb.start_time,
        rb.end_time,
        rb.user_id,
        u.full_name as booked_by_name,
        d.name as department_name,
        rb.status,
        rb.rejection_reason,
        rb.created_at,
        rb.updated_at
      FROM room_bookings rb
      JOIN rooms r ON rb.room_id = r.id
      JOIN users u ON rb.user_id = u.id
      LEFT JOIN departments d ON rb.department_id = d.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (date_from && date_to) {
      sql += ` AND rb.start_time >= $${paramIndex++} AND rb.start_time <= $${paramIndex++}`;
      params.push(date_from, date_to);
    } else {
      // Default: show from today onwards for 30 days if no range
      sql += ` AND rb.start_time >= CURRENT_DATE`;
    }

    if (room_id) {
      sql += ` AND rb.room_id = $${paramIndex++}`;
      params.push(room_id);
    }

    if (status) {
      sql += ` AND rb.status = $${paramIndex++}`;
      params.push(status);
    } else {
      // Default: only show active bookings for general calendar view
      sql += ` AND rb.status IN ('pending', 'confirmed', 'in_progress')`;
    }

    sql += ` ORDER BY rb.start_time`;

    console.log('🔍 Executing getBookings query:', sql, params);
    const result = await query(sql, params);

    console.log(`✅ getBookings found ${result.rowCount} bookings`);
    res.json({ bookings: result.rows || [] });
  } catch (error) {
    console.error('❌ Get bookings error:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách đặt phòng',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get booking by ID with full details
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        rb.*,
        r.code as room_code,
        r.name as room_name,
        r.capacity,
        r.floor,
        u.email as booked_by_email,
        u.full_name as booked_by_name,
        d.name as department_full_name
      FROM room_bookings rb
      JOIN rooms r ON rb.room_id = r.id
      JOIN users u ON rb.user_id = u.id
      LEFT JOIN departments d ON rb.department_id = d.id
      WHERE rb.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch đặt phòng' });
    }

    res.json({
      booking: result.rows[0]
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
      title_ja,
      description,
      purpose,
      expected_attendees,
      start_time,
      end_time,
      attendee_emails,
      is_recurring,
      recurring_pattern,
      recurring_end_date,
      notes,
      special_requirements
    } = req.body;

    const userId = req.user.id;
    const departmentId = req.user.department_id;

    // Validate required fields
    if (!room_id || !title || !start_time || !end_time) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Check if room exists and is active
    const roomCheck = await client.query(
      'SELECT is_active, requires_approval FROM rooms WHERE id = $1',
      [room_id]
    );

    if (roomCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Phòng họp không tồn tại' });
    }

    if (!roomCheck.rows[0].is_active) {
      return res.status(400).json({ message: 'Phòng họp này hiện không khả dụng' });
    }

    // Check for conflicts
    const conflictCheck = await client.query(`
      SELECT COUNT(*) as conflict_count 
      FROM room_bookings 
      WHERE room_id = $1 
      AND status NOT IN ('cancelled')
      AND (
        (start_time <= $2 AND end_time > $2) OR
        (start_time < $3 AND end_time >= $3) OR
        (start_time >= $2 AND end_time <= $3)
      )
    `, [room_id, start_time, end_time]);

    if (parseInt(conflictCheck.rows[0].conflict_count) > 0) {
      return res.status(409).json({
        message: 'Phòng đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác.'
      });
    }

    const requiresApproval = roomCheck.rows[0].requires_approval;
    const initialStatus = requiresApproval ? 'pending' : 'confirmed';

    // Insert booking
    const insertResult = await client.query(`
      INSERT INTO room_bookings (
        room_id, user_id, title, title_ja, description, 
        purpose, start_time, end_time, expected_attendees, attendee_emails,
        status, is_recurring, recurring_pattern, recurring_end_date, 
        notes, special_requirements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id
    `, [
      room_id, userId, title, title_ja, description,
      purpose, start_time, end_time, expected_attendees || 1, attendee_emails || [],
      initialStatus, is_recurring || false, recurring_pattern, recurring_end_date,
      notes, special_requirements
    ]);

    const bookingId = insertResult.rows[0].id;

    await client.query('COMMIT');

    res.status(201).json({
      message: initialStatus === 'pending'
        ? 'Đặt phòng thành công. Vui lòng chờ admin phê duyệt.'
        : 'Đặt phòng thành công.',
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
      'SELECT user_id, status, room_id, start_time, end_time FROM room_bookings WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch đặt phòng' });
    }

    const booking = ownerCheck.rows[0];

    // Only owner can edit (unless admin)
    if (booking.user_id !== userId && userRole !== 'admin') {
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
      title_ja,
      description,
      purpose,
      expected_attendees,
      start_time,
      end_time,
      attendee_emails,
      notes,
      special_requirements
    } = req.body;

    // Check for conflicts if time/room changed
    if (room_id || start_time || end_time) {
      const conflictCheck = await client.query(`
        SELECT COUNT(*) as conflict_count 
        FROM room_bookings 
        WHERE room_id = $1 
        AND id != $4
        AND status NOT IN ('cancelled')
        AND (
          (start_time <= $2 AND end_time > $2) OR
          (start_time < $3 AND end_time >= $3) OR
          (start_time >= $2 AND end_time <= $3)
        )
      `, [
        room_id || booking.room_id,
        start_time || booking.start_time,
        end_time || booking.end_time,
        id
      ]);

      if (parseInt(conflictCheck.rows[0].conflict_count) > 0) {
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
    if (title_ja !== undefined) {
      updates.push(`title_ja = $${paramIndex++}`);
      values.push(title_ja);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (purpose) {
      updates.push(`purpose = $${paramIndex++}`);
      values.push(purpose);
    }
    if (expected_attendees) {
      updates.push(`expected_attendees = $${paramIndex++}`);
      values.push(expected_attendees);
    }
    if (start_time) {
      updates.push(`start_time = $${paramIndex++}`);
      values.push(start_time);
    }
    if (end_time) {
      updates.push(`end_time = $${paramIndex++}`);
      values.push(end_time);
    }
    if (attendee_emails) {
      updates.push(`attendee_emails = $${paramIndex++}`);
      values.push(attendee_emails);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }
    if (special_requirements !== undefined) {
      updates.push(`special_requirements = $${paramIndex++}`);
      values.push(special_requirements);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Không có thông tin nào được cập nhật' });
    }

    values.push(id);
    const updateQuery = `
      UPDATE room_bookings 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
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
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền phê duyệt' });
    }

    // Check if booking exists and is pending
    const bookingCheck = await client.query(
      'SELECT status, user_id FROM room_bookings WHERE id = $1',
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
      approved_by = $1,
      approved_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [userId, id]);

    await client.query('COMMIT');

    // Send notification to booker (async)
    const bookedByUserId = bookingCheck.rows[0].user_id;
    sendBookingNotification(id, 'approved', bookedByUserId, req.user.full_name).catch(console.error);

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
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền từ chối' });
    }

    // Check if booking exists and is pending
    const bookingCheck = await client.query(
      'SELECT status, user_id FROM room_bookings WHERE id = $1',
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
      approved_by = $1,
      approved_at = CURRENT_TIMESTAMP,
      rejection_reason = $2
      WHERE id = $3
    `, [userId, reason || 'Không phù hợp', id]);

    await client.query('COMMIT');

    // Send notification to booker (async)
    const bookedByUserId = bookingCheck.rows[0].user_id;
    sendBookingNotification(id, 'rejected', bookedByUserId, req.user.full_name, reason).catch(console.error);

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
      'SELECT user_id, status FROM room_bookings WHERE id = $1',
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
    const { reason } = req.body || {};
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check ownership
    const bookingCheck = await client.query(
      'SELECT user_id, status FROM room_bookings WHERE id = $1',
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch đặt phòng' });
    }

    const booking = bookingCheck.rows[0];

    // Only owner can cancel their own booking, admin can cancel any
    if (booking.user_id !== userId && userRole !== 'admin') {
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
      cancelled_by = $1,
      cancelled_at = CURRENT_TIMESTAMP,
      cancellation_reason = $2
      WHERE id = $3
    `, [userId, reason || 'Người dùng hủy', id]);

    await client.query('COMMIT');

    // If admin cancelled someone else's booking, notify them
    if (userRole === 'admin' && booking.user_id !== userId) {
      const bookedByUserId = booking.user_id;
      sendBookingNotification(id, 'cancelled_by_admin', bookedByUserId, req.user.full_name).catch(console.error);
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
      SELECT id, user_id
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
      approved_by = $1,
      approved_at = CURRENT_TIMESTAMP
      WHERE id = ANY($2) AND status = 'pending'
    `, [userId, booking_ids]);

    await client.query('COMMIT');

    // Send notifications (async)
    bookingsResult.rows.forEach(booking => {
      sendBookingNotification(booking.id, 'approved', booking.user_id, userName).catch(console.error);
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
 * Get my bookings (for current user)
 */
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, date_from, date_to } = req.query;

    let sql = `
      SELECT 
        rb.*,
        r.code as room_code,
        r.name as room_name
      FROM room_bookings rb
      JOIN rooms r ON rb.room_id = r.id
      WHERE rb.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND rb.status = $${paramIndex++}`;
      params.push(status);
    }

    if (date_from && date_to) {
      sql += ` AND rb.start_time BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(date_from, date_to);
    }

    sql += ` ORDER BY rb.start_time DESC`;

    const result = await query(sql, params);

    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đặt phòng của bạn' });
  }
};

/**
 * Get pending bookings for approval
 * Only for Supervisor+ (Level 3+)
 */
exports.getPendingBookings = async (req, res) => {
  try {
    const { department_id, room_id } = req.query;

    // Simple pagination fallback if getPagination not available
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT rb.*,
        r.name as room_name,
        r.code as room_code,
        r.floor as room_floor,
        r.building as room_building,
        u.full_name as user_name,
        u.employee_code,
        d.name as department_name
      FROM room_bookings rb
      LEFT JOIN rooms r ON rb.room_id = r.id
      LEFT JOIN users u ON rb.user_id = u.id
      LEFT JOIN departments d ON rb.department_id = d.id
      WHERE rb.status = 'pending'
    `;

    const params = [];
    let paramIndex = 1;

    // Filter by department for supervisors (Level 3)
    if (req.user.level === 3 && req.user.department_id) {
      sql += ` AND rb.department_id = $${paramIndex++}`;
      params.push(req.user.department_id);
    } else if (department_id) {
      sql += ` AND rb.department_id = $${paramIndex++}`;
      params.push(department_id);
    }

    if (room_id) {
      sql += ` AND rb.room_id = $${paramIndex++}`;
      params.push(room_id);
    }

    sql += ` ORDER BY rb.created_at DESC`;
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(sql, params);

    // Count total pending
    const countQuery = `
      SELECT COUNT(*) FROM room_bookings rb
      WHERE rb.status = 'pending'
      ${req.user.level === 3 && req.user.department_id ? ` AND rb.department_id = '${req.user.department_id}'` : ''}
    `;
    const countResult = await pool.query(countQuery);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending bookings',
      message: error.message
    });
  }
};

/**
 * Get booking history (change log)
 */
exports.getBookingHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // First check if booking exists and user has access
    const bookingCheck = await pool.query(
      `SELECT user_id, department_id FROM room_bookings WHERE id = $1`,
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const booking = bookingCheck.rows[0];

    // Check access: owner or level 3+
    if (booking.user_id !== req.user.id && req.user.level > 3) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own booking history.'
      });
    }

    // Get history
    const result = await pool.query(`
      SELECT rbh.*,
        u.full_name as changed_by_name,
        u.employee_code as changed_by_code
      FROM room_booking_history rbh
      LEFT JOIN users u ON rbh.changed_by = u.id
      WHERE rbh.booking_id = $1
      ORDER BY rbh.created_at DESC
    `, [id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get booking history',
      message: error.message
    });
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
        TO_CHAR(rb.start_time, 'YYYY-MM-DD') as booking_date,
        TO_CHAR(rb.start_time, 'HH24:MI') as start_time_str,
        TO_CHAR(rb.end_time, 'HH24:MI') as end_time_str,
        r.name as room_name
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
        message = `Có yêu cầu đặt phòng "${booking.title}" tại ${booking.room_name} vào ${dateStr} (${booking.start_time_str} - ${booking.end_time_str})`;
        type = 'booking_request';

        // Send to all admins
        await pool.query(`
          INSERT INTO notifications (user_id, type, title, message, reference_id)
          SELECT id, $1, $2, $3, $4
          FROM users
          WHERE (role = 'admin' OR level <= 2) AND is_active = true
        `, [type, title, message, bookingId]);
        break;

      case 'approved':
        title = '✅ Lịch đặt phòng đã được phê duyệt';
        message = `Lịch đặt phòng "${booking.title}" tại ${booking.room_name} vào ${dateStr} (${booking.start_time_str} - ${booking.end_time_str}) đã được ${adminName} phê duyệt`;
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

/**
 * Check room availability for a specific time slot
 * GET /api/room-bookings/availability
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { room_id, start_time, end_time, exclude_booking_id } = req.query;

    if (!room_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'room_id, start_time, and end_time are required'
      });
    }

    // Check for conflicts
    const conflictQuery = `
      SELECT id, title, start_time, end_time
      FROM room_bookings
      WHERE room_id = $1
      AND status NOT IN ('cancelled')
      AND (
        (start_time <= $2 AND end_time > $2) OR
        (start_time < $3 AND end_time >= $3) OR
        (start_time >= $2 AND end_time <= $3)
      )
      ${exclude_booking_id ? 'AND id != $4' : ''}
    `;

    const conflictParams = [room_id, start_time, end_time];
    if (exclude_booking_id) conflictParams.push(exclude_booking_id);

    const conflicts = await pool.query(conflictQuery, conflictParams);

    res.json({
      success: true,
      available: conflicts.rows.length === 0,
      conflicts: conflicts.rows
    });
  } catch (error) {
    console.error('Check room availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check room availability',
      error: error.message
    });
  }
};
