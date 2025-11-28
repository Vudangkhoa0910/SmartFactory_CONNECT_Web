-- Migration: Change room_bookings user IDs from INTEGER to UUID
-- Run this to fix the type mismatch between users.id (UUID) and room_bookings user columns

BEGIN;

-- Drop foreign key constraints first (if they exist)
ALTER TABLE room_bookings 
  DROP CONSTRAINT IF EXISTS room_bookings_booked_by_user_id_fkey;

-- Change booked_by_user_id to UUID
ALTER TABLE room_bookings 
  ALTER COLUMN booked_by_user_id TYPE UUID USING NULL;

-- Change approved_by_user_id to UUID  
ALTER TABLE room_bookings
  ALTER COLUMN approved_by_user_id TYPE UUID USING NULL;

-- Change room_booking_history performed_by_user_id to UUID
ALTER TABLE room_booking_history
  ALTER COLUMN performed_by_user_id TYPE UUID USING NULL;

-- Re-add foreign key constraints
ALTER TABLE room_bookings
  ADD CONSTRAINT room_bookings_booked_by_user_id_fkey 
    FOREIGN KEY (booked_by_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE room_bookings
  ADD CONSTRAINT room_bookings_approved_by_user_id_fkey 
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE room_booking_history
  ADD CONSTRAINT room_booking_history_performed_by_user_id_fkey
    FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

COMMIT;

-- Verify changes
\d room_bookings
\d room_booking_history
