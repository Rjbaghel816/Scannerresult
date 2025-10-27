import React, { useState, useEffect } from 'react';
import StudentTable from './components/StudentTable';
import Stats from './components/Stats';
import PhotoCapture from './components/PhotoCapture';
import { generateStudentPDF } from './utils/pdfGenerator';
import './App.css';

const initialStudents = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  rollNumber: `18103845${(index + 1).toString().padStart(2, '0')}`,
  subjectCode: '611',
  subjectName: 'Physics',
  status: 'Pending',
  remark: '',
  scannedPages: [],
  isScanned: false,
  scanTime: null,
  imageData: null
}));

function App() {
  const [students, setStudents] = useState(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);

  // ✅ Handle multiple photos capture
  const handlePhotosCaptured = (photos) => {
    if (selectedStudent && photos.length > 0) {
      setStudents(prev =>
        prev.map(student => {
          if (student.id === selectedStudent.id) {
            const newScannedPages = [
              ...student.scannedPages,
              ...photos.map((photo, index) => ({
                id: Date.now() + index,
                timestamp: new Date().toISOString(),
                imageData: photo
              }))
            ];

            return {
              ...student,
              isScanned: true,
              scannedPages: newScannedPages,
              status: student.status === 'Pending' ? 'Present' : student.status,
              scanTime: new Date().toISOString()
            };
          }
          return student;
        })
      );
      setCapturedPhotos([]);
      setShowPhotoCapture(false);
    }
  };

  // ✅ Change status manually
  const handleStatusChange = (studentId, newStatus) => {
    setStudents(prev =>
      prev.map(student => {
        if (student.id === studentId) {
          const updated = {
            ...student,
            status: newStatus,
            isScanned: newStatus === 'Absent' ? false : student.isScanned
          };

          if (newStatus === 'Absent') {
            updated.scannedPages = [];
            updated.scanTime = null;
            updated.imageData = null;
          }

          return updated;
        }
        return student;
      })
    );
  };

  // ✅ Handle remarks
  const handleRemarkChange = (studentId, remark) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, remark } : student
      )
    );
  };

  // ✅ Handle PDF generation
  const handleGeneratePDF = async (student) => {
    try {
      await generateStudentPDF(student);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed!');
    }
  };

  // ✅ Handle scan request
  const handleScanRequest = (student) => {
    setSelectedStudent(student);
    setCapturedPhotos([]);
    setShowPhotoCapture(true);
  };

  // ✅ Summary stats
  const scannedCount = students.filter(s => s.isScanned).length;
  const absentCount = students.filter(s => s.status === 'Absent').length;
  const totalStudents = students.length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>📱 Photo Scanner</h1>
          <p>Capture Photos & Generate PDF</p>
        </div>
      </header>

      <main className="main-content">
        <Stats total={totalStudents} scanned={scannedCount} absent={absentCount} />

        <StudentTable
          students={students}
          onStatusChange={handleStatusChange}
          onRemarkChange={handleRemarkChange}
          selectedStudent={selectedStudent}
          onSelectStudent={handleScanRequest}
          onGeneratePDF={handleGeneratePDF}
        />

        {showPhotoCapture && selectedStudent && (
          <PhotoCapture
            student={selectedStudent}
            capturedPhotos={capturedPhotos}
            onPhotosUpdate={setCapturedPhotos}
            onFinish={handlePhotosCaptured}
            onClose={() => setShowPhotoCapture(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;