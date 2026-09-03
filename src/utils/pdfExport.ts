import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * High-definition, 1-click PDF generator for client-side receipts and documents.
 * Captures the target DOM element, formats it to standard A4 (210mm x 297mm),
 * and triggers immediate file download.
 */
export async function downloadElementAsPdf(
  elementOrId: HTMLElement | string,
  fileName: string = 'document'
): Promise<boolean> {
  let targetEl: HTMLElement | null = null;

  if (typeof elementOrId === 'string') {
    targetEl = document.getElementById(elementOrId);
  } else {
    targetEl = elementOrId;
  }

  if (!targetEl) {
    console.error(`[pdfExport] Element not found:`, elementOrId);
    return false;
  }

  try {
    // Clean up filename
    const safeFileName = fileName
      .trim()
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .replace(/_+/g, '_');

    // Run html2canvas with optimal settings for sharp vector-like text
    const canvas = await html2canvas(targetEl, {
      scale: 2, // High resolution for retina/crisp prints
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (element) => {
        return (
          element.classList.contains('print:hidden') ||
          element.classList.contains('no-print') ||
          element.tagName === 'BUTTON'
        );
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const margin = 8; // 8mm margin
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    if (contentHeight <= pdfHeight - margin * 2) {
      // Fits on a single A4 page
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
    } else {
      // Multi-page handling
      let heightLeft = contentHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - contentHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }
    }

    pdf.save(`${safeFileName}.pdf`);
    return true;
  } catch (error) {
    console.error('[pdfExport] Failed to generate PDF:', error);
    return false;
  }
}
