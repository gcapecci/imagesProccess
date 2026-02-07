const express = require('express');
const multer = require('multer');
const router = express.Router();
const imageService = require('../services/imageService');
const { validateImage } = require('../middleware/validation');

// Configure multer for handling multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/images/remove-background
 * Remove background from uploaded image using AI
 */
router.post('/remove-background', upload.single('image'), validateImage, async (req, res) => {
  try {
    const { buffer, mimetype, originalname, size } = req.file;
    
    console.log(`📸 Processing image: ${originalname} (${(size / 1024).toFixed(2)}KB)`);
    
    // Process image through AI service
    const processedImage = await imageService.removeBackground({
      buffer,
      mimetype,
      originalname
    });

    // Set appropriate headers
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="processed_${originalname.replace(/\.[^/.]+$/, '')}.png"`,
      'X-Processing-Time': processedImage.processingTime,
      'X-Original-Size': size,
      'X-Processed-Size': processedImage.buffer.length
    });

    // Send processed image
    res.send(processedImage.buffer);
    
  } catch (error) {
    console.error('❌ Error processing image:', error);
    
    if (error.message.includes('AI service')) {
      res.status(503).json({
        error: 'AI service temporarily unavailable',
        message: 'Please try again in a few moments'
      });
    } else if (error.message.includes('format')) {
      res.status(400).json({
        error: 'Invalid image format',
        message: 'Please upload a valid image file (JPG, PNG, WEBP)'
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process image'
      });
    }
  }
});

/**
 * POST /api/images/process-batch
 * Process multiple images in batch
 */
router.post('/process-batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No images provided',
        message: 'Please upload at least one image'
      });
    }

    const results = await imageService.processBatch(req.files);
    
    res.json({
      success: true,
      processed: results.length,
      results: results.map(result => ({
        filename: result.filename,
        success: result.success,
        processingTime: result.processingTime,
        error: result.error
      }))
    });
    
  } catch (error) {
    console.error('❌ Error processing batch:', error);
    res.status(500).json({
      error: 'Batch processing failed',
      message: error.message
    });
  }
});

/**
 * GET /api/images/formats
 * Get supported image formats
 */
router.get('/formats', (req, res) => {
  res.json({
    input: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'],
    output: ['image/png', 'image/jpeg'],
    maxSize: '50MB',
    maxFiles: 10
  });
});

/**
 * GET /api/images/stats
 * Get processing statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await imageService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

module.exports = router;