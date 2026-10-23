import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Player } from '../types/football';
import { sanitizeClonedDocColors } from './pdfColorSanitizer';

export interface PlayerFichaExportOptions {
  player: Player;
  clubName?: string;
  category?: string;
}

export interface PlayerDatabaseExportOptions {
  category: string;
  clubName?: string;
  coachName?: string;
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
 * con renderizado nítido a 2x escala, colores exactos y división natural por páginas.
 */
export async function exportPlayerFichaToPdf(
  element: HTMLElement,
  options: PlayerFichaExportOptions
): Promise<boolean> {
  try {
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

    const page1El = element.querySelector('#ficha-page-1') as HTMLElement | null;
    const page2El = element.querySelector('#ficha-page-2') as HTMLElement | null;

    if (page1El && page2El) {
      // 1. Renderizar Página 1 (Perfil, Biometría, Atributos y Temporada)
      const canvas1 = await html2canvas(page1El, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200,
        windowHeight: 1600,
        onclone: (clonedDoc) => {
          sanitizeClonedDocColors(clonedDoc, page1El);
          if (clonedDoc.body) {
            clonedDoc.body.style.width = '1200px';
            clonedDoc.body.style.backgroundColor = '#ffffff';
          }
        },
      });

      const imgRatio1 = canvas1.width / canvas1.height;
      let renderWidth1 = maxContentWidth;
      let renderHeight1 = renderWidth1 / imgRatio1;
      if (renderHeight1 > maxContentHeight) {
        renderHeight1 = maxContentHeight;
        renderWidth1 = renderHeight1 * imgRatio1;
      }
      const posX1 = marginX + (maxContentWidth - renderWidth1) / 2;
      const posY1 = marginY;
      pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', posX1, posY1, renderWidth1, renderHeight1, undefined, 'FAST');

      // 2. Renderizar Página 2 (Historial Médico, Nutrición, Observaciones y Firmas)
      const canvas2 = await html2canvas(page2El, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200,
        windowHeight: 1600,
        onclone: (clonedDoc) => {
          sanitizeClonedDocColors(clonedDoc, page2El);
          if (clonedDoc.body) {
            clonedDoc.body.style.width = '1200px';
            clonedDoc.body.style.backgroundColor = '#ffffff';
          }
        },
      });

      pdf.addPage();
      const imgRatio2 = canvas2.width / canvas2.height;
      let renderWidth2 = maxContentWidth;
      let renderHeight2 = renderWidth2 / imgRatio2;
      if (renderHeight2 > maxContentHeight) {
        renderHeight2 = maxContentHeight;
        renderWidth2 = renderHeight2 * imgRatio2;
      }
      const posX2 = marginX + (maxContentWidth - renderWidth2) / 2;
      const posY2 = marginY;
      pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', posX2, posY2, renderWidth2, renderHeight2, undefined, 'FAST');
    } else {
      // Fallback: renderizado directo con Desktop Viewport forzado
      const elWidth = Math.max(element.scrollWidth, element.offsetWidth, 850);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1280,
        windowHeight: 1800,
        onclone: (clonedDoc) => {
          sanitizeClonedDocColors(clonedDoc, element);
          if (clonedDoc.body) {
            clonedDoc.body.style.width = '1280px';
            clonedDoc.body.style.backgroundColor = '#ffffff';
          }
        },
      });

      const canvasPageHeight = Math.floor(canvas.width * (maxContentHeight / maxContentWidth));

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
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
      } else {
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
            sliceCtx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
            const sliceData = sliceCanvas.toDataURL('image/png');
            const sliceRenderHeight = (srcH * maxContentWidth) / canvas.width;
            pdf.addImage(sliceData, 'PNG', marginX, marginY, maxContentWidth, sliceRenderHeight, undefined, 'FAST');
          }
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

/**
 * Genera el documento PDF oficial de la Base de Datos / Plantilla completa
 * para una categoría seleccionada de San Luis de Quillota.
 */
