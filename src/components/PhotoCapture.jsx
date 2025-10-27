import React, { useRef, useState, useCallback, useEffect } from 'react';
import './PhotoCapture.css';

const PhotoCapture = ({ student, capturedPhotos, onPhotosUpdate, onFinish, onClose }) => {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const keepAndAddRef = useRef(null);
  const finishBtnRef = useRef(null);
  const captureBtnRef = useRef(null);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState(null);

  // Fast camera setup
  const setupCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera setup failed:', error);
    }
  }, [stream]);

  // Quick photo capture
  const handleTakePhoto = useCallback(async () => {
    if (isProcessing) return;

    if (!stream) {
      await setupCamera();
      return;
    }

    setIsProcessing(true);
    
    try {
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const blob = await imageCapture.takePhoto();
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentPhoto(e.target.result);
        setIsProcessing(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Photo capture failed:', error);
      setIsProcessing(false);
      captureFromVideo();
    }
  }, [stream, setupCamera, isProcessing]);

  // Alternative capture method from video
  const captureFromVideo = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      setCurrentPhoto(canvas.toDataURL('image/jpeg', 0.8));
      setIsProcessing(false);
    }
  }, []);

  // Fast file selection
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentPhoto(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Add current photo to captured photos
  const addCurrentPhotoToCaptured = useCallback(() => {
    if (currentPhoto) {
      onPhotosUpdate(prev => [...prev, {
        id: Date.now(),
        data: currentPhoto,
        pageNumber: prev.length + 1,
        timestamp: new Date().toISOString()
      }]);
      setCurrentPhoto(null);
      return true;
    }
    return false;
  }, [currentPhoto, onPhotosUpdate]);

  // Quick photo actions
  const handleKeepAndAddMore = useCallback(() => {
    addCurrentPhotoToCaptured();
    
    // Auto-trigger next capture after short delay
    setTimeout(() => {
      if (!isProcessing) {
        handleTakePhoto();
      }
    }, 300);
  }, [addCurrentPhotoToCaptured, isProcessing, handleTakePhoto]);

  const handleRetake = useCallback(() => {
    setCurrentPhoto(null);
  }, []);

  // Handle Finish - FIRST add current photo, THEN finish
  const handleFinish = useCallback(() => {
    // First, add the current photo if exists
    if (currentPhoto) {
      addCurrentPhotoToCaptured();
    }
    
    // Then check if we have any photos and finish
    if (capturedPhotos.length > 0 || currentPhoto) {
      // Use setTimeout to ensure state update completes
      setTimeout(() => {
        const allPhotos = currentPhoto 
          ? [...capturedPhotos, {
              id: Date.now(),
              data: currentPhoto,
              pageNumber: capturedPhotos.length + 1,
              timestamp: new Date().toISOString()
            }]
          : capturedPhotos;
        
        const photoDataArray = allPhotos.map(photo => photo.data);
        onFinish(photoDataArray);
      }, 100);
    }
  }, [currentPhoto, capturedPhotos, addCurrentPhotoToCaptured, onFinish]);

  // Auto-focus management
  useEffect(() => {
    if (currentPhoto && keepAndAddRef.current) {
      setTimeout(() => {
        keepAndAddRef.current.focus();
      }, 100);
    } else if (!currentPhoto && captureBtnRef.current) {
      setTimeout(() => {
        captureBtnRef.current.focus();
      }, 100);
    }
  }, [currentPhoto]);

  // Smart keyboard shortcuts
  const handleKeyPress = useCallback((e) => {
    const activeElement = document.activeElement;
    
    // If focused on Finish button, handle only Enter for Finish
    if (activeElement === finishBtnRef.current) {
      if (e.key === 'Enter') {
        handleFinish();
        e.preventDefault();
      }
      return;
    }

    // If focused on any other specific button, let browser handle it
    if (activeElement && activeElement !== keepAndAddRef.current) {
      return;
    }

    // Global keyboard shortcuts
    switch (e.key) {
      case 'Enter':
        if (!currentPhoto && !isProcessing) {
          handleTakePhoto();
        } else if (currentPhoto) {
          handleKeepAndAddMore();
        }
        e.preventDefault();
        break;
      
      case 'r':
      case 'R':
        if (currentPhoto) {
          handleRetake();
          e.preventDefault();
        }
        break;
      
      case 'k':
      case 'K':
      case 'f':
      case 'F':
        if ((capturedPhotos.length > 0 || currentPhoto) && !isProcessing) {
          handleFinish();
          e.preventDefault();
        }
        break;
      
      case 'a':
      case 'A':
        if (currentPhoto) {
          handleKeepAndAddMore();
          e.preventDefault();
        }
        break;
      
      case 'Escape':
        onClose();
        e.preventDefault();
        break;
      
      default:
        break;
    }
  }, [currentPhoto, isProcessing, capturedPhotos.length, handleTakePhoto, handleKeepAndAddMore, handleRetake, handleFinish, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Auto-start camera when component mounts
  useEffect(() => {
    setupCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleRemovePhoto = useCallback((photoId) => {
    onPhotosUpdate(prev => prev.filter(photo => photo.id !== photoId));
  }, [onPhotosUpdate]);

  return (
    <div className="photo-capture-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="photo-capture-modal fast-capture">
        {/* Header with quick actions */}
        <div className="capture-header">
          <div className="header-info">
            <h3>📸 {student.rollNumber}</h3>
            <span className="pages-count">
              {capturedPhotos.length + (currentPhoto ? 1 : 0)} pages
            </span>
          </div>
          <div className="quick-actions">
            <button className="quick-btn" onClick={handleTakePhoto} disabled={isProcessing}>
              📷
            </button>
            <button className="quick-btn" onClick={() => fileInputRef.current?.click()}>
              🖼️
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Hidden video for preview */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          style={{ display: 'none' }}
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />

        <div className="capture-content">
          {currentPhoto ? (
            /* Fast Preview Mode - Keep & Next gets auto focus */
            <div className="preview-mode fast-preview">
              <div className="photo-preview">
                <img src={currentPhoto} alt="Captured" />
                <div className="photo-badge">Page {capturedPhotos.length + 1}</div>
              </div>

              <div className="quick-actions-preview">
                <button 
                  ref={keepAndAddRef}
                  className="action-btn keep-add" 
                  onClick={handleKeepAndAddMore}
                >
                  ➕ Keep & Next (Enter/A)
                </button>
                
                <button 
                  ref={finishBtnRef}
                  className="action-btn finish" 
                  onClick={handleFinish}
                >
                  📄 Finish (K/F) - {capturedPhotos.length + 1} pages
                </button>
                
                <button className="action-btn retake" onClick={handleRetake}>
                  🔄 Retake (R)
                </button>
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
                        className="mini-remove"
                        onClick={() => handleRemovePhoto(photo.id)}
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
                    ref={captureBtnRef}
                    className="capture-btn-large"
                    onClick={handleTakePhoto}
                    disabled={isProcessing}
                  >
                    <div className="camera-icon-large">📷</div>
                    <div className="capture-text">Press Enter or Click to Capture</div>
                    <div className="shortcut-hint">Enter Key</div>
                  </button>
                )}
              </div>

              <div className="bottom-actions">
                <button 
                  className="secondary-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Choose File
                </button>
                
                {capturedPhotos.length > 0 && (
                  <button 
                    className="finish-btn-mini" 
                    onClick={handleFinish}
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
          <span>Shortcuts: Enter=Capture/Keep & Next, R=Retake, K/F=Finish, A=Keep & Next, Esc=Close</span>
        </div>
      </div>
    </div>
  );
};

export default PhotoCapture;