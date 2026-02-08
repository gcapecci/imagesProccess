/**
 * Validate uploaded image middleware
 */
function validateImageFile(file) {
  if (!file) {
    return {
      status: 400,
      error: 'No image provided',
      message: 'Please upload an image file'
    };
  }

  const { buffer, mimetype, originalname, size } = file;

  if (size > 50 * 1024 * 1024) {
    return {
      status: 413,
      error: 'File too large',
      message: 'Image file size must be less than 50MB'
    };
  }

  if (size < 100) {
    return {
      status: 400,
      error: 'File too small',
      message: 'Image file appears to be corrupted or empty'
    };
  }

  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/gif'
  ];

  if (!allowedMimeTypes.includes(mimetype.toLowerCase())) {
    return {
      status: 400,
      error: 'Invalid image format',
      message: `Supported formats: ${allowedMimeTypes.join(', ')}`
    };
  }

  if (!isValidImageSignature(buffer, mimetype)) {
    return {
      status: 400,
      error: 'Invalid image file',
      message: 'File does not appear to be a valid image'
    };
  }

  return null;
}

function validateImage(req, res, next) {
  const validationError = validateImageFile(req.file);
  if (validationError) {
    return res.status(validationError.status || 400).json(validationError);
  }

  const { mimetype, originalname, size } = req.file;

  req.imageMetadata = {
    size: size,
    sizeFormatted: formatFileSize(size),
    mimetype: mimetype,
    originalname: originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
  };

  next();
}

function validateImageFields(req, res, next) {
  if (!req.files || !req.files.image || req.files.image.length === 0) {
    return res.status(400).json({
      error: 'No image provided',
      message: 'Please upload an image file'
    });
  }

  const fieldsToValidate = ['image', 'face_image', 'style_image'];
  for (const field of fieldsToValidate) {
    const fileList = req.files[field];
    if (!fileList || fileList.length === 0) {
      continue;
    }

    const validationError = validateImageFile(fileList[0]);
    if (validationError) {
      return res.status(validationError.status || 400).json(validationError);
    }
  }

  const baseFile = req.files.image[0];
  req.imageMetadata = {
    size: baseFile.size,
    sizeFormatted: formatFileSize(baseFile.size),
    mimetype: baseFile.mimetype,
    originalname: baseFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
  };

  next();
}

/**
 * Validate image file signature (magic numbers)
 */
function isValidImageSignature(buffer, mimetype) {
  if (buffer.length < 4) return false;

  const signatures = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/jpg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
    'image/bmp': [[0x42, 0x4D]],
    'image/tiff': [[0x49, 0x49, 0x2A, 0x00], [0x4D, 0x4D, 0x00, 0x2A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]]
  };

  const fileSignatures = signatures[mimetype.toLowerCase()];
  if (!fileSignatures) return true; // Unknown type, let it pass

  return fileSignatures.some(signature =>
    signature.every((byte, index) => buffer[index] === byte)
  );
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  validateImage,
  validateImageFields
};