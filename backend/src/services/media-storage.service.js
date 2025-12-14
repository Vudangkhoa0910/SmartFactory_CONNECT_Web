/**
 * Media Storage Service - Using MongoDB GridFS
 * Handles image and document uploads to MongoDB
 */

const { Readable } = require('stream');
const { getGridFSBucket, getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

class MediaStorageService {
  /**
   * Upload file to MongoDB GridFS
   * @param {Buffer} fileBuffer - File data as buffer
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} Upload result with file ID
   */
  static async uploadFile(fileBuffer, metadata) {
    try {
      const gridFSBucket = getGridFSBucket();
      
      // Create readable stream from buffer
      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);

      // Prepare file metadata
      const fileMetadata = {
        filename: metadata.filename || 'unnamed',
        contentType: metadata.contentType || 'application/octet-stream',
        size: fileBuffer.length,
        uploadDate: new Date(),
        type: metadata.type || 'general', // incident, idea, news, profile, etc.
        relatedId: metadata.relatedId || null, // ID of related entity
        relatedType: metadata.relatedType || null, // Type of related entity
        uploadedBy: metadata.uploadedBy || null,
        originalName: metadata.originalName || metadata.filename,
      };

      // Upload to GridFS
      const uploadStream = gridFSBucket.openUploadStream(metadata.filename, {
        metadata: fileMetadata,
        contentType: metadata.contentType,
      });

      // Pipe buffer to GridFS
      await new Promise((resolve, reject) => {
        readableStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', resolve);
      });

      console.log(`✅ File uploaded to MongoDB: ${metadata.filename} (${fileMetadata.size} bytes)`);

      return {
        success: true,
        fileId: uploadStream.id.toString(),
        filename: metadata.filename,
        size: fileMetadata.size,
        contentType: metadata.contentType,
        metadata: fileMetadata,
      };
    } catch (error) {
      console.error('❌ Error uploading file to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Download file from MongoDB GridFS
   * @param {string} fileId - GridFS file ID
   * @returns {Promise<Object>} File stream and metadata
   */
  static async downloadFile(fileId) {
    try {
      const gridFSBucket = getGridFSBucket();
      const db = getDB();

      // Get file metadata
      const file = await db.collection('media.files').findOne({ 
        _id: new ObjectId(fileId) 
      });

      if (!file) {
        throw new Error('File not found');
      }

      // Create download stream
      const downloadStream = gridFSBucket.openDownloadStream(new ObjectId(fileId));

      return {
        stream: downloadStream,
        metadata: file.metadata,
        filename: file.filename,
        contentType: file.metadata?.contentType || 'application/octet-stream',
        size: file.length,
      };
    } catch (error) {
      console.error('❌ Error downloading file from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Delete file from MongoDB GridFS
   * @param {string} fileId - GridFS file ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteFile(fileId) {
    try {
      const gridFSBucket = getGridFSBucket();
      
      await gridFSBucket.delete(new ObjectId(fileId));
      
      console.log(`✅ File deleted from MongoDB: ${fileId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting file from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   * @param {string} fileId - GridFS file ID
   * @returns {Promise<Object>} File metadata
   */
  static async getFileMetadata(fileId) {
    try {
      const db = getDB();
      
      const file = await db.collection('media.files').findOne({ 
        _id: new ObjectId(fileId) 
      });

      if (!file) {
        throw new Error('File not found');
      }

      return {
        fileId: file._id.toString(),
        filename: file.filename,
        contentType: file.metadata?.contentType,
        size: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata,
      };
    } catch (error) {
      console.error('❌ Error getting file metadata:', error);
      throw error;
    }
  }

  /**
   * List files by criteria
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Array>} List of files
   */
  static async listFiles(filter = {}, options = {}) {
    try {
      const db = getDB();
      const { limit = 50, skip = 0, sort = { uploadDate: -1 } } = options;

      // Build query filter
      const query = {};
      if (filter.type) query['metadata.type'] = filter.type;
      if (filter.relatedId) query['metadata.relatedId'] = filter.relatedId;
      if (filter.uploadedBy) query['metadata.uploadedBy'] = filter.uploadedBy;

      const files = await db.collection('media.files')
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();

      return files.map(file => ({
        fileId: file._id.toString(),
        filename: file.filename,
        contentType: file.metadata?.contentType,
        size: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata,
      }));
    } catch (error) {
      console.error('❌ Error listing files:', error);
      throw error;
    }
  }

  /**
   * Delete files by related entity
   * @param {string} relatedId - Related entity ID
   * @param {string} relatedType - Related entity type
   * @returns {Promise<number>} Number of deleted files
   */
  static async deleteFilesByRelatedId(relatedId, relatedType = null) {
    try {
      const db = getDB();
      const gridFSBucket = getGridFSBucket();

      // Find files
      const query = { 'metadata.relatedId': relatedId };
      if (relatedType) query['metadata.relatedType'] = relatedType;

      const files = await db.collection('media.files').find(query).toArray();

      // Delete each file
      for (const file of files) {
        await gridFSBucket.delete(file._id);
      }

      console.log(`✅ Deleted ${files.length} files for ${relatedType || 'entity'}: ${relatedId}`);
      return files.length;
    } catch (error) {
      console.error('❌ Error deleting files by related ID:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  static async getStorageStats() {
    try {
      const db = getDB();

      const stats = await db.collection('media.files').aggregate([
        {
          $group: {
            _id: '$metadata.type',
            count: { $sum: 1 },
            totalSize: { $sum: '$length' },
          }
        }
      ]).toArray();

      const total = await db.collection('media.files').countDocuments();
      const totalSize = await db.collection('media.files').aggregate([
        { $group: { _id: null, total: { $sum: '$length' } } }
      ]).toArray();

      return {
        total,
        totalSize: totalSize[0]?.total || 0,
        byType: stats,
      };
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      throw error;
    }
  }
}

module.exports = MediaStorageService;
