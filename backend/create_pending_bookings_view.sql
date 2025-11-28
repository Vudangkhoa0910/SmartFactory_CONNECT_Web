-- Create view for pending bookings
CREATE OR REPLACE VIEW v_pending_bookings AS
SELECT 
  rb.id,
  rb.room_id,
  r.room_code,
  r.room_name,
  rb.title,
  rb.meeting_type,
  rb.attendees_count,
  rb.booking_date,
  rb.start_time,
  rb.end_time,
  rb.booked_by_user_id,
  rb.booked_by_name,
  u.email as booked_by_email,
  rb.department_name,
  rb.created_at,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - rb.created_at))/3600 as hours_waiting
FROM room_bookings rb
JOIN rooms r ON rb.room_id = r.id
JOIN users u ON rb.booked_by_user_id = u.id
WHERE rb.status = 'pending'
ORDER BY rb.created_at ASC;

-- Check if view was created successfully
SELECT COUNT(*) as pending_count FROM v_pending_bookings;
