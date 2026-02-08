const axios = require('axios');
const FormData = require('form-data');

class ImageService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    this.stats = {
      totalProcessed: 0,
      totalErrors: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0
    };
  }

  /**
   * Remove background from image using AI service
   */
  async removeBackground({ buffer, mimetype, originalname, model = 'u2net' }) {
    const startTime = Date.now();
    
    try {
      // Create form data for AI service
      const formData = new FormData();
      formData.append('image', buffer, {
        filename: originalname,
        contentType: mimetype
      });

      // Send request to AI service with model parameter
      console.log(`🤖 Sending image to AI service: ${this.aiServiceUrl}/remove-background?model=${model}`);
      
      const response = await axios.post(
        `${this.aiServiceUrl}/remove-background?model=${model}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 120000, // 2 minutes timeout
          responseType: 'arraybuffer'
        }
      );

      const processingTime = Date.now() - startTime;
      
      // Update statistics
      this.updateStats(processingTime, false);
      
      console.log(`✅ Image processed successfully in ${processingTime}ms`);
      
      return {
        buffer: response.data,
        processingTime: `${processingTime}ms`,
        originalSize: buffer.length,
        processedSize: response.data.length
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, true);
      
      console.error('❌ AI service error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('AI service is not available');
      } else if (error.response) {
        throw new Error(`AI service error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('AI service timeout - image processing took too long');
      } else {
        throw new Error(`AI service communication error: ${error.message}`);
      }
    }
  }

  /**
   * Process multiple images in batch
   */
  async processBatch(files) {
    const results = [];
    
    console.log(`📦 Processing batch of ${files.length} images`);
    
    // Process images concurrently (but limit concurrency)
    const concurrencyLimit = 3;
    const chunks = this.chunkArray(files, concurrencyLimit);
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (file) => {
        try {
          const result = await this.removeBackground({
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname
          });
          
          return {
            filename: file.originalname,
            success: true,
            processingTime: result.processingTime,
            buffer: result.buffer
          };
          
        } catch (error) {
          return {
            filename: file.originalname,
            success: false,
            error: error.message
          };
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    console.log(`✅ Batch processing completed: ${results.filter(r => r.success).length}/${files.length} successful`);
    
    return results;
  }

  /**
   * Enhance image with brightness, contrast, saturation, sharpness
   */
  async enhanceImage({ buffer, mimetype, originalname, brightness = 1.0, contrast = 1.0, saturation = 1.0, sharpness = 1.0, auto_enhance = false, denoise = false }) {
    const startTime = Date.now();
    
    try {
      const formData = new FormData();
      formData.append('image', buffer, {
        filename: originalname,
        contentType: mimetype
      });

      // Build query params
      const params = new URLSearchParams({
        brightness: brightness.toString(),
        contrast: contrast.toString(),
        saturation: saturation.toString(),
        sharpness: sharpness.toString(),
        auto_enhance: auto_enhance.toString(),
        denoise: denoise.toString()
      });

      console.log(`🎨 Sending image to AI service: ${this.aiServiceUrl}/enhance?${params}`);
      
      const response = await axios.post(
        `${this.aiServiceUrl}/enhance?${params}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 60000,
          responseType: 'arraybuffer'
        }
      );

      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, false);
      
      console.log(`✅ Image enhanced successfully in ${processingTime}ms`);
      
      return {
        buffer: response.data,
        processingTime: `${processingTime}ms`,
        enhancements: response.headers['x-enhancements'] || '',
        originalSize: buffer.length,
        processedSize: response.data.length
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, true);
      
      console.error('❌ AI enhancement error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('AI service is not available');
      } else if (error.response) {
        throw new Error(`AI service error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('AI service timeout');
      } else {
        throw new Error(`AI service communication error: ${error.message}`);
      }
    }
  }

  /**
   * Crop image with manual or auto-detect modes
   */
  async cropImage({ buffer, mimetype, originalname, width = 800, height = 600, x, y, auto_detect = false }) {
    const startTime = Date.now();
    
    try {
      const formData = new FormData();
      formData.append('image', buffer, {
        filename: originalname,
        contentType: mimetype
      });

      // Build query params
      const params = new URLSearchParams({
        width: width.toString(),
        height: height.toString(),
        auto_detect: auto_detect.toString()
      });

      if (x !== undefined) {
        params.append('x', x.toString());
      }
      if (y !== undefined) {
        params.append('y', y.toString());
      }

      console.log(`📐 Sending image to AI service: ${this.aiServiceUrl}/crop?${params}`);
      
      const response = await axios.post(
        `${this.aiServiceUrl}/crop?${params}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 60000,
          responseType: 'arraybuffer'
        }
      );

      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, false);
      
      console.log(`✅ Image cropped successfully in ${processingTime}ms`);
      
      return {
        buffer: response.data,
        processingTime: `${processingTime}ms`,
        cropBox: response.headers['x-crop-box'] || '',
        originalSize: buffer.length,
        processedSize: response.data.length
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, true);
      
      console.error('❌ AI crop error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('AI service is not available');
      } else if (error.response) {
        throw new Error(`AI service error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('AI service timeout');
      } else {
        throw new Error(`AI service communication error: ${error.message}`);
      }
    }
  }

  /**
   * Get processing statistics
   */
  async getStats() {
    try {
      // Get AI service health
      const aiHealth = await this.checkAIServiceHealth();
      
      return {
        ...this.stats,
        aiService: aiHealth,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };
    } catch (error) {
      return {
        ...this.stats,
        aiService: { status: 'error', error: error.message },
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };
    }
  }

  /**
   * Check AI service health
   */
  async checkAIServiceHealth() {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/health`, {
        timeout: 5000
      });
      
      return {
        status: 'healthy',
        url: this.aiServiceUrl,
        responseTime: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        url: this.aiServiceUrl,
        error: error.message
      };
    }
  }

  /**
   * Update processing statistics
   */
  updateStats(processingTime, isError) {
    if (isError) {
      this.stats.totalErrors++;
    } else {
      this.stats.totalProcessed++;
      this.stats.totalProcessingTime += processingTime;
      this.stats.averageProcessingTime = Math.round(
        this.stats.totalProcessingTime / this.stats.totalProcessed
      );
    }
  }

  /**
   * Split array into chunks
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

module.exports = new ImageService();