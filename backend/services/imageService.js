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
  async removeBackground({ buffer, mimetype, originalname }) {
    const startTime = Date.now();
    
    try {
      // Create form data for AI service
      const formData = new FormData();
      formData.append('image', buffer, {
        filename: originalname,
        contentType: mimetype
      });

      // Send request to AI service
      console.log(`🤖 Sending image to AI service: ${this.aiServiceUrl}/remove-background`);
      
      const response = await axios.post(
        `${this.aiServiceUrl}/remove-background`,
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