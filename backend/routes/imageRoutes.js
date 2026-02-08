const express = require('express');
const multer = require('multer');
const router = express.Router();
const imageService = require('../services/imageService');
const { validateImage, validateImageFields } = require('../middleware/validation');

// Configure multer for handling multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 120 * 1024 * 1024, // 120MB limit per file
    files: 3
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
 * POST /api/images/remove-background?model=u2net
 * Remove background from uploaded image using AI
 */
router.post('/remove-background', upload.single('image'), validateImage, async (req, res) => {
  try {
    const { buffer, mimetype, originalname, size } = req.file;
    const model = req.query.model || 'u2net'; // Get model from query param, default to u2net
    
    console.log(`📸 Processing image: ${originalname} (${(size / 1024).toFixed(2)}KB) with model: ${model}`);
    
    // Process image through AI service
    const processedImage = await imageService.removeBackground({
      buffer,
      mimetype,
      originalname,
      model
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
 * POST /api/images/enhance
 * Enhance image with brightness, contrast, saturation, sharpness
 */
router.post('/enhance', upload.single('image'), validateImage, async (req, res) => {
  try {
    const { buffer, mimetype, originalname, size } = req.file;
    const { brightness, contrast, saturation, sharpness, auto_enhance, denoise } = req.query;
    
    console.log(`🎨 Enhancing image: ${originalname} (${(size / 1024).toFixed(2)}KB)`);
    
    // Process image through AI service
    const processedImage = await imageService.enhanceImage({
      buffer,
      mimetype,
      originalname,
      brightness: parseFloat(brightness) || 1.0,
      contrast: parseFloat(contrast) || 1.0,
      saturation: parseFloat(saturation) || 1.0,
      sharpness: parseFloat(sharpness) || 1.0,
      auto_enhance: auto_enhance === 'true',
      denoise: denoise === 'true'
    });

    // Set appropriate headers
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="enhanced_${originalname.replace(/\.[^/.]+$/, '')}.png"`,
      'X-Processing-Time': processedImage.processingTime,
      'X-Enhancements': processedImage.enhancements || '',
      'X-Original-Size': size,
      'X-Processed-Size': processedImage.buffer.length
    });

    // Send enhanced image
    res.send(processedImage.buffer);
    
  } catch (error) {
    console.error('❌ Error enhancing image:', error);
    
    if (error.message.includes('AI service')) {
      res.status(503).json({
        error: 'AI service temporarily unavailable',
        message: 'Please try again in a few moments'
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to enhance image'
      });
    }
  }
});

/**
 * POST /api/images/crop
 * Crop and resize image with manual or auto-detect modes
 */
router.post('/crop', upload.single('image'), validateImage, async (req, res) => {
  try {
    const { buffer, mimetype, originalname, size } = req.file;
    const { width, height, x, y, auto_detect } = req.query;
    
    console.log(`📐 Cropping image: ${originalname} to ${width}x${height}, auto_detect=${auto_detect}`);
    
    // Process image through AI service
    const processedImage = await imageService.cropImage({
      buffer,
      mimetype,
      originalname,
      width: parseInt(width) || 800,
      height: parseInt(height) || 600,
      x: x ? parseInt(x) : undefined,
      y: y ? parseInt(y) : undefined,
      auto_detect: auto_detect === 'true'
    });

    // Set appropriate headers
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="cropped_${originalname.replace(/\.[^/.]+$/, '')}.png"`,
      'X-Processing-Time': processedImage.processingTime,
      'X-Crop-Box': processedImage.cropBox || '',
      'X-Original-Size': size,
      'X-Processed-Size': processedImage.buffer.length
    });

    // Send cropped image
    res.send(processedImage.buffer);
    
  } catch (error) {
    console.error('❌ Error cropping image:', error);
    
    if (error.message.includes('AI service')) {
      res.status(503).json({
        error: 'AI service temporarily unavailable',
        message: 'Please try again in a few moments'
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to crop image'
      });
    }
  }
});

/**
 * POST /api/images/face-swap?mode=face-swap|style-transfer
 * Face swap or style transfer with optional reference images
 */
router.post('/face-swap', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'face_image', maxCount: 1 },
  { name: 'style_image', maxCount: 1 }
]), validateImageFields, async (req, res) => {
  try {
    const mode = req.query.mode || 'face-swap';
    const baseFile = req.files.image[0];
    const faceFile = req.files.face_image ? req.files.face_image[0] : null;
    const styleFile = req.files.style_image ? req.files.style_image[0] : null;

    if (mode === 'face-swap' && !faceFile) {
      return res.status(400).json({
        error: 'Face image required',
        message: 'Please upload a face_image for face swap mode'
      });
    }

    if (mode === 'style-transfer' && !styleFile) {
      return res.status(400).json({
        error: 'Style image required',
        message: 'Please upload a style_image for style transfer mode'
      });
    }

    console.log(`🙂 Face swap request: ${baseFile.originalname} mode=${mode}`);

    const processedImage = await imageService.faceSwapImage({
      buffer: baseFile.buffer,
      mimetype: baseFile.mimetype,
      originalname: baseFile.originalname,
      mode,
      faceImage: faceFile,
      styleImage: styleFile
    });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="face_swap_${baseFile.originalname.replace(/\.[^/.]+$/, '')}.png"`,
      'X-Processing-Time': processedImage.processingTime,
      'X-Face-Operation': processedImage.operation,
      'X-Original-Size': baseFile.size,
      'X-Processed-Size': processedImage.buffer.length
    });

    res.send(processedImage.buffer);
  } catch (error) {
    console.error('❌ Error in face swap:', error);

    if (error.message.includes('AI service')) {
      res.status(503).json({
        error: 'AI service temporarily unavailable',
        message: 'Please try again in a few moments'
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process face swap'
      });
    }
  }
});

/**
 * POST /api/images/restoration
 * Restore image (repair, colorize, denoise)
 */
router.post('/restoration', upload.single('image'), validateImage, async (req, res) => {
  try {
    const { buffer, mimetype, originalname, size } = req.file;
    const { repair, colorize, denoise } = req.query;

    console.log(`🧽 Restoring image: ${originalname} (${(size / 1024).toFixed(2)}KB)`);

    const processedImage = await imageService.restoreImage({
      buffer,
      mimetype,
      originalname,
      repair: repair !== 'false',
      colorize: colorize === 'true',
      denoise: denoise !== 'false'
    });

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="restored_${originalname.replace(/\.[^/.]+$/, '')}.png"`,
      'X-Processing-Time': processedImage.processingTime,
      'X-Restoration': processedImage.operations,
      'X-Original-Size': size,
      'X-Processed-Size': processedImage.buffer.length
    });

    res.send(processedImage.buffer);
  } catch (error) {
    console.error('❌ Error restoring image:', error);

    if (error.message.includes('AI service')) {
      res.status(503).json({
        error: 'AI service temporarily unavailable',
        message: 'Please try again in a few moments'
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to restore image'
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