import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  category: string;
  year: number;
  week: number;
  areaTitle?: string;
}

/**
 * Genera y descarga un archivo PDF de alta resolución con la planificación semanal de San Luis de Quillota.
 */
export async function exportPlanningToPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<boolean> {
  try {
    // Clona o ajusta estilos temporalmente para garantizar renderizado nítido
    const canvas = await html2canvas(element, {
      scale: 2, // 2x para nitidez de texto e imágenes
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1280,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Formato horizontal A4 (297mm x 210mm) ideal para planillas semanales de lunes a domingo
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Dimensiones proporcionales manteniendo márgenes de 8mm
    const margin = 8;
    const contentWidth = pdfWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    if (imgHeight <= pdfHeight - margin * 2) {
      // Entra en una sola página
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, imgHeight);
    } else {
      // Multi-página si es muy larga
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    const cleanCategory = options.category.replace(/\s+/g, '_');
    const filename = `Planificacion_SanLuis_${cleanCategory}_${options.year}_Semana${String(options.week).padStart(2, '0')}.pdf`;
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generando PDF de planificación:', error);
    return false;
  }
}
