import React, { useRef, useState, useCallback, useEffect } from "react";
import { ImageProcessingUtils } from "./ImageProcessor";
import "./PhotoCapture.css";

const PhotoCapture = ({
  student,
  capturedPhotos,
  onPhotosUpdate,
  onFinish,
  onClose,
}) => {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const keepAndAddRef = useRef(null);
  const finishBtnRef = useRef(null);
  const captureBtnRef = useRef(null);
  const imageRef = useRef(null);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [stream, setStream] = useState(null);
  const [showCropTool, setShowCropTool] = useState(false);
  const [cropArea, setCropArea] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Camera setup with better error handling
  const setupCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera setup failed:", error);
      // Fallback to user camera if environment fails
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (fallbackError) {
        console.error("Fallback camera also failed:", fallbackError);
      }
    }
  }, [stream]);

  // Optimized image processing
  const processCapturedImage = async (imageData) => {
    setIsImageProcessing(true);
    try {
      const processedImage = await ImageProcessingUtils.autoCropAndAdjust(
        imageData
      );
      return processedImage;
    } catch (error) {
      console.error("Image processing failed, using original:", error);
      return imageData;
    } finally {
      setIsImageProcessing(false);
    }
  };

  // Enhanced manual crop with validation
  const handleManualCrop = async () => {
    if (!currentPhoto || !cropArea) return;

    setIsCropping(true);
    try {
      // Validate crop area
      const img = imageRef.current;
      if (img) {
        const validCropArea = {
          x: Math.max(0, cropArea.x),
          y: Math.max(0, cropArea.y),
          width: Math.min(img.naturalWidth - cropArea.x, cropArea.width),
          height: Math.min(img.naturalHeight - cropArea.y, cropArea.height),
        };

        if (validCropArea.width < 20 || validCropArea.height < 20) {
          alert("Crop area too small. Minimum size is 20x20 pixels.");
          return;
        }

        const croppedImage = await ImageProcessingUtils.manualCrop(
          currentPhoto,
          validCropArea
        );
        setCurrentPhoto(croppedImage);
      }
    } catch (error) {
      console.error("Manual crop failed:", error);
      alert("Crop failed. Please try again.");
    } finally {
      setIsCropping(false);
      setShowCropTool(false);
      setCropArea(null);
    }
  };

  // Optimized photo capture with better error handling
  const handleTakePhoto = useCallback(async () => {
    if (isProcessing || isImageProcessing || isCropping) return;

    if (!stream) {
      await setupCamera();
      return;
    }

    setIsProcessing(true);

    try {
      // Try ImageCapture API first
      if ("ImageCapture" in window) {
        const track = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);
        const blob = await imageCapture.takePhoto();

        const reader = new FileReader();
        reader.onload = async (e) => {
          const originalImage = e.target.result;
          const processedImage = await processCapturedImage(originalImage);
          setCurrentPhoto(processedImage);
          setIsProcessing(false);
        };
        reader.readAsDataURL(blob);
      } else {
        // Fallback to canvas capture
        captureFromVideo();
      }
    } catch (error) {
      console.error("Photo capture failed:", error);
      captureFromVideo();
    }
  }, [stream, setupCamera, isProcessing, isImageProcessing, isCropping]);

  // Improved video capture with quality settings
  const captureFromVideo = useCallback(async () => {
    if (videoRef.current && stream) {
      const canvas = document.createElement("canvas");
      const video = videoRef.current;
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      const originalImage = canvas.toDataURL("image/jpeg", 0.85);
      const processedImage = await processCapturedImage(originalImage);

      setCurrentPhoto(processedImage);
      setIsProcessing(false);
    }
  }, [stream]);

  // Fast file selection with image validation
  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size should be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const originalImage = e.target.result;
      const processedImage = await processCapturedImage(originalImage);
      setCurrentPhoto(processedImage);
    };
    reader.onerror = () => {
      alert("Error reading file. Please try another image.");
    };
    reader.readAsDataURL(file);

    // Reset file input
    event.target.value = "";
  }, []);

  // Optimized photo management
  const addCurrentPhotoToCaptured = useCallback(() => {
    if (currentPhoto) {
      const newPhoto = {
        id: Date.now() + Math.random(),
        data: currentPhoto,
        pageNumber: capturedPhotos.length + 1,
        timestamp: new Date().toISOString(),
        studentRoll: student.rollNumber,
      };

      onPhotosUpdate((prev) => [...prev, newPhoto]);
      setCurrentPhoto(null);
      return true;
    }
    return false;
  }, [currentPhoto, capturedPhotos.length, onPhotosUpdate, student.rollNumber]);

  // Improved photo actions with better timing
  const handleKeepAndAddMore = useCallback(() => {
    if (currentPhoto) {
      const added = addCurrentPhotoToCaptured();
      if (added) {
        // Auto-trigger next capture with better delay management
        setTimeout(() => {
          if (!isProcessing && !isImageProcessing) {
            handleTakePhoto();
          }
        }, 300);
      }
    }
  }, [
    currentPhoto,
    addCurrentPhotoToCaptured,
    isProcessing,
    isImageProcessing,
    handleTakePhoto,
  ]);

  const handleRetake = useCallback(() => {
    setCurrentPhoto(null);
    setShowCropTool(false);
    setCropArea(null);
  }, []);

  // Enhanced finish with validation
  const handleFinish = useCallback(() => {
    const totalPhotos = capturedPhotos.length + (currentPhoto ? 1 : 0);

    if (totalPhotos === 0) {
      alert("Please capture at least one photo before finishing.");
      return;
    }

    let photosToFinish = [...capturedPhotos];

    if (currentPhoto) {
      const newPhoto = {
        id: Date.now(),
        data: currentPhoto,
        pageNumber: capturedPhotos.length + 1,
        timestamp: new Date().toISOString(),
        studentRoll: student.rollNumber,
      };
      photosToFinish.push(newPhoto);
      onPhotosUpdate(photosToFinish);
    }

    // Small delay to ensure state updates
    setTimeout(() => {
      const photoDataArray = photosToFinish.map((photo) => photo.data);
      onFinish(photoDataArray);
    }, 100);
  }, [
    currentPhoto,
    capturedPhotos,
    onPhotosUpdate,
    onFinish,
    student.rollNumber,
  ]);

  // Improved crop handlers with boundary checks
  const handleCropStart = (e) => {
    if (!showCropTool || !imageRef.current) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();

    // Calculate actual image display dimensions
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = rect.width / rect.height;

    let displayedWidth, displayedHeight, offsetX, offsetY;

    if (imgRatio > containerRatio) {
      displayedWidth = rect.width;
      displayedHeight = rect.width / imgRatio;
      offsetX = 0;
      offsetY = (rect.height - displayedHeight) / 2;
    } else {
      displayedWidth = rect.height * imgRatio;
      displayedHeight = rect.height;
      offsetX = (rect.width - displayedWidth) / 2;
      offsetY = 0;
    }

    const scaleX = img.naturalWidth / displayedWidth;
    const scaleY = img.naturalHeight / displayedHeight;

    const x = (e.clientX - rect.left - offsetX) * scaleX;
    const y = (e.clientY - rect.top - offsetY) * scaleY;

    // Enhanced boundary checking
    if (x >= 0 && x <= img.naturalWidth && y >= 0 && y <= img.naturalHeight) {
      setIsDragging(true);
      setCropArea({
        x,
        y,
        width: 0,
        height: 0,
        startX: x,
        startY: y,
        scaleX,
        scaleY,
        offsetX,
        offsetY,
        displayedWidth,
        displayedHeight,
      });
    }
  };

  const handleCropMove = (e) => {
    if (!showCropTool || !cropArea || !isDragging || !imageRef.current) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();

    const x = (e.clientX - rect.left - cropArea.offsetX) * cropArea.scaleX;
    const y = (e.clientY - rect.top - cropArea.offsetY) * cropArea.scaleY;

    setCropArea((prev) => ({
      ...prev,
      width: x - prev.startX,
      height: y - prev.startY,
    }));
  };

  const handleCropEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (
      cropArea &&
      Math.abs(cropArea.width) > 20 &&
      Math.abs(cropArea.height) > 20
    ) {
      const x =
        cropArea.width < 0 ? cropArea.startX + cropArea.width : cropArea.startX;
      const y =
        cropArea.height < 0
          ? cropArea.startY + cropArea.height
          : cropArea.startY;
      const width = Math.abs(cropArea.width);
      const height = Math.abs(cropArea.height);

      const img = imageRef.current;
      const normalizedCrop = {
        x: Math.max(0, Math.min(x, img.naturalWidth - 10)),
        y: Math.max(0, Math.min(y, img.naturalHeight - 10)),
        width: Math.max(20, Math.min(width, img.naturalWidth - x)),
        height: Math.max(20, Math.min(height, img.naturalHeight - y)),
        ...cropArea,
      };

      setCropArea(normalizedCrop);
    } else {
      setCropArea(null);
    }
  };

  // Calculate display coordinates for crop area
  const getDisplayCropArea = () => {
    if (!cropArea || !imageRef.current) return null;

    return {
      left: cropArea.x / cropArea.scaleX + cropArea.offsetX,
      top: cropArea.y / cropArea.scaleY + cropArea.offsetY,
      width: cropArea.width / cropArea.scaleX,
      height: cropArea.height / cropArea.scaleY,
    };
  };

  const displayCropArea = getDisplayCropArea();

  // Fixed keyboard shortcuts - Only handle Enter when not focused on buttons
  const handleKeyPress = useCallback(
    (e) => {
      // Check if user is focused on any button
      const activeElement = document.activeElement;
      const isFocusOnButton = activeElement?.tagName === 'BUTTON';
      
      // If user is focused on a button and presses Enter, let browser handle it
      if (isFocusOnButton && e.key === 'Enter') {
        return;
      }

      // Prevent default for other handled keys
      if ([
        "r", "R", "c", "C", "k", "K", "f", "F", "a", "A", "Escape"
      ].includes(e.key)) {
        e.preventDefault();
      }

      if (showCropTool) {
        switch (e.key) {
          case "Escape":
            setShowCropTool(false);
            setCropArea(null);
            break;
          case "Enter":
            if (cropArea) handleManualCrop();
            break;
        }
        return;
      }

      switch (e.key) {
        case "Enter":
          // Only handle Enter if not focused on any button
          if (!isFocusOnButton) {
            if (!currentPhoto && !isProcessing && !isImageProcessing) {
              handleTakePhoto();
            } else if (currentPhoto) {
              handleKeepAndAddMore();
            }
          }
          break;
        case "r":
        case "R":
          if (currentPhoto) handleRetake();
          break;
        case "c":
        case "C":
          if (currentPhoto) setShowCropTool(true);
          break;
        case "k":
        case "K":
        case "f":
        case "F":
          if (
            (capturedPhotos.length > 0 || currentPhoto) &&
            !isProcessing &&
            !isImageProcessing
          ) {
            handleFinish();
          }
          break;
        case "a":
        case "A":
          if (currentPhoto) handleKeepAndAddMore();
          break;
        case "Escape":
          onClose();
          break;
      }
    },
    [
      currentPhoto,
      isProcessing,
      isImageProcessing,
      capturedPhotos.length,
      showCropTool,
      cropArea,
      handleTakePhoto,
      handleKeepAndAddMore,
      handleRetake,
      handleFinish,
      onClose,
      handleManualCrop,
    ]
  );

  // Auto-focus management
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentPhoto && keepAndAddRef.current && !showCropTool) {
        keepAndAddRef.current.focus();
      } else if (!currentPhoto && captureBtnRef.current) {
        captureBtnRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [currentPhoto, showCropTool]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Auto-start camera when component mounts
  useEffect(() => {
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleRemovePhoto = useCallback(
    (photoId) => {
      onPhotosUpdate((prev) => prev.filter((photo) => photo.id !== photoId));
    },
    [onPhotosUpdate]
  );

  // Reset crop when showing crop tool
  useEffect(() => {
    if (showCropTool) {
      setCropArea(null);
    }
  }, [showCropTool]);

  return (
    <div
      className="photo-capture-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="photo-capture-modal fast-capture">
        {/* Header with quick actions */}
        <div className="capture-header">
          <div className="header-info">
            <h3>
              📸 {student.rollNumber} - {student.name}
            </h3>
            <span className="pages-count">
              {capturedPhotos.length + (currentPhoto ? 1 : 0)} pages
              {isImageProcessing && " (Enhancing...)"}
              {isCropping && " (Cropping...)"}
            </span>
          </div>
          <div className="quick-actions">
            <button
              type="button"
              className="quick-btn"
              onClick={handleTakePhoto}
              disabled={isProcessing || isImageProcessing || isCropping}
              title="Take Photo"
            >
              📷
            </button>
            <button
              type="button"
              className="quick-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Choose from Files"
            >
              🖼️
            </button>
            <button 
              type="button"
              className="close-btn" 
              onClick={onClose} 
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Hidden video for preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: "none" }}
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
        />

        <div className="capture-content">
          {currentPhoto ? (
            /* Preview Mode with Crop Tool */
            <div className="preview-mode fast-preview">
              <div
                className={`photo-preview ${showCropTool ? "crop-mode" : ""}`}
              >
                <div className="image-container">
                  <img
                    ref={imageRef}
                    src={currentPhoto}
                    alt="Captured"
                    onMouseDown={showCropTool ? handleCropStart : undefined}
                    onMouseMove={showCropTool ? handleCropMove : undefined}
                    onMouseUp={showCropTool ? handleCropEnd : undefined}
                    onMouseLeave={showCropTool ? handleCropEnd : undefined}
                    style={{ cursor: showCropTool ? "crosshair" : "default" }}
                  />
                  <div className="photo-badge">
                    Page {capturedPhotos.length + 1}
                  </div>

                  {/* Crop Area Overlay */}
                  {showCropTool && displayCropArea && (
                    <div
                      className="crop-area"
                      style={{
                        left: `${displayCropArea.left}px`,
                        top: `${displayCropArea.top}px`,
                        width: `${displayCropArea.width}px`,
                        height: `${displayCropArea.height}px`,
                      }}
                    >
                      <div className="crop-handle top-left"></div>
                      <div className="crop-handle top-right"></div>
                      <div className="crop-handle bottom-left"></div>
                      <div className="crop-handle bottom-right"></div>
                    </div>
                  )}

                  {(isImageProcessing || isCropping) && (
                    <div className="processing-overlay">
                      <div className="spinner"></div>
                      <p>
                        {isCropping
                          ? "Cropping Image..."
                          : "Enhancing Image..."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="quick-actions-preview">
                {showCropTool ? (
                  <div className="crop-actions">
                    <button
                      type="button"
                      className="action-btn crop-confirm"
                      onClick={handleManualCrop}
                      disabled={!cropArea || isCropping}
                    >
                      ✅ Crop Image (Enter)
                    </button>
                    <button
                      type="button"
                      className="action-btn crop-cancel"
                      onClick={() => {
                        setShowCropTool(false);
                        setCropArea(null);
                      }}
                    >
                      ❌ Cancel (Esc)
                    </button>
                    {cropArea && (
                      <div className="crop-size-info">
                        Size: {Math.round(cropArea.width)} ×{" "}
                        {Math.round(cropArea.height)}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      ref={keepAndAddRef}
                      className="action-btn keep-add"
                      onClick={handleKeepAndAddMore}
                      disabled={isImageProcessing || isCropping}
                    >
                      ➕ Keep & Next (Enter/A)
                    </button>

                    <button
                      type="button"
                      ref={finishBtnRef}
                      className="action-btn finish"
                      onClick={handleFinish}
                      disabled={isImageProcessing || isCropping}
                    >
                      📄 Finish (K/F)
                    </button>
                    <button
                      type="button"
                      className="action-btn crop"
                      onClick={() => setShowCropTool(true)}
                      disabled={isImageProcessing || isCropping}
                    >
                      ✂️ Crop (C)
                    </button>

                    <button
                      type="button"
                      className="action-btn retake"
                      onClick={handleRetake}
                      disabled={isImageProcessing || isCropping}
                    >
                      🔄 Retake (R)
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Fast Capture Interface */
            <div className="capture-mode fast-capture-ui">
              {capturedPhotos.length > 0 && (
                <div className="photos-grid-mini">
                  {capturedPhotos.slice(-4).map((photo) => (
                    <div key={photo.id} className="mini-photo">
                      <img src={photo.data} alt={`Page ${photo.pageNumber}`} />
                      <span className="mini-page-no">{photo.pageNumber}</span>
                      <button
                        type="button"
                        className="mini-remove"
                        onClick={() => handleRemovePhoto(photo.id)}
                        title="Remove this page"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="capture-main">
                {isProcessing ? (
                  <div className="processing-overlay">
                    <div className="spinner"></div>
                    <p>Capturing...</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    ref={captureBtnRef}
                    className="capture-btn-large"
                    onClick={handleTakePhoto}
                    disabled={isProcessing || isImageProcessing || isCropping}
                  >
                    <div className="camera-icon-large">📷</div>
                    <div className="capture-text">
                      Press Enter or Click to Capture
                    </div>
                    <div className="shortcut-hint">Enter Key</div>
                    {isImageProcessing && (
                      <div className="processing-text">Processing Image...</div>
                    )}
                  </button>
                )}
              </div>

              <div className="bottom-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImageProcessing || isCropping}
                >
                  📁 Choose File
                </button>

                {capturedPhotos.length > 0 && (
                  <button
                    type="button"
                    className="finish-btn-mini"
                    onClick={handleFinish}
                    disabled={isImageProcessing || isCropping}
                  >
                    📄 Finish ({capturedPhotos.length} pages)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="shortcuts-help">
          {showCropTool ? (
            <span>
              Draw crop area → Enter to confirm • Esc to cancel • Minimum size:
              20×20 pixels
            </span>
          ) : (
            <>
              <span>
                Shortcuts: Enter=Capture/Keep & Next, R=Retake, C=Crop,
                K/F=Finish, A=Keep & Next, Esc=Close
              </span>
              <br />
              <span className="feature-text">
                ✨ Auto-crop & Manual Crop: ACTIVE • Student:{" "}
                {student.rollNumber}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoCapture;