/**
 * SETUP ROOM BOOKING SYSTEM DATABASE
 * Run this script to create all necessary tables and seed data
 * 
 * Usage: node setup-room-booking-db.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool instance
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smartfactory_db',
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD || '',
});

async function setupRoomBookingDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Room Booking System Database Setup...\n');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'src', 'database', 'schema_room_booking_simple.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing schema from:', schemaPath);

    // Execute the schema
    await client.query(schema);

    console.log('\n✅ Room Booking System Database Setup Complete!\n');
    console.log('📋 Created:');
    console.log('   - rooms table (5 meeting rooms seeded)');
    console.log('   - room_bookings table');
    console.log('   - room_booking_history table');
    console.log('   - meeting_type enum (13 types)');
    console.log('   - booking_status enum (5 statuses)');
    console.log('   - Indexes for performance');
    console.log('   - Triggers for auto-logging');
    console.log('   - Helper functions');
    console.log('   - Views for common queries\n');

    // Verify the rooms were created
    const roomsResult = await client.query('SELECT room_code, room_name, capacity FROM rooms ORDER BY room_code');
    
    console.log('🏢 Meeting Rooms Created:');
    roomsResult.rows.forEach(room => {
      console.log(`   ${room.room_code} - ${room.room_name} (capacity: ${room.capacity} people)`);
    });
    
    console.log('\n🎉 Setup successful! You can now start using the Room Booking System.\n');
    console.log('📝 Next steps:');
    console.log('   1. Start the backend server: npm start');
    console.log('   2. Test API endpoints at: http://localhost:3001/api/room-bookings');
    console.log('   3. Implement the frontend calendar UI\n');

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupRoomBookingDatabase();
