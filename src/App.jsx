import React, { useState, useEffect } from 'react';
import StudentTable from './components/StudentTable';
import Scanner from './components/Scanner';
import Stats from './components/Stats';
import Camera from './components/Camera';
import { useOpenCV } from './hooks/useOpenCV';
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
  const [showCamera, setShowCamera] = useState(false);
  const { isOpenCVLoaded, loadOpenCV } = useOpenCV();

  useEffect(() => {
    loadOpenCV();
  }, [loadOpenCV]);

  // ✅ Handle individual scan
  const handleScan = (studentId, imageData = null) => {
    setStudents(prev =>
      prev.map(student => {
        if (student.id === studentId) {
          const newScannedPages = [
            ...student.scannedPages,
            {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              imageData
            }
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

  // ✅ Handle capture from camera
  const handleCameraScan = imageData => {
    if (selectedStudent) {
      handleScan(selectedStudent.id, imageData);
    }
  };

  // ✅ Summary stats
  const scannedCount = students.filter(s => s.isScanned).length;
  const absentCount = students.filter(s => s.status === 'Absent').length;
  const totalStudents = students.length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>📱 Fast Scanning App</h1>
          <p>Student Exam Paper Scanning System</p>
        </div>
        <div className="opencv-status">
          OpenCV: {isOpenCVLoaded ? '✅ Loaded' : '⏳ Loading...'}
        </div>
      </header>

      <main className="main-content">
        <Stats total={totalStudents} scanned={scannedCount} absent={absentCount} />

        {selectedStudent && (
          <div className="scanning-overlay">
            <div className="scanning-header">
              <h2>Scanning - {selectedStudent.rollNumber}</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="stop-scan-btn"
              >
                Close
              </button>
            </div>
            <Scanner
              student={selectedStudent}
              onScan={handleScan}
              onCameraRequest={() => setShowCamera(true)}
            />
          </div>
        )}

        <StudentTable
          students={students}
          onScan={handleScan}
          onStatusChange={handleStatusChange}
          onRemarkChange={handleRemarkChange}
          selectedStudent={selectedStudent}
          onSelectStudent={setSelectedStudent}
        />

        {showCamera && (
          <Camera
            onCapture={handleCameraScan}
            onClose={() => setShowCamera(false)}
            isOpenCVLoaded={isOpenCVLoaded}
          />
        )}
      </main>
    </div>
  );
}

export default App;
