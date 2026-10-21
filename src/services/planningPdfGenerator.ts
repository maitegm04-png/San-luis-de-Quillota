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
 * Formato apaisado A4 (Landscape) nítido, con colores oficiales y preservando todo el texto ingresado.
 */
export async function exportPlanningToPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<boolean> {
  try {
    const elWidth = Math.max(element.scrollWidth, element.offsetWidth, 1200);
    const elHeight = element.scrollHeight || element.offsetHeight;

    const canvas = await html2canvas(element, {
      scale: 2, // 2x para nitidez cristalina en textos, esquemas e insignias
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: elWidth,
      height: elHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        // 1. Sanitizar colores y estilos computados
        sanitizeClonedDocColors(clonedDoc, element);

        const clonedArea = clonedDoc.getElementById('printable-planning-area');
        if (clonedArea) {
          clonedArea.style.width = `${elWidth}px`;
          clonedArea.style.minWidth = `${elWidth}px`;
          clonedArea.style.margin = '0';
          clonedArea.style.padding = '16px';
          clonedArea.style.backgroundColor = '#ffffff';
          clonedArea.style.overflow = 'visible';
        }

        // 2. Asegurar membrete oficial visible
        const header = clonedDoc.getElementById('planning-pdf-header');
        if (header) {
          header.style.display = 'flex';
          header.style.visibility = 'visible';
        }

        // 3. Reemplazar textareas con divs para renderizado íntegro
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
          div.style.border = '1px solid #cbd5e1';
          div.style.borderRadius = '4px';
          div.style.fontFamily = 'inherit';
          ta.parentNode?.replaceChild(div, ta);
        });

        // 4. Reemplazar selects con etiquetas legibles
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

        // 5. Reemplazar inputs de texto con divs limpios
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

    // Formato horizontal A4 (297mm x 210mm) ideal para microciclos de lunes a domingo
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const marginX = 8;
    const marginY = 8;
    const maxContentWidth = pdfWidth - marginX * 2;
    const maxContentHeight = pdfHeight - marginY * 2;

    const canvasPageHeight = Math.floor(canvas.width * (maxContentHeight / maxContentWidth));

    // Si entra en 1 página (tolerancia del 8% para acomodar microciclo)
    if (canvas.height <= canvasPageHeight * 1.08) {
      const imgRatio = canvas.width / canvas.height;
      let renderWidth = maxContentWidth;
      let renderHeight = renderWidth / imgRatio;

      if (renderHeight > maxContentHeight) {
        renderHeight = maxContentHeight;
        renderWidth = renderHeight * imgRatio;
      }

      const posX = marginX + (maxContentWidth - renderWidth) / 2;
      const posY = marginY;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
    } else {
      // Paginación limpia por rebanado
      const totalPages = Math.ceil(canvas.height / canvasPageHeight);

      for (let p = 0; p < totalPages; p++) {
        if (p > 0) pdf.addPage();

        const srcY = p * canvasPageHeight;
        const srcH = Math.min(canvasPageHeight, canvas.height - srcY);

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcH;
        const sliceCtx = sliceCanvas.getContext('2d');

        if (sliceCtx) {
          sliceCtx.fillStyle = '#ffffff';
          sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          sliceCtx.drawImage(
            canvas,
            0,
            srcY,
            canvas.width,
            srcH,
            0,
            0,
            canvas.width,
            srcH
          );

          const sliceData = sliceCanvas.toDataURL('image/png');
          const sliceRenderHeight = (srcH * maxContentWidth) / canvas.width;
          pdf.addImage(sliceData, 'PNG', marginX, marginY, maxContentWidth, sliceRenderHeight, undefined, 'FAST');
        }
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
