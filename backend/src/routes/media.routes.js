const express = require('express');
const router = express.Router();
const MediaStorageService = require('../services/media-storage.service');
const { authenticate } = require('../middlewares/auth.middleware');
const { ObjectId } = require('mongodb');

/**
 * Helper function to validate MongoDB ObjectId
 */
function isValidObjectId(id) {
  try {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
  } catch {
    return false;
  }
}

/**
 * @swagger
 * /api/media/stats/overview:
 *   get:
 *     summary: Get storage statistics
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 */
// IMPORTANT: Static routes MUST come BEFORE dynamic routes (:fileId)
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const stats = await MediaStorageService.getStorageStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting storage stats:', error.message);
    res.status(500).json({ success: false, message: 'Error getting storage stats' });
  }
});

/**
 * @swagger
 * /api/media/{fileId}:
 *   get:
 *     summary: Get/Download file from MongoDB GridFS
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB GridFS file ID (24-character hex string)
 *     responses:
 *       200:
 *         description: File content
 *       400:
 *         description: Invalid file ID format
 *       404:
 *         description: File not found
 */
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(fileId)) {
      return res.status(400).json({ success: false, message: 'Invalid file ID format' });
    }

    const fileData = await MediaStorageService.downloadFile(fileId);

    // Set headers
    res.set({
      'Content-Type': fileData.contentType,
      'Content-Length': fileData.size,
      'Content-Disposition': `inline; filename="${fileData.filename}"`,
      'Cache-Control': 'public, max-age=86400', // Cache 1 day
    });

    // Pipe stream to response with error handling
    fileData.stream.on('error', (streamError) => {
      console.error('Stream error:', streamError.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error streaming file' });
      }
    });

    fileData.stream.pipe(res);
  } catch (error) {
    console.error('Error serving file:', error.message);
    if (error.message === 'File not found') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.status(500).json({ success: false, message: 'Error serving file' });
  }
});

/**
 * @swagger
 * /api/media/{fileId}/download:
 *   get:
 *     summary: Force download file
 *     tags: [Media]
 */
router.get('/:fileId/download', async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(fileId)) {
      return res.status(400).json({ success: false, message: 'Invalid file ID format' });
    }

    const fileData = await MediaStorageService.downloadFile(fileId);

    res.set({
      'Content-Type': fileData.contentType,
      'Content-Length': fileData.size,
      'Content-Disposition': `attachment; filename="${fileData.filename}"`,
    });

    // Error handling for stream
    fileData.stream.on('error', (streamError) => {
      console.error('Stream error:', streamError.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Error streaming file' });
      }
    });

    fileData.stream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error.message);
    if (error.message === 'File not found') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.status(500).json({ success: false, message: 'Error downloading file' });
  }
});

/**
 * @swagger
 * /api/media/{fileId}/info:
 *   get:
 *     summary: Get file metadata
 *     tags: [Media]
 */
router.get('/:fileId/info', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(fileId)) {
      return res.status(400).json({ success: false, message: 'Invalid file ID format' });
    }

    const metadata = await MediaStorageService.getFileMetadata(fileId);

    res.json({ success: true, data: metadata });
  } catch (error) {
    console.error('Error getting file info:', error.message);
    if (error.message === 'File not found') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.status(500).json({ success: false, message: 'Error getting file info' });
  }
});

/**
 * @swagger
 * /api/media/{fileId}:
 *   delete:
 *     summary: Delete file from MongoDB GridFS
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:fileId', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(fileId)) {
      return res.status(400).json({ success: false, message: 'Invalid file ID format' });
    }

    await MediaStorageService.deleteFile(fileId);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error.message);
    res.status(500).json({ success: false, message: 'Error deleting file' });
  }
});

module.exports = router;
