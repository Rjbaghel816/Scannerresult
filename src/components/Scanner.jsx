import React, { useState } from 'react';
import { generatePDF } from '../utils/pdfGenerator';
import './Scanner.css';

const Scanner = ({ student, onScan, onCameraRequest }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanMethod, setScanMethod] = useState('manual');

  const handleManualScan = () => {
    if (!student.isScanned && student.status !== 'Absent') {
      setIsProcessing(true);
      setTimeout(() => {
        onScan(student.id);
        setIsProcessing(false);
      }, 1000);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setTimeout(() => {
          onScan(student.id, e.target.result);
          setIsProcessing(false);
          event.target.value = ''; // Reset input
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setIsProcessing(true);
      await generatePDF([student]);
      setIsProcessing(false);
    } catch (error) {
      console.error('PDF generation failed:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="scanner-container">
      <div className="scanner-header">
        <h3>Scanning: {student.rollNumber}</h3>
        <div className="scan-methods">
          <button
            className={`method-btn ${scanMethod === 'manual' ? 'active' : ''}`}
            onClick={() => setScanMethod('manual')}
          >
            Manual Scan
          </button>
          <button
            className={`method-btn ${scanMethod === 'camera' ? 'active' : ''}`}
            onClick={() => {
              setScanMethod('camera');
              onCameraRequest();
            }}
          >
            Camera Scan
          </button>
          <button
            className={`method-btn ${scanMethod === 'upload' ? 'active' : ''}`}
            onClick={() => setScanMethod('upload')}
          >
            File Upload
          </button>
        </div>
      </div>

      <div className="scanner-content">
        {scanMethod === 'manual' && (
          <div className="manual-scan">
            <div className="scan-placeholder">
              <div className="scanner-animation">
                <div className="scan-line"></div>
              </div>
              <p>Ready for manual scanning</p>
            </div>
            <button
              className={`scan-now-btn ${isProcessing ? 'processing' : ''}`}
              onClick={handleManualScan}
              disabled={isProcessing || student.isScanned}
            >
              {isProcessing ? 'Processing...' : 'Scan Now'}
            </button>
          </div>
        )}

        {scanMethod === 'upload' && (
          <div className="file-upload-scan">
            <div className="upload-area">
              <input
                type="file"
                id="file-upload"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="file-input"
              />
              <label htmlFor="file-upload" className="upload-label">
                <div className="upload-icon">📁</div>
                <p>Click to upload scan file</p>
                <span>Supports: JPG, PNG, PDF</span>
              </label>
            </div>
          </div>
        )}

        {scanMethod === 'camera' && (
          <div className="camera-scan">
            <div className="camera-placeholder">
              <div className="camera-icon">📷</div>
              <p>Camera interface would open here</p>
              <button
                className="open-camera-btn"
                onClick={onCameraRequest}
              >
                Open Camera
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="scanner-actions">
        <button
          className="pdf-btn"
          onClick={handleGeneratePDF}
          disabled={isProcessing || !student.isScanned}
        >
          Generate PDF
        </button>
        
        <div className="scan-info">
          <p><strong>Pages Scanned:</strong> {student.scannedPages.length}</p>
          <p><strong>Status:</strong> {student.status}</p>
          {student.scanTime && (
            <p><strong>Last Scan:</strong> {new Date(student.scanTime).toLocaleString()}</p>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="processing-overlay">
          <div className="spinner"></div>
          <p>Processing scan...</p>
        </div>
      )}
    </div>
  );
};

export default Scanner;