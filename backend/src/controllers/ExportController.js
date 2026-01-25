/**
 * Export Controller
 * Handles dataset export API endpoints
 */

const path = require('path');
const fs = require('fs').promises;
const { generateYOLODataset, cleanupExpiredExports } = require('../services/datasetExportService');
const {
  DEFAULT_SPLIT_RATIO,
  EXPORT_FORMATS,
  ANNOTATION_STATUS,
  MAX_EXPORT_SIZE,
  SYNC_EXPORT_WARNING_SIZE,
  EXPORT_EXPIRATION_SECONDS,
  ERROR_CODES,
  ALLOWED_ROLES,
  TEMP_DIR_PATH
} = require('../constants/export');

// In-memory store for export jobs (in production, use Redis or database)
const exportJobs = new Map();

/**
 * Validate export parameters
 * @param {Object} params - Export parameters
 * @throws {Error} - If validation fails
 */
function validateExportParams(params) {
  const { visitIds, patientIds, format, split } = params;
  
  // Must provide either visitIds or patientIds
  if (!visitIds && !patientIds) {
    throw new Error('Either visitIds or patientIds must be provided');
  }
  
  if (visitIds && !Array.isArray(visitIds)) {
    throw new Error('visitIds must be an array');
  }
  
  if (patientIds && !Array.isArray(patientIds)) {
    throw new Error('patientIds must be an array');
  }
  
  // Validate format
  if (format && !Object.values(EXPORT_FORMATS).includes(format)) {
    throw new Error(`${ERROR_CODES.INVALID_FORMAT}: Format must be one of: ${Object.values(EXPORT_FORMATS).join(', ')}`);
  }
  
  // Validate split ratios
  if (split) {
    const { train, val, test } = split;
    if (train < 0 || val < 0 || test < 0) {
      throw new Error(`${ERROR_CODES.INVALID_SPLIT_RATIO}: Split ratios must be positive`);
    }
    
    const sum = (train || 0) + (val || 0) + (test || 0);
    if (Math.abs(sum - 1.0) > 0.001) {
      throw new Error(`${ERROR_CODES.INVALID_SPLIT_RATIO}: Split ratios must sum to 1.0, got ${sum}`);
    }
  }
}

/**
 * Check user authorization for export
 * @param {Object} user - User object from JWT
 * @param {Array} visitIds - Visit IDs to export
 * @throws {Error} - If unauthorized
 */
async function checkAuthorization(user, visitIds) {
  // Fetch complete user info from database if role is missing
  let userRole = user.role;
  if (!userRole) {
    console.log('Role missing in JWT, fetching from database...');
    const User = require('../models/User');
    const fullUser = await User.findById(user.id);
    if (fullUser) {
      userRole = fullUser.role;
      console.log(`User ${user.id} has role: ${userRole}`);
    }
  }
  
  // Check role
  if (!ALLOWED_ROLES.includes(userRole)) {
    throw new Error(`${ERROR_CODES.UNAUTHORIZED}: User role '${userRole}' not allowed to export`);
  }
  
  // TODO: Check if user has access to these visits
  // This should query visits table and verify user's clinic/patient access
  // For now, assume authorized if role is correct
}

/**
 * POST /api/export/dataset
 * Create a new dataset export
 */
async function exportDataset(req, res) {
  try {
    const {
      visitIds,
      patientIds,
      format = EXPORT_FORMATS.YOLO,
      split = DEFAULT_SPLIT_RATIO,
      filter = {}
    } = req.body;
    
    const user = req.user; // Set by authenticate middleware
    
    console.log('Export request from user:', { userId: user?.id, role: user?.role });
    console.log('Export parameters:', { visitIds, patientIds, format, split, filter });
    
    // Validate parameters
    try {
      validateExportParams({ visitIds, patientIds, format, split });
    } catch (validationError) {
      console.error('Validation error:', validationError.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationError.message
        }
      });
    }
    
    // Check authorization
    try {
      await checkAuthorization(user, visitIds || []);
    } catch (authError) {
      console.error('Authorization error:', authError.message);
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: authError.message
        }
      });
    }
    
    // Normalize filters
    const filters = {
      annotationStatus: filter.annotationStatus || ANNOTATION_STATUS.FULL,
      plaqueOnly: filter.plaqueOnly || false
    };
    
    // Start export job
    const exportParams = {
      visitIds: visitIds || [],
      patientIds: patientIds || [],
      splitRatio: split,
      filters,
      format,
      userId: user.id,
      requestedAt: new Date()
    };
    
    console.log('Starting dataset export:', exportParams);
    
    // Generate dataset (sync for now, async with queue for large exports in future)
    const result = await generateYOLODataset(exportParams);
    
    const { exportId, zipPath, stats } = result;
    
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + EXPORT_EXPIRATION_SECONDS * 1000);
    
    // Store export metadata
    exportJobs.set(exportId, {
      exportId,
      zipPath,
      stats,
      userId: user.id,
      createdAt: new Date(),
      expiresAt,
      status: 'completed',
      params: exportParams
    });
    
    // Schedule cleanup
    setTimeout(() => {
      cleanupExpiredExports(EXPORT_EXPIRATION_SECONDS);
    }, EXPORT_EXPIRATION_SECONDS * 1000);
    
    // Return success response
    res.json({
      success: true,
      data: {
        exportId,
        downloadUrl: `/api/exports/${exportId}/download`,
        expiresAt: expiresAt.toISOString(),
        expiresIn: EXPORT_EXPIRATION_SECONDS,
        stats: {
          totalImages: stats.totalImages,
          totalSubboxes: stats.totalSubboxes,
          plaquePositive: stats.plaquePositive,
          plaqueNegative: stats.plaqueNegative,
          splits: stats.splits
        }
      }
    });
    
  } catch (error) {
    console.error('Export dataset error:', error);
    
    // Handle specific error codes
    if (error.message.includes(ERROR_CODES.NO_ANNOTATED_IMAGES)) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.NO_ANNOTATED_IMAGES,
          message: 'No fully annotated images found for selected visits',
          details: { visitIds: req.body.visitIds }
        }
      });
    }
    
    if (error.message.includes(ERROR_CODES.INVALID_SPLIT_RATIO)) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_SPLIT_RATIO,
          message: error.message
        }
      });
    }
    
    if (error.message.includes(ERROR_CODES.UNAUTHORIZED)) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: error.message
        }
      });
    }
    
    // Generic error
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_FAILED',
        message: 'Failed to generate dataset export',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}

