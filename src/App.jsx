import React, { useState, useEffect } from "react";
import StudentTable from "./components/StudentTable";
import Stats from "./components/Stats";
import PhotoCapture from "./components/PhotoCapture";
import apiService from "./services/api";
import "./App.css";

function App() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isExcelUploaded, setIsExcelUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, itemsPerPage]);

  const fetchStudents = async (page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getStudents({
        page,
        limit,
        sortBy: 'rollNumber',
        sortOrder: 'asc'
      });
      
      if (response.success) {
        setStudents(response.students);
        setTotalStudents(response.pagination.totalStudents);
        setTotalPages(response.pagination.totalPages);
        setCurrentPage(response.pagination.currentPage);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Handle photos captured WITHOUT auto-select next
  const handlePhotosCaptured = async (photosArray) => {
    if (selectedStudent && photosArray.length > 0) {
      setLoading(true);
      setError(null);
      try {
        // Convert base64 images to File objects
        const imageFiles = await Promise.all(
          photosArray.map(async (photo, index) => {
            const response = await fetch(photo.data);
            const blob = await response.blob();
            return new File([blob], `page_${index + 1}.jpg`, { type: 'image/jpeg' });
          })
        );

        console.log('Uploading', imageFiles.length, 'images to backend...');

        // Upload files to backend
        const formData = new FormData();
        imageFiles.forEach(file => {
          formData.append('images', file);
        });

        const response = await apiService.uploadScans(selectedStudent._id, formData);
        
        if (response.success) {
          const successMessage = `✅ Successfully scanned ${response.scannedPages || imageFiles.length} pages for ${selectedStudent.rollNumber}`;
          console.log(successMessage);
          alert(successMessage);
          
          // Simply close the modal and refresh data
          setShowPhotoCapture(false);
          setCapturedPhotos([]);
          
          // Refresh students list
          await fetchStudents(currentPage, itemsPerPage);
        } else {
          setError(response.message || "Failed to upload scans");
        }
      } catch (error) {
        console.error("Upload scans error:", error);
        setError(error.message || "Failed to upload scanned images");
      } finally {
        setLoading(false);
      }
    }
  };

  // ✅ FIXED: Handle PDF generation with better error handling
  const handleGeneratePDF = async (student) => {
    setError(null);
    try {
      // Check if student is scanned first
      if (!student.isScanned) {
        setError("Student has not been scanned yet. Please scan copies first.");
        return;
      }

      if (!student.pdfPath) {
        setError("PDF not generated yet. Please wait or rescan the copies.");
        return;
      }

      const result = await apiService.generatePDF(student._id);
      if (result.success) {
        console.log(`✅ PDF downloaded: ${result.filename}`);
        
        // Refresh students list to update PDF status
        await fetchStudents(currentPage, itemsPerPage);
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      setError(error.message || "PDF download failed. Please try scanning again.");
    }
  };

  // ✅ FIXED: Upload actual Excel file instead of parsed data
  const uploadExcelToBackend = async (file) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📤 Uploading file to backend:', file.name);

      // ✅ Create FormData and append the actual file
      const formData = new FormData();
      formData.append('file', file);

      // ✅ Use apiService.uploadExcel with FormData
      const response = await apiService.uploadExcel(formData);
      
      if (response.success) {
        setIsExcelUploaded(true);
        await fetchStudents(1, itemsPerPage); // Refresh with first page
        console.log('✅ Excel upload successful:', response);
      }
    } catch (error) {
      console.error('❌ Excel upload failed:', error);
      setError(error.message || "Failed to upload Excel file");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Handle file upload directly without client-side parsing
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError("Please upload a valid Excel file (.xlsx, .xls)");
      return;
    }

    // ✅ Directly upload the file without client-side parsing
    uploadExcelToBackend(file);

    // Reset file input
    event.target.value = "";
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleStatusChange = async (studentId, newStatus) => {
    try {
      const response = await apiService.updateStudentStatus(studentId, newStatus);
      if (response.success) {
        // Update local state
        setStudents(prev => prev.map(student => 
          student._id === studentId 
            ? { ...student, status: newStatus }
            : student
        ));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      setError("Failed to update student status");
    }
  };

  const handleRemarkChange = async (studentId, remark) => {
    try {
      const response = await apiService.updateStudentRemark(studentId, remark);
      if (response.success) {
        // Update local state
        setStudents(prev => prev.map(student => 
          student._id === studentId 
            ? { ...student, remark }
            : student
        ));
      }
    } catch (error) {
      console.error("Failed to update remark:", error);
      setError("Failed to update student remark");
    }
  };

  const handleScanRequest = (student) => {
    setSelectedStudent(student);
    setShowPhotoCapture(true);
    setCapturedPhotos([]); // Reset photos when starting new scan
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>📱 University Exam Copy Scanner</h1>
          <p>Capture Photos & Generate PDF - Data Saved to Database</p>
        </div>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="error-close">
              ×
            </button>
          </div>
        )}

        <Stats
          total={totalStudents}
          scanned={students.filter(s => s.isScanned).length}
          absent={students.filter(s => s.status === 'Absent').length}
        />

        <StudentTable
          students={students}
          onStatusChange={handleStatusChange}
          onRemarkChange={handleRemarkChange}
          selectedStudent={selectedStudent}
          onSelectStudent={handleScanRequest}
          onGeneratePDF={handleGeneratePDF}
          onExcelUpload={handleFileUpload}
          isExcelUploaded={isExcelUploaded}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalStudents={totalStudents}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />

        {showPhotoCapture && selectedStudent && (
          <PhotoCapture
            student={selectedStudent}
            capturedPhotos={capturedPhotos}
            onPhotosUpdate={setCapturedPhotos}
            onFinish={handlePhotosCaptured}
            onClose={() => {
              setShowPhotoCapture(false);
              setCapturedPhotos([]);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;