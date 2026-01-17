/**
 * ROOM BOOKING ROUTES
 * SmartFactory CONNECT
 */

const express = require('express');
const router = express.Router();
const roomBookingController = require('../controllers/room-booking.controller');
const {
    authenticate,
    authorizeRoomManagement,
    authorizeRoomApproval
} = require('../middlewares/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validation.middleware');

// Apply authentication to all routes
router.use(authenticate);

// =====================================================
// STATIC ROUTES FIRST (must be before /:id routes)
// =====================================================

/**
 * GET /api/room-bookings/rooms
 * Get all available meeting rooms
 */
router.get('/rooms', roomBookingController.getRooms);

/**
 * GET /api/room-bookings/my
 * Get current user's bookings
 */
router.get('/my', roomBookingController.getMyBookings);

/**
 * GET /api/room-bookings/pending
 * Get pending bookings for approval
 */
router.get('/pending', authorizeRoomApproval, roomBookingController.getPendingBookings);

/**
 * GET /api/room-bookings/availability
 * Check room availability
 */
router.get('/availability', roomBookingController.checkAvailability);

/**
 * POST /api/room-bookings/bulk-approve
 */
router.post('/bulk-approve', authorizeRoomApproval, roomBookingController.bulkApproveBookings);

/**
 * GET /api/room-bookings
 * Get bookings with optional filters
 */
router.get('/', roomBookingController.getBookings);

/**
 * POST /api/room-bookings
 * Create new booking
 */
router.post('/', roomBookingController.createBooking);

// =====================================================
// DYNAMIC ID ROUTES (must be AFTER all static routes)
// =====================================================

/**
 * Middleware to validate that :id parameter is a valid UUID
 */
const validateUUID = (req, res, next) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid booking ID format. ID must be a valid UUID.',
            error: `Received: ${id}`
        });
    }
    next();
};

/**
 * GET /api/room-bookings/:id
 * Get booking by ID
 */
router.get('/:id', validateUUID, roomBookingController.getBookingById);

/**
 * GET /api/room-bookings/:id/history
 * Get booking change history
 */
router.get('/:id/history', validateUUID, roomBookingController.getBookingHistory);

/**
 * PUT /api/room-bookings/:id
 * Update booking
 */
router.put('/:id', validateUUID, roomBookingController.updateBooking);

/**
 * POST /api/room-bookings/:id/approve
 * Approve or reject booking
 */
router.post('/:id/approve',
    validateUUID,
    authorizeRoomApproval,
    [
        body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
        body('rejection_reason').if(body('action').equals('reject')).notEmpty().withMessage('Rejection reason is required')
    ],
    validate,
    roomBookingController.approveBooking
);

/**
 * POST /api/room-bookings/:id/reject
 * Reject booking (Legacy support or explicit endpoint)
 */
router.post('/:id/reject', validateUUID, authorizeRoomApproval, roomBookingController.rejectBooking);

/**
 * POST /api/room-bookings/:id/complete
 * Mark booking as completed
 */
router.post('/:id/complete', validateUUID, authorizeRoomApproval, roomBookingController.completeBooking);

/**
 * POST /api/room-bookings/:id/cancel
 * Cancel booking (alternative to DELETE)
 */
router.post('/:id/cancel', validateUUID, roomBookingController.cancelBooking);

/**
 * DELETE /api/room-bookings/:id
 * Cancel booking
 */
router.delete('/:id', validateUUID, roomBookingController.cancelBooking);

module.exports = router;
