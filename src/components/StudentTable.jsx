import React, { useRef, useEffect } from 'react';
import './StudentTable.css';

const StudentTable = ({ 
  students, 
  onScan, 
  onStatusChange, 
  onRemarkChange, 
  selectedStudent,
  onSelectStudent,
  onGeneratePDF
}) => {
  const scanButtonRefs = useRef([]);

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

  const getScanTime = (scanTime) => {
    if (!scanTime) return '';
    return new Date(scanTime).toLocaleTimeString();
  };

  return (
    <div className="student-table-container">
      <div className="table-wrapper">
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
      </div>
    </div>
  );
};

export default StudentTable;