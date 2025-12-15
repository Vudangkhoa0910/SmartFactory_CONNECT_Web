/**
 * Media Upload Helper
 * Utility functions to upload files to MongoDB GridFS
 */

const fs = require('fs').promises;
const MediaStorageService = require('../services/media-storage.service');

/**
 * Upload files from disk to MongoDB GridFS
 * @param {Array} files - Array of multer file objects
 * @param {Object} options - Upload options
 * @param {string} options.type - File type (incident, idea, news, etc.)
 * @param {string} options.relatedId - ID of related entity
 * @param {string} options.relatedType - Type of related entity
 * @param {string} options.uploadedBy - User ID who uploaded
 * @returns {Promise<Array>} Array of uploaded file metadata
 */
async function uploadFilesToGridFS(files, options = {}) {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadedFiles = [];

  for (const file of files) {
    try {
      // Read file from disk
      const fileBuffer = await fs.readFile(file.path);

      // Upload to GridFS
      const result = await MediaStorageService.uploadFile(fileBuffer, {
        filename: file.filename,
        originalName: file.originalname,
        contentType: file.mimetype,
        type: options.type || 'general',
        relatedId: options.relatedId || null,
        relatedType: options.relatedType || null,
        uploadedBy: options.uploadedBy || null,
      });

      // Add to uploaded files list
      uploadedFiles.push({
        file_id: result.fileId,
        filename: file.filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
        url: `/api/media/${result.fileId}`, // URL to access file
      });

      // Delete temp file from disk
      try {
        await fs.unlink(file.path);
        console.log(`🗑️ Deleted temp file: ${file.path}`);
      } catch (unlinkError) {
        console.warn(`⚠️ Could not delete temp file: ${file.path}`, unlinkError.message);
      }

    } catch (error) {
      console.error(`❌ Error uploading file ${file.originalname}:`, error.message);
      // Continue with other files even if one fails
    }
  }

  return uploadedFiles;
}

/**
 * Delete files from GridFS by file IDs
 * @param {Array} attachments - Array of attachment objects with file_id
 * @returns {Promise<number>} Number of deleted files
 */
async function deleteFilesFromGridFS(attachments) {
  if (!attachments || attachments.length === 0) {
    return 0;
  }

  let deletedCount = 0;

  for (const attachment of attachments) {
    try {
      if (attachment.file_id) {
        await MediaStorageService.deleteFile(attachment.file_id);
        deletedCount++;
      }
    } catch (error) {
      console.error(`❌ Error deleting file ${attachment.file_id}:`, error.message);
    }
  }

  return deletedCount;
}

/**
 * Update relatedId for files after entity is created
 * This is useful when we need to upload files before we have the entity ID
 * @param {Array} fileIds - Array of GridFS file IDs
 * @param {string} relatedId - The entity ID to associate with files
 * @param {string} relatedType - The entity type
 */
async function updateFilesRelatedId(fileIds, relatedId, relatedType) {
  const { getDB } = require('../config/mongodb');
  const { ObjectId } = require('mongodb');
  
  try {
    const db = getDB();
    
    for (const fileId of fileIds) {
      await db.collection('media.files').updateOne(
        { _id: new ObjectId(fileId) },
        { 
          $set: { 
            'metadata.relatedId': relatedId,
            'metadata.relatedType': relatedType 
          } 
        }
      );
    }
    
    console.log(`✅ Updated ${fileIds.length} files with relatedId: ${relatedId}`);
  } catch (error) {
    console.error('❌ Error updating files relatedId:', error.message);
  }
}

module.exports = {
  uploadFilesToGridFS,
  deleteFilesFromGridFS,
  updateFilesRelatedId,
};
