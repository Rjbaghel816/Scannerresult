import { PDFDocument, rgb } from 'pdf-lib';

export const generatePDF = async (students) => {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a title page
    const titlePage = pdfDoc.addPage();
    const { width, height } = titlePage.getSize();
    
    // Add title
    titlePage.drawText('STUDENT EXAM SCANS REPORT', {
      x: 50,
      y: height - 100,
      size: 24,
      color: rgb(0, 0, 0),
    });
    
    titlePage.drawText(`Generated on: ${new Date().toLocaleString()}`, {
      x: 50,
      y: height - 150,
      size: 12,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Add student data
    const scannedStudents = students.filter(s => s.isScanned);
    
    if (scannedStudents.length > 0) {
      let currentPage = titlePage;
      let yPosition = height - 200;
      
      scannedStudents.forEach((student, index) => {
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage();
          yPosition = height - 50;
        }
        
        currentPage.drawText(`Student: ${student.rollNumber}`, {
          x: 50,
          y: yPosition,
          size: 14,
          color: rgb(0, 0, 0),
        });
        
        yPosition -= 30;
        
        currentPage.drawText(`Subject: ${student.subjectName} (${student.subjectCode})`, {
          x: 50,
          y: yPosition,
          size: 12,
          color: rgb(0.3, 0.3, 0.3),
        });
        
        yPosition -= 20;
        
        currentPage.drawText(`Pages Scanned: ${student.scannedPages.length}`, {
          x: 50,
          y: yPosition,
          size: 12,
          color: rgb(0.3, 0.3, 0.3),
        });
        
        yPosition -= 20;
        
        currentPage.drawText(`Scan Time: ${student.scanTime ? new Date(student.scanTime).toLocaleString() : 'N/A'}`, {
          x: 50,
          y: yPosition,
          size: 12,
          color: rgb(0.3, 0.3, 0.3),
        });
        
        yPosition -= 40;
        
        // Add a separator line
        currentPage.drawLine({
          start: { x: 50, y: yPosition },
          end: { x: width - 50, y: yPosition },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8),
        });
        
        yPosition -= 20;
      });
    }

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Create blob and download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-scans-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('PDF generated successfully');
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

export const generateStudentPDF = async (student) => {
  return generatePDF([student]);
};

export const generateBatchPDF = async (students) => {
  const scannedStudents = students.filter(s => s.isScanned);
  return generatePDF(scannedStudents);
};