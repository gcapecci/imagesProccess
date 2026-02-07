"""
AI Service for Background Removal
Using FastAPI + rembg for high-performance image processing
"""

import os
import io
import time
import logging
from typing import Optional
from contextlib import asynccontextmanager

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.responses import FileResponse, Response
from rembg import remove, new_session
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global session for rembg (loaded once for performance)
rembg_session = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    global rembg_session
    
    # Startup
    logger.info("🚀 Initializing AI Service...")
    try:
        # Initialize rembg session with u2net model (best quality)
        logger.info("Loading rembg model...")
        rembg_session = new_session('u2net')
        logger.info("✅ rembg model loaded successfully!")
        
        # Warm up the model with a dummy image
        dummy_image = Image.new('RGB', (100, 100), color='white')
        _ = remove(dummy_image, session=rembg_session)
        logger.info("✅ Model warmed up successfully!")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize AI service: {e}")
        raise
    
    yield
    
    # Cleanup
    logger.info("🔄 Shutting down AI Service...")

# Create FastAPI app
app = FastAPI(
    title="AI Background Removal Service",
    description="High-performance background removal using U²-Net",
    version="1.0.0",
    lifespan=lifespan
)

# Statistics tracking
stats = {
    "total_processed": 0,
    "total_errors": 0,
    "total_processing_time": 0.0,
    "average_processing_time": 0.0
}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Background Removal",
        "version": "1.0.0",
        "status": "healthy",
        "models": ["u2net"],
        "endpoints": ["/remove-background", "/health", "/stats"]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    global rembg_session
    
    try:
        # Check if model is loaded
        if rembg_session is None:
            raise HTTPException(
                status_code=503,
                detail="AI model not loaded"
            )
        
        # Quick model test
        test_image = Image.new('RGB', (32, 32), color='red')
        _ = remove(test_image, session=rembg_session)
        
        return {
            "status": "healthy",
            "model": "u2net",
            "memory_usage": get_memory_usage(),
            "uptime": time.time()
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
    model: str = "u2net",
    output_format: Optional[str] = "png"
):
    """
    Remove background from uploaded image
    
    Args:
        image: Uploaded image file
        model: AI model to use ('u2net' or 'isnet-general-use')
        output_format: Output format (png, jpg)
    
    Returns:
        Processed image with transparent background
    """
    global rembg_sessions, stats
    
    start_time = time.time()
    
    try:
        # Validate model
        if model not in rembg_sessions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model. Available models: {list(rembg_sessions.keys())}"
            )
        
        selected_session = rembg_sessions[model]
        
        # Validate file
        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        # Read image data
        logger.info(f"📷 Processing image: {image.filename} ({image.content_type}) with model: {model}")
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
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
                
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image format: {str(e)}"
            )
        
        # Log image details
        logger.info(f"Image size: {pil_image.size}, mode: {pil_image.mode}")
        
        # Remove background using rembg
        logger.info("🤖 Removing background with AI...")
        processed_image = remove(pil_image, session=rembg_session)
        
        # Prepare output
        output_buffer = io.BytesIO()
        
        if output_format.lower() == 'jpg' or output_format.lower() == 'jpeg':
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
        stats["average_processing_time"] = (
            stats["total_processing_time"] / stats["total_processed"]
        )
        
        logger.info(f"✅ Background removed successfully in {processing_time:.2f}s")
        
        # Return processed image
        return Response(
            content=output_buffer.getvalue(),
            media_type=media_type,
            headers={
                "X-Processing-Time": f"{processing_time:.2f}s",
                "X-Original-Size": str(len(image_data)),
                "X-Processed-Size": str(len(output_buffer.getvalue())),
                "Content-Disposition": f'attachment; filename="processed_{image.filename}"'
            }
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
        
    except Exception as e:
        # Handle unexpected errors
        processing_time = time.time() - start_time
        stats["total_errors"] += 1
        
        logger.error(f"❌ Error processing image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process image: {str(e)}"
        )

@app.get("/stats")
async def get_stats():
    """Get processing statistics"""
    return {
        **stats,
        "model": "u2net",
        "memory_usage": get_memory_usage(),
        "status": "healthy" if rembg_session else "unhealthy"
    }

@app.post("/batch-remove-background")
async def batch_remove_background(
    images: list[UploadFile] = File(...),
    output_format: Optional[str] = "png"
):
    """
    Process multiple images in batch
    
    Args:
        images: List of uploaded image files
        output_format: Output format (png, jpg)
    
    Returns:
        ZIP file with processed images
    """
    if len(images) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 images allowed per batch"
        )
    
    results = []
    for image in images:
        try:
            # Process each image
            result = await remove_background(image, output_format)
            results.append({
                "filename": image.filename,
                "success": True,
                "size": len(result.body)
            })
        except Exception as e:
            results.append({
                "filename": image.filename,
                "success": False,
                "error": str(e)
            })
    
    return {"results": results}

def get_memory_usage():
    """Get current memory usage"""
    try:
        import psutil
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        return {
            "rss": f"{memory_info.rss / 1024 / 1024:.2f} MB",
            "vms": f"{memory_info.vms / 1024 / 1024:.2f} MB"
        }
    except ImportError:
        return {"status": "psutil not installed"}

# Model management endpoints (for advanced usage)
@app.post("/switch-model")
async def switch_model(model_name: str):
    """Switch to different rembg model"""
    global rembg_session
    
    available_models = ['u2net', 'u2netp', 'u2net_human_seg', 'silueta']
    
    if model_name not in available_models:
        raise HTTPException(
            status_code=400,
            detail=f"Model {model_name} not available. Choose from: {available_models}"
        )
    
    try:
        logger.info(f"🔄 Switching to model: {model_name}")
        rembg_session = new_session(model_name)
        
        # Warm up new model
        dummy_image = Image.new('RGB', (100, 100), color='white')
        _ = remove(dummy_image, session=rembg_session)
        
        logger.info(f"✅ Successfully switched to model: {model_name}")
        
        return {
            "status": "success",
            "model": model_name,
            "message": f"Successfully switched to {model_name}"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to switch model: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to switch model: {str(e)}"
        )

if __name__ == "__main__":
    # Run with uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        reload=os.getenv("ENVIRONMENT", "production") == "development",
        workers=1  # rembg models don't work well with multiple workers
    )