import React, { useRef, useEffect } from 'react';
import './StudentTable.css';

const StudentTable = ({ 
  students, 
  onStatusChange, 
  onRemarkChange, 
  selectedStudent,
  onSelectStudent,
  onGeneratePDF,
  onExcelUpload,
  isExcelUploaded,
  // Pagination Props
  currentPage,
  totalPages,
  totalStudents,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  const scanButtonRefs = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const firstScannableIndex = students.findIndex(
      student => !student.isScanned && student.status !== 'Absent'
    );
    if (firstScannableIndex !== -1 && scanButtonRefs.current[firstScannableIndex]) {
      scanButtonRefs.current[firstScannableIndex].focus();
    }
  }, [students]);

  const handleScanClick = (student) => {
    if (!student.isScanned && student.status !== 'Absent') {
      onSelectStudent(student);
    }
  };

  const handlePDFClick = (student, event) => {
    event.stopPropagation();
    if (student.isScanned && student.scannedPages.length > 0) {
      onGeneratePDF(student);
    }
  };

  const handleExcelUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getScanTime = (scanTime) => {
    if (!scanTime) return '';
    return new Date(scanTime).toLocaleTimeString();
  };

  // ✅ Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="student-table-container">
      {/* Excel Upload Section */}
      <div className="excel-upload-section">
        <button 
          className="excel-upload-btn"
          onClick={handleExcelUploadClick}
          title="Upload Excel file with Roll Numbers and Subject Details"
        >
          📊 Upload Excel File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onExcelUpload}
          accept=".xlsx, .xls, .csv"
          style={{ display: 'none' }}
        />
        <span className="upload-hint">
          Upload Excel with columns: Roll Number, Subject Code, Subject Name
        </span>
      </div>

      {/* Pagination Controls - Top */}
      {students.length > 0 && (
        <div className="pagination-controls top">
          <div className="pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalStudents)} of {totalStudents} students
          </div>
          <div className="pagination-actions">
            <select 
              value={itemsPerPage} 
              onChange={onItemsPerPageChange}
              className="page-size-select"
            >
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            
            <button 
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="pagination-btn first"
            >
              ⏮ First
            </button>
            
            <button 
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn prev"
            >
              ◀ Prev
            </button>
            
            <span className="page-numbers">
              Page {currentPage} of {totalPages}
            </span>
            
            <button 
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn next"
            >
              Next ▶
            </button>
            
            <button 
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-btn last"
            >
              Last ⏭
            </button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        {students.length === 0 ? (
          <div className="empty-state">
            <p>No students data available. Please upload an Excel file.</p>
          </div>
        ) : (
          <table className="students-table">
            <thead className="table-header">
              <tr>
                <th>Roll No</th>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Scan Status</th>
                <th>Pages</th>
                <th>Scan Time</th>
                <th>Status</th>
                <th>Remark</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr 
                  key={student.id} 
                  className={`student-row ${
                    student.isScanned ? 'scanned' : ''
                  } ${
                    selectedStudent?.id === student.id ? 'selected' : ''
                  }`}
                >
                  <td className="roll-number">{student.rollNumber}</td>
                  <td>{student.subjectCode}</td>
                  <td>{student.subjectName}</td>
                  <td>
                    <div className="scan-status">
                      <span className={`status-indicator ${
                        student.isScanned ? 'scanned' : 'pending'
                      }`}>
                        {student.isScanned ? '✓ Scanned' : '⏳ Pending'}
                      </span>
                    </div>
                  </td>
                  <td className="pages-count">
                    {student.scannedPages.length}
                  </td>
                  <td className="scan-time">
                    {getScanTime(student.scanTime)}
                  </td>
                  <td>
                    <select
                      value={student.status}
                      onChange={(e) => onStatusChange(student.id, e.target.value)}
                      className="status-select"
                      disabled={student.isScanned}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={student.remark}
                      onChange={(e) => onRemarkChange(student.id, e.target.value)}
                      placeholder="Add remark..."
                      className="remark-input"
                    />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        ref={el => scanButtonRefs.current[index] = el}
                        className={`scan-btn ${
                          student.isScanned ? 'scanned' : ''
                        } ${
                          student.status === 'Absent' ? 'disabled' : ''
                        }`}
                        onClick={() => handleScanClick(student)}
                        disabled={student.isScanned || student.status === 'Absent'}
                        tabIndex={0}
                      >
                        {student.isScanned ? 'Scanned ✓' : 'Scan Copy'}
                      </button>
                      
                      {student.isScanned && student.scannedPages.length > 0 && (
                        <button 
                          className="pdf-btn"
                          onClick={(e) => handlePDFClick(student, e)}
                          title="Generate PDF"
                        >
                          📄 PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls - Bottom */}
      {students.length > 0 && totalPages > 1 && (
        <div className="pagination-controls bottom">
          <div className="pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalStudents)} of {totalStudents} students
          </div>
          <div className="pagination-actions">
            <button 
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="pagination-btn first"
            >
              ⏮ First
            </button>
            
            <button 
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn prev"
            >
              ◀ Prev
            </button>
            
            <div className="page-numbers-list">
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`pagination-btn page-number ${
                    currentPage === page ? 'active' : ''
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn next"
            >
              Next ▶
            </button>
            
            <button 
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-btn last"
            >
              Last ⏭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTable;