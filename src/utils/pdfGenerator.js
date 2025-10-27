import { PDFDocument, rgb } from 'pdf-lib';

export const generateStudentPDF = async (student) => {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add metadata
    pdfDoc.setTitle(`Student Copy - ${student.rollNumber}`);
    pdfDoc.setAuthor('Copy Scanning App');
    pdfDoc.setSubject(`Exam Copies - ${student.subjectName}`);
    
    // Add cover page
    const coverPage = pdfDoc.addPage([600, 800]);
    const { width, height } = coverPage.getSize();
    
    // Add title and student info
    coverPage.drawText('STUDENT EXAM COPY', {
      x: 50,
      y: height - 100,
      size: 24,
      color: rgb(0, 0, 0),
      font: await pdfDoc.embedFont('Helvetica-Bold'),
    });
    
    coverPage.drawText(`Roll Number: ${student.rollNumber}`, {
      x: 50,
      y: height - 150,
      size: 16,
      color: rgb(0, 0, 0),
    });
    
    coverPage.drawText(`Subject: ${student.subjectName} (${student.subjectCode})`, {
      x: 50,
      y: height - 180,
      size: 16,
      color: rgb(0, 0, 0),
    });
    
    coverPage.drawText(`Scan Date: ${new Date(student.scanTime).toLocaleDateString()}`, {
      x: 50,
      y: height - 210,
      size: 16,
      color: rgb(0, 0, 0),
    });
    
    coverPage.drawText(`Total Pages: ${student.scannedPages.length}`, {
      x: 50,
      y: height - 240,
      size: 16,
      color: rgb(0, 0, 0),
    });
    
    coverPage.drawText(`Status: ${student.status}`, {
      x: 50,
      y: height - 270,
      size: 16,
      color: rgb(0, 0, 0),
    });
    
    if (student.remark) {
      coverPage.drawText(`Remark: ${student.remark}`, {
        x: 50,
        y: height - 300,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    // Add scanned pages as images
    for (let i = 0; i < student.scannedPages.length; i++) {
      const page = student.scannedPages[i];
      if (page.imageData) {
        try {
          // Convert base64 to image
          const imageBytes = base64ToUint8Array(page.imageData);
          let image;
          
          // Try different image formats
          try {
            image = await pdfDoc.embedJpg(imageBytes);
          } catch (jpgError) {
            try {
              image = await pdfDoc.embedPng(imageBytes);
            } catch (pngError) {
              console.warn('Could not embed image, skipping page:', pngError);
              continue;
            }
          }
          
          const pdfPage = pdfDoc.addPage([image.width, image.height]);
          pdfPage.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
          
          // Add page number and timestamp
          pdfPage.drawText(`Page ${i + 1} - ${new Date(page.timestamp).toLocaleString()}`, {
            x: 20,
            y: 20,
            size: 10,
            color: rgb(0.5, 0.5, 0.5),
          });
          
        } catch (error) {
          console.error('Error adding page to PDF:', error);
        }
      }
    }

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Create blob and download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Copy-${student.rollNumber}-${student.subjectCode}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('PDF generated successfully for:', student.rollNumber);
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

// Helper function to convert base64 to Uint8Array
function base64ToUint8Array(base64) {
  const binaryString = atob(base64.split(',')[1]);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const generateBatchPDF = async (students) => {
  const scannedStudents = students.filter(s => s.isScanned && s.scannedPages.length > 0);
  
  if (scannedStudents.length === 0) {
    throw new Error('No scanned students found');
  }
  
  // Generate individual PDFs for each student
  for (const student of scannedStudents) {
    await generateStudentPDF(student);
    // Add a small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};