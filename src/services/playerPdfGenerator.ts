import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Player } from '../types/football';
import { sanitizeClonedDocColors } from './pdfColorSanitizer';

export interface PlayerFichaExportOptions {
  player: Player;
  clubName?: string;
  category?: string;
}

/**
 * Calcula la edad a partir de la fecha de nacimiento (YYYY-MM-DD)
 */
export function calculatePlayerAge(birthDateString: string): number {
  if (!birthDateString) return 0;
  const birth = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calcula la media general ponderada de atributos del jugador
 */
export function calculatePlayerOverall(player: Player): number {
  const attr = player.attributes;
  if (!attr) return 70;
  if (player.primaryPosition === 'POR') {
    const gk = attr.goalkeeping || 75;
    return Math.round((gk * 0.5) + (attr.physical * 0.2) + (attr.passing * 0.15) + (attr.pace * 0.15));
  }
  return Math.round(
    (attr.pace + attr.shooting + attr.passing + attr.dribbling + attr.defending + attr.physical) / 6
  );
}

/**
 * Exporta la ficha completa del jugador a un documento PDF descargable
 * con renderizado nítido a 2x escala, colores exactos y paginación limpia.
 */
export async function exportPlayerFichaToPdf(
  element: HTMLElement,
  options: PlayerFichaExportOptions
): Promise<boolean> {
  try {
    const elWidth = element.offsetWidth || 820;
    const elHeight = element.offsetHeight || 1200;

    const canvas = await html2canvas(element, {
      scale: 2, // 2x escala para garantizar máxima nitidez de texto, foto y firmas
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: elWidth,
      height: elHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        sanitizeClonedDocColors(clonedDoc, element);

        const clonedFicha = clonedDoc.getElementById('printable-player-ficha');
        if (clonedFicha) {
          clonedFicha.style.width = `${elWidth}px`;
          clonedFicha.style.maxWidth = `${elWidth}px`;
          clonedFicha.style.margin = '0 auto';
          clonedFicha.style.boxSizing = 'border-box';
          clonedFicha.style.backgroundColor = '#ffffff';
        }
      }
    });

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

    const canvasPageHeight = Math.floor(canvas.width * (maxContentHeight / maxContentWidth));

    // Si entra en 1 página (o leve tolerancia de 5%), renderizar directamente
    if (canvas.height <= canvasPageHeight * 1.05) {
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
      // Paginación limpia mediante rebanado (slicing) del canvas por página A4
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

    const cleanName = `${options.player.firstName}_${options.player.lastName}`.replace(/\s+/g, '_');
    const filename = `Ficha_SanLuis_${cleanName}_Dorsal${options.player.squadNumber}.pdf`;
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generando PDF de ficha de jugador:', error);
    return false;
  }
}
