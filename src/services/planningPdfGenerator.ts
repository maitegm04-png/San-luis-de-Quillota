import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { sanitizeClonedDocColors } from './pdfColorSanitizer';

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
    const canvas = await html2canvas(element, {
      scale: 2, // 2x para nitidez de texto e imágenes
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1350,
      onclone: (clonedDoc) => {
        // Sanitizar colores modernos (oklch, oklab) para compatibilidad total
        sanitizeClonedDocColors(clonedDoc);

        // Asegurar que el membrete oficial del club sea visible en el PDF
        const header = clonedDoc.getElementById('planning-pdf-header');
        if (header) {
          header.style.display = 'flex';
          header.style.visibility = 'visible';
        }

        // Reemplazar textareas con divs para que se renderice TODO el texto escrito de forma limpia y completa
        const textareas = clonedDoc.querySelectorAll('textarea');
        textareas.forEach((ta) => {
          const div = clonedDoc.createElement('div');
          div.textContent = ta.value || '';
          div.style.whiteSpace = 'pre-wrap';
          div.style.wordBreak = 'break-word';
          div.style.fontSize = '10px';
          div.style.lineHeight = '1.35';
          div.style.padding = '4px 6px';
          div.style.minHeight = '32px';
          div.style.color = '#0f172a';
          div.style.backgroundColor = '#f8fafc';
          div.style.border = '1px solid #e2e8f0';
          div.style.borderRadius = '4px';
          div.style.fontFamily = 'inherit';
          ta.parentNode?.replaceChild(div, ta);
        });

        // Reemplazar selects con etiquetas legibles completas
        const selects = clonedDoc.querySelectorAll('select');
        selects.forEach((sel) => {
          const selectedText = sel.options[sel.selectedIndex]?.text || sel.value || '';
          const div = clonedDoc.createElement('div');
          div.textContent = selectedText === '- Seleccionar Estructura -' ? '' : selectedText;
          div.style.fontSize = '10px';
          div.style.fontWeight = '700';
          div.style.color = '#0f172a';
          div.style.padding = '2px 5px';
          div.style.backgroundColor = '#fef08a';
          div.style.border = '1px solid #cbd5e1';
          div.style.borderRadius = '4px';
          div.style.marginBottom = '3px';
          div.style.fontFamily = 'inherit';
          sel.parentNode?.replaceChild(div, sel);
        });

        // Reemplazar inputs de texto con divs limpios
        const inputs = clonedDoc.querySelectorAll<HTMLInputElement>('input[type="text"]');
        inputs.forEach((inp) => {
          const div = clonedDoc.createElement('div');
          div.textContent = inp.value || '';
          div.style.fontSize = '11px';
          div.style.fontWeight = '800';
          div.style.color = '#0f172a';
          div.style.padding = '3px 5px';
          div.style.textAlign = inp.style.textAlign || 'left';
          inp.parentNode?.replaceChild(div, inp);
        });
      }
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
