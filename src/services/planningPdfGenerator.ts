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
 * Transforms dynamic form controls (textarea, select, input) in clonedDoc into
 * crisp, static typography elements so html2canvas renders complete text without scrollbars or clipped contents.
 */
function prepareClonedPlanningDoc(clonedDoc: Document, targetEl: HTMLElement) {
  // 1. Sanitizar colores oklch de Tailwind v4
  sanitizeClonedDocColors(clonedDoc, targetEl);

  // 2. Expandir body y contenedor para vista desktop fija
  if (clonedDoc.body) {
    clonedDoc.body.style.width = '1440px';
    clonedDoc.body.style.minWidth = '1440px';
    clonedDoc.body.style.overflow = 'visible';
    clonedDoc.body.style.backgroundColor = '#ffffff';
  }

  // 3. Reemplazar textareas con divs limpios multilínea
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
    div.style.fontFamily = 'inherit';
    inp.parentNode?.replaceChild(div, inp);
  });
}

/**
 * Captura un bloque específico (cabecera oficial + tabla del área) y lo agrega
 * a una página Landscape A4 en el documento jsPDF.
 */
async function renderAreaToPdfPage(
  pdf: jsPDF,
  headerEl: HTMLElement,
  areaEl: HTMLElement,
  isFirstPage: boolean
): Promise<void> {
  // Crear un contenedor temporal fuera de pantalla que agrupa el membrete oficial y el área
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.top = '-9999px';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = '1280px';
  tempContainer.style.backgroundColor = '#ffffff';
  tempContainer.style.padding = '16px';
  tempContainer.style.boxSizing = 'border-box';

  const clonedHeader = headerEl.cloneNode(true) as HTMLElement;
  const clonedArea = areaEl.cloneNode(true) as HTMLElement;

  tempContainer.appendChild(clonedHeader);
  tempContainer.appendChild(clonedArea);
  document.body.appendChild(tempContainer);

  try {
    const canvas = await html2canvas(tempContainer, {
      scale: 2, // 2x escala para máxima nitidez en texto, bordes y escudo
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1440,
      windowHeight: 1100,
      onclone: (clonedDoc) => {
        prepareClonedPlanningDoc(clonedDoc, tempContainer);
      },
    });

    if (!isFirstPage) {
      pdf.addPage();
    }

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const marginX = 8;
    const marginY = 8;
    const maxContentWidth = pdfWidth - marginX * 2;
    const maxContentHeight = pdfHeight - marginY * 2;

    const imgRatio = canvas.width / canvas.height;
    let renderWidth = maxContentWidth;
    let renderHeight = renderWidth / imgRatio;

    if (renderHeight > maxContentHeight) {
      renderHeight = maxContentHeight;
      renderWidth = renderHeight * imgRatio;
    }

    const posX = marginX + (maxContentWidth - renderWidth) / 2;
    const posY = marginY + (maxContentHeight - renderHeight) / 2;

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
  } finally {
    document.body.removeChild(tempContainer);
  }
}

/**
 * Genera y descarga un archivo PDF de alta resolución con la planificación semanal de San Luis de Quillota.
 * Formato apaisado A4 (Landscape) nítido, con colores oficiales y preservando todo el texto ingresado.
 * Si se exporta el microciclo completo, cada área (Técnica, Física, Arqueros) se ubica en su propia página A4 independiente,
 * evitando cualquier corte accidental de filas o textos.
 */
export async function exportPlanningToPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<boolean> {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const header = element.querySelector('#planning-pdf-header') as HTMLElement | null;
    const areaTecnica = element.querySelector('#planning-area-tecnica') as HTMLElement | null;
    const areaFisica = element.querySelector('#planning-area-fisica') as HTMLElement | null;
    const areaArqueros = element.querySelector('#planning-area-arqueros') as HTMLElement | null;

    // Si existen áreas individuales reconocidas, renderizar cada una en su propia página A4
    const availableAreas: { id: string; el: HTMLElement }[] = [];
    if (areaTecnica) availableAreas.push({ id: 'tecnica', el: areaTecnica });
    if (areaFisica) availableAreas.push({ id: 'fisica', el: areaFisica });
    if (areaArqueros) availableAreas.push({ id: 'arqueros', el: areaArqueros });

    if (header && availableAreas.length > 0) {
      for (let i = 0; i < availableAreas.length; i++) {
        await renderAreaToPdfPage(pdf, header, availableAreas[i].el, i === 0);
      }
    } else {
      // Fallback: renderizado directo del elemento completo con escala 2x y vista desktop
      const elWidth = Math.max(element.scrollWidth, element.offsetWidth, 1280);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1440,
        windowHeight: 1100,
        onclone: (clonedDoc) => {
          prepareClonedPlanningDoc(clonedDoc, element);
          const clonedArea = clonedDoc.getElementById('printable-planning-area');
          if (clonedArea) {
            clonedArea.style.width = `${elWidth}px`;
            clonedArea.style.minWidth = `${elWidth}px`;
            clonedArea.style.margin = '0';
            clonedArea.style.padding = '16px';
            clonedArea.style.backgroundColor = '#ffffff';
            clonedArea.style.overflow = 'visible';
          }
        },
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

      if (renderHeight > maxContentHeight) {
        renderHeight = maxContentHeight;
        renderWidth = renderHeight * imgRatio;
      }

      const posX = marginX + (maxContentWidth - renderWidth) / 2;
      const posY = marginY;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
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
