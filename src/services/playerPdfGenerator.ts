import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Player } from '../types/football';
import { POSITION_LABELS } from '../data/mockData';
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
 * utilizando renderizado nítido a 2x de escala.
 */
export async function exportPlayerFichaToPdf(
  element: HTMLElement,
  options: PlayerFichaExportOptions
): Promise<boolean> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x escala para garantizar máxima nitidez de texto y foto
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 900,
      onclone: (clonedDoc) => {
        sanitizeClonedDocColors(clonedDoc);
      }
    });

    const imgData = canvas.toDataURL('image/png');

    // Formato vertical A4 estándar (210mm x 297mm) para fichas técnicas
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const margin = 10;
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
        heightLeft -= pdfHeight;
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
