import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { MatchCitation } from '../types/football';
import { sanitizeClonedDocColors } from './pdfColorSanitizer';

export interface CitationPdfExportOptions {
  citation: MatchCitation;
  clubName?: string;
}

/**
 * Genera y descarga un archivo PDF oficial con la Planilla de Citación de San Luis de Quillota.
 * Utiliza html2canvas-pro y el sanitizador de colores para compatibilidad 100% sin errores oklch.
 */
export async function exportCitationToPdf(
  element: HTMLElement,
  options: CitationPdfExportOptions
): Promise<boolean> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x escala para máxima nitidez de texto y firmas
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 950,
      onclone: (clonedDoc) => {
        sanitizeClonedDocColors(clonedDoc);
      }
    });

    const imgData = canvas.toDataURL('image/png');

    // Formato vertical A4 estándar (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const margin = 8;
    const contentWidth = pdfWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    if (imgHeight <= pdfHeight - margin * 2) {
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }
    }

    const safeOpponent = (options.citation.opponent || 'Partido').replace(/[^a-zA-Z0-9]/g, '_');
    const safeCat = (options.citation.category || 'Categoria').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Citacion_SanLuis_${safeCat}_vs_${safeOpponent}_${options.citation.date || '2026'}.pdf`;

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generando PDF de Citación:', error);
    throw error;
  }
}
