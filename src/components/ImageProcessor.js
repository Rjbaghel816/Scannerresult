import React from 'react';

// Improved Image Processing Utilities
class ImageProcessingUtils {
  static async autoCropAndAdjust(imageData) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data for processing
        const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Step 1: Auto brightness and contrast
        const enhancedImageData = this.autoBrightnessContrast(originalImageData);
        
        // Step 2: Auto crop document (improved algorithm)
        const croppedCanvas = this.autoCropDocumentImproved(canvas, enhancedImageData);
        
        resolve(croppedCanvas.toDataURL('image/jpeg', 0.9));
      };
      
      img.src = imageData;
    });
  }

  // Improved Manual Crop Function
  static async manualCrop(imageData, cropArea) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas size to crop area
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw cropped portion with better quality
        ctx.drawImage(
          img,
          cropArea.x, cropArea.y, cropArea.width, cropArea.height,
          0, 0, cropArea.width, cropArea.height
        );
        
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      
      img.src = imageData;
    });
  }

  static autoBrightnessContrast(imageData) {
    const data = imageData.data;
    const length = data.length;
    
    // Calculate average brightness
    let totalBrightness = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < length; i += 4) {
      if (data[i + 3] > 0) {
        totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        pixelCount++;
      }
    }
    
    if (pixelCount === 0) return imageData;
    
    const avgBrightness = totalBrightness / pixelCount;
    const targetBrightness = 160;
    const brightnessFactor = targetBrightness / Math.max(avgBrightness, 1);
    
    // Adjust brightness and contrast
    for (let i = 0; i < length; i += 4) {
      if (data[i + 3] === 0) continue;
      
      // Brightness adjustment
      data[i] = Math.min(255, Math.max(0, data[i] * brightnessFactor));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * brightnessFactor));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * brightnessFactor));
      
      // Contrast enhancement
      const factor = 1.2;
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
    }
    
    return imageData;
  }

  // NEW: Improved Auto Crop Algorithm
  static autoCropDocumentImproved(originalCanvas, imageData) {
    const width = imageData.width;
    const height = imageData.height;
    
    // Find document boundaries using multiple methods
    const bounds = this.findDocumentBoundsAdvanced(originalCanvas, imageData);
    
    // Create canvas for result
    const resultCanvas = document.createElement('canvas');
    const resultCtx = resultCanvas.getContext('2d');
    
    if (bounds && bounds.area > width * height * 0.1) {
      // Crop to detected bounds with padding
      const padding = 20;
      const x = Math.max(0, bounds.x - padding);
      const y = Math.max(0, bounds.y - padding);
      const cropWidth = Math.min(width - x, bounds.width + padding * 2);
      const cropHeight = Math.min(height - y, bounds.height + padding * 2);
      
      resultCanvas.width = cropWidth;
      resultCanvas.height = cropHeight;
      
      // Fill with white background
      resultCtx.fillStyle = 'white';
      resultCtx.fillRect(0, 0, cropWidth, cropHeight);
      
      // Draw cropped image
      resultCtx.drawImage(
        originalCanvas,
        x, y, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );
    } else {
      // No clear document found, return original with white background
      resultCanvas.width = width;
      resultCanvas.height = height;
      resultCtx.fillStyle = 'white';
      resultCtx.fillRect(0, 0, width, height);
      resultCtx.drawImage(originalCanvas, 0, 0, width, height);
    }
    
    return resultCanvas;
  }

  // NEW: Advanced Document Detection
  static findDocumentBoundsAdvanced(originalCanvas, imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Method 1: Edge detection
    const edgeBounds = this.findEdges(originalCanvas, width, height);
    
    // Method 2: Color-based detection
    const colorBounds = this.findColorBounds(data, width, height);
    
    // Use the best bounds
    if (edgeBounds && colorBounds) {
      return edgeBounds.area > colorBounds.area ? edgeBounds : colorBounds;
    }
    
    return edgeBounds || colorBounds;
  }

  static findEdges(canvas, width, height) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    // Convert to grayscale first
    tempCtx.drawImage(canvas, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const grayData = this.convertToGrayscale(imageData);
    tempCtx.putImageData(grayData, 0, 0);
    
    // Simple edge detection
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let edgePoints = 0;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Simple horizontal and vertical edge detection
        const horizontalEdge = Math.abs(
          grayData.data[idx - 4] - grayData.data[idx + 4]
        );
        
        const verticalEdge = Math.abs(
          grayData.data[idx - width * 4] - grayData.data[idx + width * 4]
        );
        
        if (horizontalEdge > 30 || verticalEdge > 30) {
          edgePoints++;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    if (edgePoints < 100 || (maxX - minX) < width * 0.2 || (maxY - minY) < height * 0.2) {
      return null;
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      area: (maxX - minX) * (maxY - minY)
    };
  }

  static findColorBounds(data, width, height) {
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let docPoints = 0;
    
    // Look for non-white areas that could be document
    for (let y = 0; y < height; y += 2) { // Sample every 2nd pixel for speed
      for (let x = 0; x < width; x += 2) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Check if pixel is significantly different from white
        if (r < 240 || g < 240 || b < 240) {
          docPoints++;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    if (docPoints < 500 || 
        (maxX - minX) < width * 0.3 || 
        (maxY - minY) < height * 0.3) {
      return null;
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      area: (maxX - minX) * (maxY - minY)
    };
  }

  static convertToGrayscale(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
    return imageData;
  }

  static imageDataToCanvas(imageData) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
}

// React Component
const ImageProcessor = ({ onProcessingComplete }) => {
  const processImage = async (imageData) => {
    try {
      const processedImage = await ImageProcessingUtils.autoCropAndAdjust(imageData);
      onProcessingComplete && onProcessingComplete(processedImage);
      return processedImage;
    } catch (error) {
      console.error('Image processing failed:', error);
      return imageData;
    }
  };

  return null;
};

export { ImageProcessingUtils, ImageProcessor as default };