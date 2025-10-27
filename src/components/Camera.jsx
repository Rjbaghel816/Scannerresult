import React, { useRef, useEffect, useState } from 'react';
import { useCamera } from '../hooks/useCamera';
import { processImage } from '../utils/imageProcessor';
import './Camera.css';

const Camera = ({ onCapture, onClose, isOpenCVLoaded }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { startCamera, stopCamera, captureImage, isCameraActive } = useCamera(videoRef);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = async () => {
    if (!isCameraActive) return;

    setIsProcessing(true);
    try {
      const imageData = captureImage();
      setCapturedImage(imageData);

      // Process image with OpenCV if loaded
      let processedImage = imageData;
      if (isOpenCVLoaded) {
        processedImage = await processImage(imageData);
      }

      onCapture(processedImage);
      setIsProcessing(false);
    } catch (error) {
      console.error('Capture failed:', error);
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleUseImage = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal">
        <div className="camera-header">
          <h3>Camera Scanner</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="camera-content">
          {!capturedImage ? (
            <>
              <div className="camera-preview">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="video-element"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
              
              <div className="camera-controls">
                <button
                  className="capture-btn"
                  onClick={handleCapture}
                  disabled={isProcessing || !isCameraActive}
                >
                  {isProcessing ? 'Processing...' : 'Capture'}
                </button>
                <button className="cancel-btn" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="capture-review">
              <div className="captured-image">
                <img src={capturedImage} alt="Captured scan" />
              </div>
              <div className="review-controls">
                <button className="retake-btn" onClick={handleRetake}>
                  Retake
                </button>
                <button className="use-image-btn" onClick={handleUseImage}>
                  Use This Image
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="camera-status">
          <p>
            Camera: {isCameraActive ? '✅ Active' : '❌ Inactive'} | 
            OpenCV: {isOpenCVLoaded ? '✅ Loaded' : '❌ Not Loaded'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Camera;