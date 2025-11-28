/**
 * ROOM BOOKING ROUTES
 */

const express = require('express');
const router = express.Router();
const roomBookingController = require('../controllers/room-booking.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Apply authentication to all routes
router.use(authenticate);

// =====================================================
// ROOMS ENDPOINTS
// =====================================================

/**
 * GET /api/room-bookings/rooms
 * Get all available meeting rooms
 */
router.get('/rooms', roomBookingController.getRooms);

// =====================================================
// BOOKINGS ENDPOINTS
// =====================================================

/**
 * GET /api/room-bookings
 * Get bookings with optional filters
 * Query params: week_number, year, room_id, status, date_from, date_to
 */
router.get('/', roomBookingController.getBookings);

/**
 * GET /api/room-bookings/my
 * Get current user's bookings
 */
router.get('/my', roomBookingController.getMyBookings);

/**
 * GET /api/room-bookings/pending
 * Get pending bookings for admin approval (Admin only)
 */
router.get('/pending', roomBookingController.getPendingBookings);

/**
 * POST /api/room-bookings
 * Create new booking
 */
router.post('/', roomBookingController.createBooking);

/**
 * POST /api/room-bookings/bulk-approve
 * Bulk approve multiple bookings (Admin only)
 * Body: { booking_ids: number[] }
 */
router.post('/bulk-approve', roomBookingController.bulkApproveBookings);

/**
 * GET /api/room-bookings/:id
 * Get booking by ID with full details
 */
router.get('/:id', roomBookingController.getBookingById);

/**
 * PUT /api/room-bookings/:id
 * Update booking (owner only, pending status only)
 */
router.put('/:id', roomBookingController.updateBooking);

/**
 * POST /api/room-bookings/:id/approve
 * Approve booking (Admin only)
 */
router.post('/:id/approve', roomBookingController.approveBooking);

/**
 * POST /api/room-bookings/:id/reject
 * Reject booking (Admin only)
 * Body: { reason: string }
 */
router.post('/:id/reject', roomBookingController.rejectBooking);

/**
 * POST /api/room-bookings/:id/complete
 * Mark booking as completed (Admin only)
 */
router.post('/:id/complete', roomBookingController.completeBooking);

/**
 * DELETE /api/room-bookings/:id
 * Cancel booking (owner or admin)
 */
router.delete('/:id', roomBookingController.cancelBooking);

module.exports = router;
