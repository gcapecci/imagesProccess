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
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw
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
        
        # Additional warm-up for isnet alpha matting (prevents 56s delay on first request)
        logger.info("Warming up isnet alpha matting...")
        _ = remove(
            dummy_image, 
            session=rembg_sessions['isnet-general-use'],
            alpha_matting=True,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=10,
            post_process_mask=True
        )
        logger.info("✅ Alpha matting warmed up successfully!")
        
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
    version="3.1.0",
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
        "service": "AI Image Processing",
        "version": "3.1.0",
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
        "features": {
            "background_removal": "/remove-background",
            "image_enhancement": "/enhance",
            "face_swap": "/face-swap",
            "image_restoration": "/restoration"
        },
        "endpoints": ["/remove-background", "/enhance", "/crop", "/face-swap", "/restoration", "/health", "/stats"]
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


@app.post("/enhance")
async def enhance_image(
    image: UploadFile = File(...),
    brightness: float = Query(1.0, ge=0.0, le=3.0, description="Brightness factor (1.0 = original)"),
    contrast: float = Query(1.0, ge=0.0, le=3.0, description="Contrast factor (1.0 = original)"),
    saturation: float = Query(1.0, ge=0.0, le=3.0, description="Saturation factor (1.0 = original)"),
    sharpness: float = Query(1.0, ge=0.0, le=3.0, description="Sharpness factor (1.0 = original)"),
    auto_enhance: bool = Query(False, description="Apply automatic enhancement"),
    denoise: bool = Query(False, description="Apply noise reduction"),
    output_format: str = Query("png", description="Output format: png or jpg")
):
    """
    Enhance image with brightness, contrast, saturation, sharpness adjustments.
    
    Args:
        image: Uploaded image file
        brightness: Brightness factor (0.0 to 3.0, 1.0 = no change)
        contrast: Contrast factor (0.0 to 3.0, 1.0 = no change)
        saturation: Saturation factor (0.0 to 3.0, 1.0 = no change)
        sharpness: Sharpness factor (0.0 to 3.0, 1.0 = no change)
        auto_enhance: Apply automatic enhancement (ignores manual sliders)
        denoise: Apply noise reduction filter
        output_format: Output format ('png' or 'jpg')
    
    Returns:
        Enhanced image
    """
    global stats
    
    start_time = time.time()
    
    try:
        # Validate file
        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        # Read image data
        logger.info(f"🎨 Enhancing: {image.filename} ({image.content_type})")
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty image file"
            )
        
        # Convert to PIL Image
        try:
            pil_image = Image.open(io.BytesIO(image_data))
            if pil_image.mode not in ['RGB', 'RGBA']:
                pil_image = pil_image.convert('RGB')
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image format: {str(e)}"
            )
        
        logger.info(f"Image size: {pil_image.size}, mode: {pil_image.mode}")
        
        enhanced = pil_image.copy()
        enhancements_applied = []
        
        if auto_enhance:
            # Auto-enhance pipeline
            logger.info("🤖 Applying auto-enhancement...")
            
            # Auto brightness: analyze histogram and adjust
            from PIL import ImageStat
            stat = ImageStat.Stat(enhanced.convert('L'))
            mean_brightness = stat.mean[0]
            
            # Target mean brightness ~128
            if mean_brightness < 100:
                brightness_factor = min(1.0 + (128 - mean_brightness) / 200, 1.6)
            elif mean_brightness > 160:
                brightness_factor = max(1.0 - (mean_brightness - 128) / 200, 0.7)
            else:
                brightness_factor = 1.0
            
            if brightness_factor != 1.0:
                enhanced = ImageEnhance.Brightness(enhanced).enhance(brightness_factor)
                enhancements_applied.append(f"brightness:{brightness_factor:.2f}")
            
            # Auto contrast
            enhanced = ImageEnhance.Contrast(enhanced).enhance(1.2)
            enhancements_applied.append("contrast:1.20")
            
            # Auto saturation boost
            enhanced = ImageEnhance.Color(enhanced).enhance(1.15)
            enhancements_applied.append("saturation:1.15")
            
            # Auto sharpness
            enhanced = ImageEnhance.Sharpness(enhanced).enhance(1.3)
            enhancements_applied.append("sharpness:1.30")
            
            # Light denoise via median filter
            enhanced = enhanced.filter(ImageFilter.MedianFilter(size=3))
            enhancements_applied.append("denoise:median")
            
        else:
            # Manual adjustments
            if brightness != 1.0:
                enhanced = ImageEnhance.Brightness(enhanced).enhance(brightness)
                enhancements_applied.append(f"brightness:{brightness:.2f}")
            
            if contrast != 1.0:
                enhanced = ImageEnhance.Contrast(enhanced).enhance(contrast)
                enhancements_applied.append(f"contrast:{contrast:.2f}")
            
            if saturation != 1.0:
                enhanced = ImageEnhance.Color(enhanced).enhance(saturation)
                enhancements_applied.append(f"saturation:{saturation:.2f}")
            
            if sharpness != 1.0:
                enhanced = ImageEnhance.Sharpness(enhanced).enhance(sharpness)
                enhancements_applied.append(f"sharpness:{sharpness:.2f}")
            
            if denoise:
                enhanced = enhanced.filter(ImageFilter.MedianFilter(size=3))
                enhancements_applied.append("denoise:median")
        
        # Prepare output
        output_buffer = io.BytesIO()
        
        if output_format.lower() in ['jpg', 'jpeg']:
            if enhanced.mode == 'RGBA':
                white_bg = Image.new('RGBA', enhanced.size, (255, 255, 255, 255))
                enhanced = Image.alpha_composite(white_bg, enhanced)
            enhanced.convert('RGB').save(output_buffer, format='JPEG', quality=95)
            media_type = "image/jpeg"
        else:
            enhanced.save(output_buffer, format='PNG', optimize=True)
            media_type = "image/png"
        
        output_buffer.seek(0)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Update statistics
        stats["total_processed"] += 1
        stats["total_processing_time"] += processing_time
        stats["average_processing_time"] = stats["total_processing_time"] / stats["total_processed"]
        stats["model_usage"]["enhance"] = stats["model_usage"].get("enhance", 0) + 1
        
        logger.info(f"✅ Enhanced in {processing_time:.2f}s — {', '.join(enhancements_applied)}")
        
        return Response(
            content=output_buffer.getvalue(),
            media_type=media_type,
            headers={
                "X-Processing-Time": f"{processing_time:.2f}s",
                "X-Enhancements": "; ".join(enhancements_applied),
                "X-Original-Size": str(len(image_data)),
                "X-Processed-Size": str(len(output_buffer.getvalue()))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        stats["total_errors"] += 1
        logger.error(f"❌ Enhancement error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Enhancement failed: {str(e)}"
        )


@app.post("/crop")
async def crop_image(
    image: UploadFile = File(...),
    width: int = Query(800, ge=10, le=8000, description="Target width in pixels"),
    height: int = Query(600, ge=10, le=8000, description="Target height in pixels"),
    x: Optional[int] = Query(None, ge=0, description="Crop start X position"),
    y: Optional[int] = Query(None, ge=0, description="Crop start Y position"),
    auto_detect: bool = Query(False, description="Auto-detect important areas (faces, center of mass)")
):
    """
    Crop and resize image with manual or AI auto-detection
    
    - **Manual mode**: Provide width, height, and optional x, y coordinates
    - **Auto-detect mode**: AI finds important areas (faces or center of mass)
    """
    start_time = time.time()
    
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Please upload an image."
            )
        
        # Read and validate image
        image_data = await image.read()
        if len(image_data) > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File too large. Maximum size is 50MB."
            )
        
        logger.info(f"📐 Crop request: {width}x{height}, auto_detect={auto_detect}")
        
        # Open image
        img = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        original_width, original_height = img.size
        
        # Determine crop box
        if auto_detect:
            # Try to detect faces using OpenCV (if available)
            try:
                import cv2
                img_array = np.array(img)
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
                
                # Load Haar Cascade for face detection
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
                
                if len(faces) > 0:
                    # Use the first detected face as center
                    (fx, fy, fw, fh) = faces[0]
                    center_x = fx + fw // 2
                    center_y = fy + fh // 2
                    logger.info(f"✅ Face detected at ({center_x}, {center_y})")
                else:
                    # No face detected, use center of image
                    center_x = original_width // 2
                    center_y = original_height // 2
                    logger.info("ℹ️  No face detected, using center of image")
            except ImportError:
                # OpenCV not available, use center of image
                center_x = original_width // 2
                center_y = original_height // 2
                logger.info("ℹ️  OpenCV not available, using center of image")
            
            # Calculate crop box centered on the detected point
            x = max(0, center_x - width // 2)
            y = max(0, center_y - height // 2)
            
            # Adjust if crop box exceeds image boundaries
            if x + width > original_width:
                x = original_width - width
            if y + height > original_height:
                y = original_height - height
            
            # Ensure coordinates are non-negative
            x = max(0, x)
            y = max(0, y)
        else:
            # Manual mode: use provided coordinates or center
            if x is None:
                x = max(0, (original_width - width) // 2)
            if y is None:
                y = max(0, (original_height - height) // 2)
            
            # Ensure crop box stays within bounds
            x = min(x, max(0, original_width - width))
            y = min(y, max(0, original_height - height))
        
        # Perform crop
        crop_box = (x, y, x + width, y + height)
        
        # Handle case where crop dimensions exceed image size
        if x + width > original_width or y + height > original_height:
            # Resize image first to fit the crop dimensions
            aspect_ratio = width / height
            if original_width / original_height > aspect_ratio:
                new_height = original_height
                new_width = int(new_height * aspect_ratio)
            else:
                new_width = original_width
                new_height = int(new_width / aspect_ratio)
            
            img = img.resize((max(width, new_width), max(height, new_height)), Image.Resampling.LANCZOS)
            original_width, original_height = img.size
            x = max(0, (original_width - width) // 2)
            y = max(0, (original_height - height) // 2)
            crop_box = (x, y, x + width, y + height)
        
        cropped = img.crop(crop_box)
        
        # Save to buffer
        output_buffer = io.BytesIO()
        cropped.save(output_buffer, format='PNG', optimize=True)
        output_buffer.seek(0)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Update statistics
        stats["total_processed"] += 1
        stats["total_processing_time"] += processing_time
        stats["average_processing_time"] = stats["total_processing_time"] / stats["total_processed"]
        stats["model_usage"]["crop"] = stats["model_usage"].get("crop", 0) + 1
        
        logger.info(f"✅ Cropped to {width}x{height} in {processing_time:.2f}s")
        
        return Response(
            content=output_buffer.getvalue(),
            media_type="image/png",
            headers={
                "X-Processing-Time": f"{processing_time:.2f}s",
                "X-Crop-Box": f"{x},{y},{x+width},{y+height}",
                "X-Original-Size": f"{original_width}x{original_height}",
                "X-Cropped-Size": f"{width}x{height}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        stats["total_errors"] += 1
        logger.error(f"❌ Crop error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Crop failed: {str(e)}"
        )


@app.post("/face-swap")
async def face_swap_image(
    image: UploadFile = File(...),
    face_image: Optional[UploadFile] = File(None),
    style_image: Optional[UploadFile] = File(None),
    mode: str = Query("face-swap", description="face-swap or style-transfer"),
    output_format: str = Query("png", description="Output format: png or jpg")
):
    """
    Face swap or style transfer (baseline implementation).

    - **face-swap**: overlays a reference face image at the center
    - **style-transfer**: blends the base image with a style reference
    """
    start_time = time.time()

    try:
        if mode not in ["face-swap", "style-transfer"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid mode. Use 'face-swap' or 'style-transfer'."
            )

        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )

        image_data = await image.read()
        if len(image_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty image file"
            )

        try:
            base_image = Image.open(io.BytesIO(image_data))
            if base_image.mode not in ['RGB', 'RGBA']:
                base_image = base_image.convert('RGB')
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image format: {str(e)}"
            )

        base_rgba = base_image.convert('RGBA')

        operations = []

        if mode == "face-swap":
            if not face_image:
                raise HTTPException(
                    status_code=400,
                    detail="face_image is required for face-swap mode"
                )

            face_data = await face_image.read()
            if len(face_data) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Empty face image file"
                )

            face_ref = Image.open(io.BytesIO(face_data)).convert('RGBA')

            base_w, base_h = base_rgba.size
            overlay_size = int(min(base_w, base_h) * 0.45)
            overlay_size = max(32, overlay_size)
            overlay_size = min(overlay_size, min(base_w, base_h))

            face_ref = face_ref.resize((overlay_size, overlay_size), Image.Resampling.LANCZOS)

            mask = Image.new('L', (overlay_size, overlay_size), 0)
            draw = ImageDraw.Draw(mask)
            draw.ellipse((0, 0, overlay_size, overlay_size), fill=200)

            paste_x = (base_w - overlay_size) // 2
            paste_y = (base_h - overlay_size) // 2

            result = base_rgba.copy()
            result.paste(face_ref, (paste_x, paste_y), mask=mask)
            operations.append("face-swap")

        else:
            if not style_image:
                raise HTTPException(
                    status_code=400,
                    detail="style_image is required for style-transfer mode"
                )

            style_data = await style_image.read()
            if len(style_data) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Empty style image file"
                )

            style_ref = Image.open(io.BytesIO(style_data)).convert('RGBA')
            style_ref = style_ref.resize(base_rgba.size, Image.Resampling.LANCZOS)

            result = Image.blend(base_rgba, style_ref, alpha=0.35)
            operations.append("style-transfer")

        output_buffer = io.BytesIO()
        if output_format.lower() in ['jpg', 'jpeg']:
            white_bg = Image.new('RGBA', result.size, (255, 255, 255, 255))
            final_image = Image.alpha_composite(white_bg, result)
            final_image.convert('RGB').save(output_buffer, format='JPEG', quality=95)
            media_type = "image/jpeg"
        else:
            result.save(output_buffer, format='PNG', optimize=True)
            media_type = "image/png"

        output_buffer.seek(0)

        processing_time = time.time() - start_time
        stats["total_processed"] += 1
        stats["total_processing_time"] += processing_time
        stats["average_processing_time"] = stats["total_processing_time"] / stats["total_processed"]
        stats["model_usage"][mode] = stats["model_usage"].get(mode, 0) + 1

        return Response(
            content=output_buffer.getvalue(),
            media_type=media_type,
            headers={
                "X-Processing-Time": f"{processing_time:.2f}s",
                "X-Face-Operation": ",".join(operations),
                "X-Original-Size": str(len(image_data)),
                "X-Processed-Size": str(len(output_buffer.getvalue()))
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        stats["total_errors"] += 1
        logger.error(f"❌ Face swap error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Face swap failed: {str(e)}"
        )


@app.post("/restoration")
async def restore_image(
    image: UploadFile = File(...),
    repair: bool = Query(True, description="Repair scratches and damage"),
    colorize: bool = Query(False, description="Colorize grayscale images"),
    denoise: bool = Query(True, description="Denoise the image"),
    output_format: str = Query("png", description="Output format: png or jpg")
):
    """
    Restore images (baseline implementation).

    - **repair**: light median filter + subtle sharpening
    - **denoise**: median filter
    - **colorize**: grayscale colorization
    """
    start_time = time.time()

    try:
        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )

        image_data = await image.read()
        if len(image_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty image file"
            )

        try:
            pil_image = Image.open(io.BytesIO(image_data))
            if pil_image.mode not in ['RGB', 'RGBA']:
                pil_image = pil_image.convert('RGB')
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image format: {str(e)}"
            )

        result = pil_image.copy()
        operations = []

        if denoise:
            result = result.filter(ImageFilter.MedianFilter(size=3))
            operations.append("denoise:median")

        if repair:
            result = result.filter(ImageFilter.MedianFilter(size=3))
            result = ImageEnhance.Sharpness(result).enhance(1.15)
            operations.append("repair:median")

        if colorize:
            grayscale = result.convert('L')
            result = ImageOps.colorize(grayscale, black=(40, 40, 40), white=(240, 220, 200))
            operations.append("colorize:basic")

        output_buffer = io.BytesIO()
        if output_format.lower() in ['jpg', 'jpeg']:
            if result.mode == 'RGBA':
                white_bg = Image.new('RGBA', result.size, (255, 255, 255, 255))
                result = Image.alpha_composite(white_bg, result)
            result.convert('RGB').save(output_buffer, format='JPEG', quality=95)
            media_type = "image/jpeg"
        else:
            result.save(output_buffer, format='PNG', optimize=True)
            media_type = "image/png"

        output_buffer.seek(0)

        processing_time = time.time() - start_time
        stats["total_processed"] += 1
        stats["total_processing_time"] += processing_time
        stats["average_processing_time"] = stats["total_processing_time"] / stats["total_processed"]
        stats["model_usage"]["restoration"] = stats["model_usage"].get("restoration", 0) + 1

        return Response(
            content=output_buffer.getvalue(),
            media_type=media_type,
            headers={
                "X-Processing-Time": f"{processing_time:.2f}s",
                "X-Restoration": "; ".join(operations),
                "X-Original-Size": str(len(image_data)),
                "X-Processed-Size": str(len(output_buffer.getvalue()))
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        stats["total_errors"] += 1
        logger.error(f"❌ Restoration error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Restoration failed: {str(e)}"
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
