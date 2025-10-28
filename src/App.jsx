import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import StudentTable from "./components/StudentTable";
import Stats from "./components/Stats";
import PhotoCapture from "./components/PhotoCapture";
import { generateStudentPDF } from "./utils/pdfGenerator";
import "./App.css";

// Initial students array (empty now since we'll load from Excel)
const initialStudents = [];

function App() {
  const [students, setStudents] = useState(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isExcelUploaded, setIsExcelUploaded] = useState(false);

  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // ✅ Excel File Process Function
  const processExcelFile = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Validate Excel structure
        if (jsonData.length < 2) {
          alert("Excel file must contain at least one data row");
          return;
        }

        const headers = jsonData[0].map((header) =>
          header?.toString().toLowerCase().trim()
        );

        // Check required columns
        const requiredColumns = ["roll number", "subject code", "subject name"];
        const missingColumns = requiredColumns.filter(
          (col) => !headers.includes(col)
        );

        if (missingColumns.length > 0) {
          alert(`Missing required columns: ${missingColumns.join(", ")}`);
          return;
        }

        // Get column indices
        const rollNumberIndex = headers.indexOf("roll number");
        const subjectCodeIndex = headers.indexOf("subject code");
        const subjectNameIndex = headers.indexOf("subject name");

        // Process data rows
        const processedData = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.length >= 3) {
            processedData.push({
              rollNumber: row[rollNumberIndex]?.toString().trim(),
              subjectCode: row[subjectCodeIndex]?.toString().trim(),
              subjectName: row[subjectNameIndex]?.toString().trim(),
            });
          }
        }

        if (processedData.length === 0) {
          alert("No valid data found in Excel file");
          return;
        }

        // Auto-create students from Excel data
        createStudentsFromExcel(processedData);
        setIsExcelUploaded(true);
        setCurrentPage(1); // Reset to first page after upload
      } catch (error) {
        console.error("Error processing Excel file:", error);
        alert("Error processing Excel file. Please check the format.");
      }
    };

    reader.onerror = () => {
      alert("Error reading file");
    };

    reader.readAsArrayBuffer(file);
  };

  // ✅ Excel Data से Students Create करने का Function
  const createStudentsFromExcel = (excelData) => {
    const newStudents = excelData.map((row, index) => ({
      id: `student-${Date.now()}-${index}`,
      rollNumber: row.rollNumber,
      subjectCode: row.subjectCode,
      subjectName: row.subjectName,
      status: "Pending",
      remark: "",
      scannedPages: [],
      isScanned: false,
      scanTime: null,
      imageData: null,
    }));

    setStudents(newStudents);
  };

  // ✅ File Input Handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(xlsx|xls|csv)$/)
    ) {
      alert("Please upload a valid Excel file (.xlsx, .xls, .csv)");
      return;
    }

    processExcelFile(file);
    event.target.value = ""; // Reset file input
  };

  // ✅ Pagination Calculations
  const totalPages = Math.ceil(students.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = students.slice(startIndex, endIndex);

  // ✅ Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // ✅ Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  // ✅ Handle multiple photos capture
  const handlePhotosCaptured = (photos) => {
    if (selectedStudent && photos.length > 0) {
      setStudents((prev) =>
        prev.map((student) => {
          if (student.id === selectedStudent.id) {
            const newScannedPages = [
              ...student.scannedPages,
              ...photos.map((photo, index) => ({
                id: Date.now() + index,
                timestamp: new Date().toISOString(),
                imageData: photo,
              })),
            ];

            return {
              ...student,
              isScanned: true,
              scannedPages: newScannedPages,
              status: student.status === "Pending" ? "Present" : student.status,
              scanTime: new Date().toISOString(),
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
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id === studentId) {
          const updated = {
            ...student,
            status: newStatus,
            isScanned: newStatus === "Absent" ? false : student.isScanned,
          };

          if (newStatus === "Absent") {
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
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, remark } : student
      )
    );
  };

  // ✅ Handle PDF generation
  const handleGeneratePDF = async (student) => {
    try {
      await generateStudentPDF(student);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("PDF generation failed!");
    }
  };

  // ✅ Handle scan request
  const handleScanRequest = (student) => {
    setSelectedStudent(student);
    setCapturedPhotos([]);
    setShowPhotoCapture(true);
  };

  // ✅ Summary stats
  const scannedCount = students.filter((s) => s.isScanned).length;
  const absentCount = students.filter((s) => s.status === "Absent").length;
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
        <Stats
          total={totalStudents}
          scanned={scannedCount}
          absent={absentCount}
        />

        <StudentTable
          students={currentStudents}
          onStatusChange={handleStatusChange}
          onRemarkChange={handleRemarkChange}
          selectedStudent={selectedStudent}
          onSelectStudent={handleScanRequest}
          onGeneratePDF={handleGeneratePDF}
          onExcelUpload={handleFileUpload}
          isExcelUploaded={isExcelUploaded}
          // Pagination Props
          currentPage={currentPage}
          totalPages={totalPages}
          totalStudents={students.length}
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
            onClose={() => setShowPhotoCapture(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
