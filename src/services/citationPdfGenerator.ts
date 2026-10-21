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
 * Renderizado idéntico a la vista en pantalla:
 * - Colores exactos (amarillo canario, slate oscuro, acentos) sin distorsiones oklch.
 * - Ajuste perfecto en 1 página A4 vertical sin cortes ni páginas en blanco.
 */
export async function exportCitationToPdf(
  element: HTMLElement,
  options: CitationPdfExportOptions
): Promise<boolean> {
  try {
    const elWidth = element.offsetWidth || 800;
    const elHeight = element.offsetHeight || 1050;

    const canvas = await html2canvas(element, {
      scale: 2, // 2x escala para máxima nitidez de texto, fotos y escudos
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: elWidth,
      height: elHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        // Sanitizar hojas de estilo y sincronizar estilos computados en vivo
        sanitizeClonedDocColors(clonedDoc, element);

        const clonedSheet = clonedDoc.getElementById('printable-citation-sheet');
        if (clonedSheet) {
          clonedSheet.style.width = `${elWidth}px`;
          clonedSheet.style.maxWidth = `${elWidth}px`;
          clonedSheet.style.margin = '0 auto';
          clonedSheet.style.boxSizing = 'border-box';
          clonedSheet.style.backgroundColor = '#ffffff';
        }
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

    const marginX = 8;
    const marginY = 8;
    const maxContentWidth = pdfWidth - marginX * 2;
    const maxContentHeight = pdfHeight - marginY * 2;

    const imgRatio = canvas.width / canvas.height;
    let renderWidth = maxContentWidth;
    let renderHeight = renderWidth / imgRatio;

    // Si la altura calculada excede levemente la página A4, ajustamos por altura para que entre exactamente en 1 página
    if (renderHeight > maxContentHeight) {
      renderHeight = maxContentHeight;
      renderWidth = renderHeight * imgRatio;
    }

    const posX = marginX + (maxContentWidth - renderWidth) / 2;
    const posY = marginY + (maxContentHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');

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
