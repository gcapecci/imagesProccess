"""
AI Service for Background Removal
Using FastAPI + rembg for high-performance image processing
Clean Architecture Implementation
"""

import os
import io
import time
import logging
import psutil
from typing import Optional
from contextlib import asynccontextmanager

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, status, Query
from fastapi.responses import Response
from rembg import remove, new_session
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global sessions for different AI models (loaded once for performance)
rembg_sessions = {}

# Statistics tracking
stats = {
    "total_processed": 0,
    "total_errors": 0,
    "total_processing_time": 0.0,
    "average_processing_time": 0.0,
    "model_usage": {}
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    global rembg_sessions
    
    # Startup
    logger.info("🚀 Initializing AI Service...")
    try:
        # Initialize rembg sessions for both models
        logger.info("Loading AI models...")
        
        # Load u2net (standard quality - faster)
        logger.info("Loading u2net model (standard quality)...")
        rembg_sessions['u2net'] = new_session('u2net')
        logger.info("✅ u2net model loaded!")
        
        # Load isnet-general-use (premium quality)
        logger.info("Loading isnet-general-use model (premium quality)...")
        rembg_sessions['isnet-general-use'] = new_session('isnet-general-use')
        logger.info("✅ isnet-general-use model loaded!")
        
        # Warm up models with dummy images
        logger.info("Warming up models...")
        dummy_image = Image.new('RGB', (100, 100), color='white')
        for model_name, session in rembg_sessions.items():
            _ = remove(dummy_image, session=session)
            stats["model_usage"][model_name] = 0
            logger.info(f"✅ {model_name} warmed up successfully!")
        
        logger.info(f"✅ AI Service initialized with {len(rembg_sessions)} models!")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize AI service: {e}")
        raise
    
    yield
    
    # Cleanup
    logger.info("🔄 Shutting down AI Service...")

# Create FastAPI app
app = FastAPI(
    title="AI Background Removal Service",
    description="High-performance background removal using multiple AI models",
    version="2.0.0",
    lifespan=lifespan
)

def get_memory_usage():
    """Get current memory usage"""
    process = psutil.Process()
    memory_info = process.memory_info()
    return {
        "rss": f"{memory_info.rss / 1024 / 1024:.2f} MB",
        "vms": f"{memory_info.vms / 1024 / 1024:.2f} MB"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Background Removal",
        "version": "2.0.0",
        "status": "healthy",
        "available_models": list(rembg_sessions.keys()),
        "model_details": {
            "u2net": {
                "quality": "standard",
                "speed": "fast",
                "description": "Fast and efficient for general purpose"
            },
            "isnet-general-use": {
                "quality": "premium",
                "speed": "moderate",
                "description": "Superior quality with alpha matting",
                "features": ["alpha_matting", "post_processing"]
            }
        },
        "endpoints": ["/remove-background", "/health", "/stats"]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    global rembg_sessions
    
    try:
        # Check if models are loaded
        if not rembg_sessions or len(rembg_sessions) == 0:
            raise HTTPException(
                status_code=503,
                detail="AI models not loaded"
            )
        
        # Quick model test
        test_image = Image.new('RGB', (32, 32), color='red')
        _ = remove(test_image, session=rembg_sessions['u2net'])
        
        return {
            "status": "healthy",
            "loaded_models": list(rembg_sessions.keys()),
            "memory_usage": get_memory_usage(),
            "uptime_seconds": time.time()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Service unhealthy: {str(e)}"
        )

@app.post("/remove-background")
async def remove_background(
    image: UploadFile = File(...),
    model: str = Query("u2net", description="AI model to use: u2net (fast) or isnet-general-use (premium quality)"),
    output_format: str = Query("png", description="Output format: png or jpg")
):
    """
    Remove background from uploaded image
    
    Args:
        image: Uploaded image file
        model: AI model to use ('u2net' or 'isnet-general-use')
        output_format: Output format ('png' or 'jpg')
    
    Returns:
        Processed image with transparent background (PNG) or white background (JPG)
    """
    global rembg_sessions, stats
    
    start_time = time.time()
    
    try:
        # Validate model
        if model not in rembg_sessions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model '{model}'. Available models: {list(rembg_sessions.keys())}"
            )
        
        selected_session = rembg_sessions[model]
        
        # Validate file
        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        # Read image data
        logger.info(f"📷 Processing: {image.filename} ({image.content_type}) with model: {model}")
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty image file"
            )
        
        # Convert to PIL Image
        try:
            pil_image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if pil_image.mode not in ['RGB', 'RGBA']:
                pil_image = pil_image.convert('RGB')
                
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image format: {str(e)}"
            )
        
        # Log image details
        logger.info(f"Image size: {pil_image.size}, mode: {pil_image.mode}")
        
        # Remove background with model-specific processing
        logger.info(f"🤖 Removing background with {model}...")
        
        if model == 'isnet-general-use':
            # Premium quality with alpha matting and post-processing
            processed_image = remove(
                pil_image, 
                session=selected_session,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=10,
                post_process_mask=True
            )
        else:
            # Standard quality - faster processing
            processed_image = remove(pil_image, session=selected_session)
        
        # Prepare output
        output_buffer = io.BytesIO()
        
        if output_format.lower() in ['jpg', 'jpeg']:
            # For JPEG, composite with white background
            white_bg = Image.new('RGBA', processed_image.size, (255, 255, 255, 255))
            final_image = Image.alpha_composite(white_bg, processed_image)
            final_image.convert('RGB').save(output_buffer, format='JPEG', quality=95)
            media_type = "image/jpeg"
        else:
            # Default to PNG with transparency
            processed_image.save(output_buffer, format='PNG', optimize=True)
            media_type = "image/png"
        
        output_buffer.seek(0)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Update statistics
        stats["total_processed"] += 1
        stats["total_processing_time"] += processing_time
        stats["average_processing_time"] = stats["total_processing_time"] / stats["total_processed"]
        stats["model_usage"][model] += 1
        
        logger.info(f"✅ Processed in {processing_time:.2f}s with {model}")
        
        return Response(
            content=output_buffer.getvalue(),
            media_type=media_type,
            headers={
                "X-Processing-Time": f"{processing_time:.2f}s",
                "X-Model-Used": model,
                "X-Original-Size": str(len(image_data)),
                "X-Processed-Size": str(len(output_buffer.getvalue()))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        stats["total_errors"] += 1
        logger.error(f"❌ Processing error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )

@app.get("/stats")
async def get_stats():
    """Get service statistics"""
    return {
        **stats,
        "status": "healthy" if rembg_sessions else "unhealthy",
        "available_models": list(rembg_sessions.keys()),
        "memory_usage": get_memory_usage()
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=5000,
        reload=False,
        log_level="info"
    )