/**
 * GET /api/exports/:exportId
 * Get export status and metadata
 */
async function getExportStatus(req, res) {
  try {
    const { exportId } = req.params;
    const user = req.user;
    
    const exportJob = exportJobs.get(exportId);
    
    if (!exportJob) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPORT_NOT_FOUND',
          message: 'Export not found or has expired'
        }
      });
    }
    
    // Check ownership (optional, depends on security requirements)
    if (exportJob.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Not authorized to access this export'
        }
      });
    }
    
    // Check if expired
    if (new Date() > exportJob.expiresAt) {
      exportJobs.delete(exportId);
      return res.status(410).json({
        success: false,
        error: {
          code: 'EXPORT_EXPIRED',
          message: 'Export has expired and is no longer available'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        exportId: exportJob.exportId,
        status: exportJob.status,
        downloadUrl: `/api/exports/${exportId}/download`,
        createdAt: exportJob.createdAt.toISOString(),
        expiresAt: exportJob.expiresAt.toISOString(),
        stats: exportJob.stats
      }
    });
    
  } catch (error) {
    console.error('Get export status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_STATUS_FAILED',
        message: 'Failed to fetch export status'
      }
    });
  }
}

/**
 * GET /api/exports/:exportId/download
 * Download export ZIP file
 */
async function downloadExport(req, res) {
  try {
    const { exportId } = req.params;
    const user = req.user;
    
    const exportJob = exportJobs.get(exportId);
    
    if (!exportJob) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPORT_NOT_FOUND',
          message: 'Export not found or has expired'
        }
      });
    }
    
    // Check ownership
    if (exportJob.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Not authorized to download this export'
        }
      });
    }
    
    // Check if expired
    if (new Date() > exportJob.expiresAt) {
      exportJobs.delete(exportId);
      return res.status(410).json({
        success: false,
        error: {
          code: 'EXPORT_EXPIRED',
          message: 'Export has expired and is no longer available'
        }
      });
    }
    
    // Check if file exists
    try {
      await fs.access(exportJob.zipPath);
    } catch (error) {
      exportJobs.delete(exportId);
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Export file not found'
        }
      });
    }
    
    // Send file
    const filename = `nhakhoa_dataset_${exportId}.zip`;
    res.download(exportJob.zipPath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              code: 'DOWNLOAD_FAILED',
              message: 'Failed to download file'
            }
          });
        }
      }
    });
    
  } catch (error) {
    console.error('Download export error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DOWNLOAD_FAILED',
          message: 'Failed to download export'
        }
      });
    }
  }
}

/**
 * DELETE /api/exports/:exportId
 * Delete an export (cleanup)
 */
async function deleteExport(req, res) {
  try {
    const { exportId } = req.params;
    const user = req.user;
    
    const exportJob = exportJobs.get(exportId);
    
    if (!exportJob) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPORT_NOT_FOUND',
          message: 'Export not found'
        }
      });
    }
    
    // Check ownership
    if (exportJob.userId !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Not authorized to delete this export'
        }
      });
    }
    
    // Delete file
    try {
      await fs.unlink(exportJob.zipPath);
    } catch (error) {
      console.error('Failed to delete file:', error.message);
    }
    
    // Remove from jobs
    exportJobs.delete(exportId);
    
    res.json({
      success: true,
      message: 'Export deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete export error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete export'
      }
    });
  }
}

module.exports = {
  exportDataset,
  getExportStatus,
  downloadExport,
  deleteExport
};
