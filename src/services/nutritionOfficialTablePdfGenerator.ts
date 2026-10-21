import jsPDF from 'jspdf';
import { NutritionTrafficLight, NutritionStatusType } from '../types/football';

export interface AnthropometryPdfRow {
  rowNumber: number;
  playerName: string;
  squadNumber?: number;
  age?: number;
  heightCm: number;
  weightKg: number;
  bodyFatPercent?: number;
  bodyFatKg?: number;
  muscleMassPercent?: number;
  muscleMassKg?: number;
  skinfoldSumMm?: number;
  imo?: number;
  trafficLight: NutritionTrafficLight;
  statusClassification: NutritionStatusType;
  evaluationDate: string;
}

export interface AnthropometryPdfOptions {
  category: string;
  dateFilter: string;
  nutritionistName?: string;
  clubName?: string;
}

/**
 * Generates an official, beautifully formatted landscape PDF report
 * containing the official anthropometric table (5 components) with all uploaded evaluations.
 */
export function generateOfficialAnthropometryPdf(
  rows: AnthropometryPdfRow[],
  options: AnthropometryPdfOptions
): { doc: jsPDF; fileName: string; download: () => void } {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 10;
  const nutritionist = options.nutritionistName || 'Nta. Cristian Fuentes Toledo';
  const clubName = options.clubName || 'SAN LUIS DE QUILLOTA S.A.D.P.';
  const categoryLabel = options.category === 'all' || options.category === 'Todas' 
    ? 'Todas las Categorías' 
    : `Categoría ${options.category}`;
  const dateLabel = options.dateFilter === 'all' ? 'Todas las Fechas Registradas' : options.dateFilter;

  // Compute summary stats
  const totalCount = rows.length;
  const avgFat = totalCount > 0 
    ? (rows.reduce((acc, r) => acc + (r.bodyFatPercent || 0), 0) / totalCount).toFixed(1)
    : '0.0';
  const avgMuscle = totalCount > 0
    ? (rows.reduce((acc, r) => acc + (r.muscleMassPercent || 0), 0) / totalCount).toFixed(1)
    : '0.0';
  const avgImo = totalCount > 0
    ? (rows.reduce((acc, r) => acc + (r.imo || 0), 0) / totalCount).toFixed(2)
    : '0.00';
  const greenCount = rows.filter((r) => r.trafficLight === 'green').length;
  const yellowCount = rows.filter((r) => r.trafficLight === 'yellow').length;
  const redCount = rows.filter((r) => r.trafficLight === 'red').length;

  const renderHeader = (pageNum: number, totalPagesPlaceholder: boolean) => {
    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Accent line
    doc.setFillColor(250, 204, 21); // amber-400
    doc.rect(0, 27, pageWidth, 1.5, 'F');

    // Club Brand Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(clubName, marginX, 10);

    // Subtitle
    doc.setTextColor(250, 204, 21);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DEPARTAMENTO DE NUTRICIÓN Y RENDIMIENTO DEPORTIVO • FÚTBOL FORMATIVO', marginX, 16);

    // Report Title
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME ANTROPOMÉTRICO OFICIAL (5 COMPONENTES)', marginX, 23);

    // Right-aligned header metadata
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Fecha Informe: ${dateLabel}`, pageWidth - marginX, 10, { align: 'right' });
    doc.text(`${categoryLabel}`, pageWidth - marginX, 16, { align: 'right' });
    doc.setTextColor(250, 204, 21);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Evaluaciones: ${totalCount} jugadores`, pageWidth - marginX, 23, { align: 'right' });
  };

  const renderSummaryBar = (yPos: number) => {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(marginX, yPos, pageWidth - marginX * 2, 10, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Resumen Antropométrico Plantel:`, marginX + 4, yPos + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Promedio % Adiposo:`, marginX + 55, yPos + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${avgFat}%`, marginX + 83, yPos + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Promedio % Muscular:`, marginX + 100, yPos + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${avgMuscle}%`, marginX + 130, yPos + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Promedio IMO:`, marginX + 148, yPos + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${avgImo}`, marginX + 170, yPos + 6.5);

    // Distribution pills
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129); // green
    doc.text(`● Óptimo: ${greenCount}`, marginX + 195, yPos + 6.5);
    doc.setTextColor(217, 119, 6); // amber
    doc.text(`● Seguimiento: ${yellowCount}`, marginX + 222, yPos + 6.5);
    doc.setTextColor(225, 29, 72); // rose
    doc.text(`● Atención: ${redCount}`, marginX + 252, yPos + 6.5);
  };

  // Column layout definitions (Total width: 277mm)
  const columns = [
    { title: '#', width: 9, align: 'center' as const },
    { title: 'Nombre Paciente', width: 56, align: 'left' as const },
    { title: 'Edad', width: 13, align: 'center' as const },
    { title: 'Talla (cm)', width: 17, align: 'center' as const },
    { title: 'Peso (kg)', width: 17, align: 'center' as const },
    { title: 'M. Adiposa %', width: 22, align: 'center' as const },
    { title: 'M. Adiposa kg', width: 22, align: 'center' as const },
    { title: 'M. Muscular %', width: 23, align: 'center' as const },
    { title: 'M. Muscular kg', width: 23, align: 'center' as const },
    { title: '6 Pliegues (mm)', width: 23, align: 'center' as const },
    { title: 'IMO', width: 18, align: 'center' as const },
    { title: 'Semáforo / Estado', width: 34, align: 'center' as const },
  ];

  const renderTableHeader = (yPos: number) => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(marginX, yPos, pageWidth - marginX * 2, 7.5, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);

    let curX = marginX;
    columns.forEach((col) => {
      const textX = col.align === 'center' ? curX + col.width / 2 : curX + 2;
      doc.text(col.title, textX, yPos + 5, { align: col.align });
      curX += col.width;
    });
  };

  const renderFooter = (currentPage: number) => {
    const footerY = pageHeight - 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, footerY - 2, pageWidth - marginX, footerY - 2);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('San Luis de Quillota S.A.D.P. • Protocolo Antropométrico ISAK II • Proyección 2026', marginX, footerY + 2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Responsable: ${nutritionist}`, pageWidth / 2, footerY + 2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Página ${currentPage}`, pageWidth - marginX, footerY + 2, { align: 'right' });
  };

  // Render first page
  let currentPage = 1;
  renderHeader(currentPage, true);
  renderSummaryBar(31);
  let tableStartY = 43;
  renderTableHeader(tableStartY);

  let curY = tableStartY + 7.5;
  const rowHeight = 6.2;
  const maxY = pageHeight - 16;

  if (rows.length === 0) {
    // Empty state in PDF
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('No hay evaluaciones antropométricas registradas para el filtro seleccionado.', pageWidth / 2, curY + 20, { align: 'center' });
  } else {
    rows.forEach((row, idx) => {
      // Check if page overflow
      if (curY + rowHeight > maxY) {
        renderFooter(currentPage);
        doc.addPage();
        currentPage += 1;
        renderHeader(currentPage, true);
        tableStartY = 31;
        renderTableHeader(tableStartY);
        curY = tableStartY + 7.5;
      }

      // Alternate row backgrounds
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, curY, pageWidth - marginX * 2, rowHeight, 'F');
      }

      // Draw subtle bottom row line
      doc.setDrawColor(241, 245, 249);
      doc.line(marginX, curY + rowHeight, pageWidth - marginX, curY + rowHeight);

      let curX = marginX;

      // Col 1: #
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(String(row.rowNumber), curX + columns[0].width / 2, curY + 4.3, { align: 'center' });
      curX += columns[0].width;

      // Col 2: Nombre
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const displayName = row.squadNumber ? `${row.playerName} (#${row.squadNumber})` : row.playerName;
      doc.text(displayName, curX + 2, curY + 4.3);
      curX += columns[1].width;

      // Col 3: Edad
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(row.age ? String(row.age) : '-', curX + columns[2].width / 2, curY + 4.3, { align: 'center' });
      curX += columns[2].width;

      // Col 4: Talla
      doc.text(`${row.heightCm}`, curX + columns[3].width / 2, curY + 4.3, { align: 'center' });
      curX += columns[3].width;

      // Col 5: Peso
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`${row.weightKg}`, curX + columns[4].width / 2, curY + 4.3, { align: 'center' });
      curX += columns[4].width;

      // Col 6: M. Adiposa %
      const fatPct = row.bodyFatPercent !== undefined ? `${row.bodyFatPercent}%` : '-';
      if (row.bodyFatPercent && row.bodyFatPercent <= 17.0) {
        doc.setTextColor(16, 185, 129); // green
      } else if (row.bodyFatPercent && row.bodyFatPercent <= 19.0) {
        doc.setTextColor(217, 119, 6); // amber
      } else {
        doc.setTextColor(225, 29, 72); // rose
      }
      doc.setFont('helvetica', 'bold');
      doc.text(fatPct, curX + columns[5].width / 2, curY + 4.3, { align: 'center' });
      curX += columns[5].width;

      // Col 7: M. Adiposa kg
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(row.bodyFatKg !== undefined ? `${row.bodyFatKg}` : '-', curX + columns[6].width / 2, curY + 4.3, { align: 'center' });
      curX += columns[6].width;

      // Col 8: M. Muscular %
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235); // blue
      doc.text(row.muscleMassPercent !== undefined ? `${row.muscleMassPercent}%` : '-', curX + columns[7].width / 2, curY + 4.3, { align: 'center' });
      curX += columns[7].width;

      // Col 9: M. Muscular kg
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(row.muscleMassKg !== undefined ? `${row.muscleMassKg}` : '-', curX + columns[8].width / 2, curY + 4.3, { align: 'center' });
      curX += columns[8].width;

      // Col 10: 6 Pliegues mm
      doc.setFont('helvetica', 'bold');
      if (row.skinfoldSumMm && row.skinfoldSumMm <= 36.0) {
        doc.setTextColor(16, 185, 129);
      } else if (row.skinfoldSumMm && row.skinfoldSumMm <= 48.0) {
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(225, 29, 72);
      }
      doc.text(row.skinfoldSumMm ? `${row.skinfoldSumMm}` : '-', curX + columns[9].width / 2, curY + 4.3, { align: 'center' });
      curX += columns[9].width;

      // Col 11: IMO
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text(row.imo !== undefined ? row.imo.toFixed(2) : '-', curX + columns[10].width / 2, curY + 4.3, { align: 'center' });
      curX += columns[10].width;

      // Col 12: Semáforo / Estado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      if (row.trafficLight === 'green') {
        doc.setTextColor(16, 185, 129);
        doc.text('● ÓPTIMO', curX + columns[11].width / 2, curY + 4.3, { align: 'center' });
      } else if (row.trafficLight === 'yellow') {
        doc.setTextColor(217, 119, 6);
        doc.text('● SEGUIMIENTO', curX + columns[11].width / 2, curY + 4.3, { align: 'center' });
      } else {
        doc.setTextColor(225, 29, 72);
        doc.text('● ATENCIÓN', curX + columns[11].width / 2, curY + 4.3, { align: 'center' });
      }

      curY += rowHeight;
    });
  }

  // Render footer on the last page
  renderFooter(currentPage);

  const cleanCategory = options.category.replace(/\s+/g, '_');
  const cleanDate = options.dateFilter === 'all' ? 'Completo' : options.dateFilter;
  const fileName = `Informe_Antropometrico_SLQ_${cleanCategory}_${cleanDate}.pdf`;

  return {
    doc,
    fileName,
    download: () => {
      doc.save(fileName);
    },
  };
}
