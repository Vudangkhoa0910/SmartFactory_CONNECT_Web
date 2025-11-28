-- Migration: Change room_bookings department_id from INTEGER to UUID
-- This fixes the type mismatch with departments.id

BEGIN;

-- Change department_id to UUID in room_bookings
ALTER TABLE room_bookings 
  ALTER COLUMN department_id TYPE UUID USING NULL;

-- Add foreign key constraint
ALTER TABLE room_bookings
  ADD CONSTRAINT room_bookings_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

COMMIT;

-- Verify changes
\d room_bookings