export function exportPlayerDatabaseToPdf(
  players: Player[],
  options: PlayerDatabaseExportOptions
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 10;
  const categoryLabel = options.category === 'all' || options.category === 'Todas'
    ? 'Todas las Categorías Canarios'
    : `Categoría ${options.category}`;
  const clubName = options.clubName || 'SAN LUIS DE QUILLOTA S.A.D.P.';

  const sortedPlayers = [...players].sort((a, b) => a.squadNumber - b.squadNumber);
  const totalCount = sortedPlayers.length;
  const availableCount = sortedPlayers.filter((p) => p.status === 'Disponible').length;
  const injuredCount = sortedPlayers.filter((p) => p.status === 'Lesionado').length;
  const suspendedCount = sortedPlayers.filter((p) => p.status === 'Sancionado').length;

  const rowsPerPage = 14;
  const totalPages = Math.ceil(totalCount / rowsPerPage) || 1;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();

    // 1. Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 26, 'F');

    // Accent line
    doc.setFillColor(250, 204, 21); // amber-400
    doc.rect(0, 25, pageWidth, 1.5, 'F');

    // Club Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(clubName, marginX, 9);

    // Subtitle
    doc.setTextColor(250, 204, 21);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('FÚTBOL FORMATIVO Y JOVEN • BASE DE DATOS Y PLANTILLA OFICIAL', marginX, 15);

    // Category / Stats summary
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${categoryLabel.toUpperCase()} • Total: ${totalCount} jugadores | Aptos: ${availableCount} | Lesionados: ${injuredCount} | Sancionados: ${suspendedCount}`,
      marginX,
      21
    );

    // Right-side page counter
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Página ${page + 1} de ${totalPages} • Generado: ${new Date().toLocaleDateString('es-CL')}`,
      pageWidth - marginX,
      15,
      { align: 'right' }
    );

    // 2. Table Headers
    const startY = 32;
    doc.setFillColor(254, 240, 138); // yellow-200
    doc.rect(marginX, startY, pageWidth - marginX * 2, 7.5, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(marginX, startY, pageWidth - marginX * 2, 7.5, 'S');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    const cols = [
      { header: '#', x: marginX + 2, width: 8, align: 'center' as const },
      { header: 'JUGADOR / APELLIDOS, NOMBRES', x: marginX + 10, width: 52, align: 'left' as const },
      { header: 'RUT / DNI', x: marginX + 62, width: 22, align: 'left' as const },
      { header: 'POS.', x: marginX + 84, width: 12, align: 'center' as const },
      { header: 'CATEGORÍA', x: marginX + 96, width: 20, align: 'center' as const },
      { header: 'F. NAC. (EDAD)', x: marginX + 116, width: 26, align: 'center' as const },
      { header: 'ESTADO', x: marginX + 142, width: 24, align: 'center' as const },
      { header: 'NUTRICIÓN / % GRASA', x: marginX + 166, width: 34, align: 'center' as const },
      { header: 'PJ (TIT)', x: marginX + 200, width: 16, align: 'center' as const },
      { header: 'MIN.', x: marginX + 216, width: 14, align: 'center' as const },
      { header: 'GOLES', x: marginX + 230, width: 14, align: 'center' as const },
      { header: 'TA / TR', x: marginX + 244, width: 16, align: 'center' as const },
      { header: 'NOTA', x: marginX + 260, width: 17, align: 'center' as const },
    ];

    cols.forEach((col) => {
      const posX = col.align === 'center' ? col.x + col.width / 2 : col.x;
      doc.text(col.header, posX, startY + 5.2, { align: col.align });
    });

    // 3. Table Rows
    const pageRows = sortedPlayers.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    let rowY = startY + 7.5;
    const rowHeight = 9;

    pageRows.forEach((player, idx) => {
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(marginX, rowY, pageWidth - marginX * 2, rowHeight, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.15);
      doc.rect(marginX, rowY, pageWidth - marginX * 2, rowHeight, 'S');

      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      // Dorsal
      doc.setFont('helvetica', 'bold');
      doc.text(`#${player.squadNumber}`, cols[0].x + cols[0].width / 2, rowY + 5.5, { align: 'center' });

      // Player Name
      doc.setFont('helvetica', 'bold');
      const fullName = `${player.lastName}, ${player.firstName}`;
      doc.text(fullName.slice(0, 28), cols[1].x + 1, rowY + 5.5);

      // RUT/DNI
      doc.setFont('helvetica', 'normal');
      doc.text(player.idCard || '-', cols[2].x, rowY + 5.5);

      // Pos
      doc.setFont('helvetica', 'bold');
      doc.text(player.primaryPosition, cols[3].x + cols[3].width / 2, rowY + 5.5, { align: 'center' });

      // Categ
      doc.setFont('helvetica', 'normal');
      doc.text(player.category, cols[4].x + cols[4].width / 2, rowY + 5.5, { align: 'center' });

      // Birthdate & Age
      const age = calculatePlayerAge(player.birthDate);
      doc.text(`${player.birthDate || '-'} (${age}a)`, cols[5].x + cols[5].width / 2, rowY + 5.5, { align: 'center' });

      // Status with color
      if (player.status === 'Disponible') {
        doc.setTextColor(21, 128, 61); // emerald-700
      } else if (player.status === 'Lesionado') {
        doc.setTextColor(185, 28, 28); // rose-700
      } else {
        doc.setTextColor(180, 83, 9); // amber-700
      }
      doc.setFont('helvetica', 'bold');
      doc.text(player.status, cols[6].x + cols[6].width / 2, rowY + 5.5, { align: 'center' });
      doc.setTextColor(15, 23, 42);

      // Nutrition
      doc.setFont('helvetica', 'normal');
      if (player.currentNutrition) {
        const cn = player.currentNutrition;
        const fatStr = cn.bodyFatPercent !== undefined ? `${cn.bodyFatPercent}%` : cn.statusClassification;
        doc.text(fatStr, cols[7].x + cols[7].width / 2, rowY + 5.5, { align: 'center' });
      } else {
        doc.text('-', cols[7].x + cols[7].width / 2, rowY + 5.5, { align: 'center' });
      }

      // Stats
      doc.text(`${player.stats.matchesPlayed} (${player.stats.starts})`, cols[8].x + cols[8].width / 2, rowY + 5.5, { align: 'center' });
      doc.text(`${player.stats.minutesPlayed}'`, cols[9].x + cols[9].width / 2, rowY + 5.5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(String(player.stats.goals), cols[10].x + cols[10].width / 2, rowY + 5.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text(`${player.stats.yellowCards} / ${player.stats.redCards}`, cols[11].x + cols[11].width / 2, rowY + 5.5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(player.stats.avgRating > 0 ? player.stats.avgRating.toFixed(1) : '-', cols[12].x + cols[12].width / 2, rowY + 5.5, { align: 'center' });

      rowY += rowHeight;
    });

    // 4. Signatures / Institutional Footer on last page
    if (page === totalPages - 1) {
      const sigY = Math.max(rowY + 12, pageHeight - 32);
      const colWidth = (pageWidth - marginX * 2) / 3;

      const signatures = [
        {
          role: 'DIRECTOR TÉCNICO',
          name: options.coachName || 'Director Técnico',
          sub: options.category && options.category !== 'all' ? `Cuerpo Técnico ${options.category}` : 'San Luis de Quillota S.A.D.P.',
        },
        {
          role: 'JEFE TÉCNICO',
          name: 'Fernando Guajardo',
          sub: 'Jefatura Fútbol Formativo',
        },
        {
          role: 'COORDINADORA',
          name: 'Maite González',
          sub: 'Coordinación Cantera',
        },
      ];

      signatures.forEach((sig, i) => {
        const startX = marginX + i * colWidth + 10;
        const endX = startX + colWidth - 20;
        doc.setDrawColor(100, 116, 139);
        doc.setLineWidth(0.3);
        doc.line(startX, sigY, endX, sigY);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(sig.role, (startX + endX) / 2, sigY + 3.5, { align: 'center' });

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(sig.name.toUpperCase(), (startX + endX) / 2, sigY + 7, { align: 'center' });

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(sig.sub, (startX + endX) / 2, sigY + 10, { align: 'center' });
      });
    }
  }

  const cleanCat = options.category.replace(/\s+/g, '_');
  const filename = `Plantilla_Oficial_SanLuis_${cleanCat}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
