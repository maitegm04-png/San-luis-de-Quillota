import jsPDF from 'jspdf';
import { Player } from '../types/football';

/**
 * Generates an official San Luis de Quillota nutritional evaluation PDF
 * that can be downloaded or directly loaded into the PDF parser.
 */
export function generateSampleNutritionPdf(
  player: Player,
  evaluationType: 'optimo' | 'alerta' | 'atencion' = 'optimo',
  date = '2026-03-15',
  periodName = 'Control Antropométrico N° 2 - Marzo'
): { doc: jsPDF; fileName: string; blob: Blob; file: File } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isOptimo = evaluationType === 'optimo';
  const isAlerta = evaluationType === 'alerta';

  const weight = isOptimo ? player.weightKg || 68.5 : isAlerta ? (player.weightKg || 70) + 2.5 : (player.weightKg || 70) + 5.2;
  const height = player.heightCm || 176;
  const heightM = height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);
  const fatPercent = isOptimo ? 10.4 : isAlerta ? 13.8 : 16.5;
  const musclePercent = isOptimo ? 49.2 : isAlerta ? 46.5 : 43.8;
  const muscleKg = ((musclePercent / 100) * weight).toFixed(1);
  const skinfolds = isOptimo ? 43.5 : isAlerta ? 58.2 : 74.0;
  const hydration = isOptimo ? 63 : isAlerta ? 58 : 54;
  const visceral = isOptimo ? 3 : isAlerta ? 5 : 7;

  // Header Colors & Logo Area
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, 'F');

  doc.setFillColor(250, 204, 21); // amber-400
  doc.rect(0, 36, 210, 2, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SAN LUIS DE QUILLOTA S.A.D.P.', 14, 15);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(250, 204, 21);
  doc.text('DEPARTAMENTO DE NUTRICIÓN Y RENDIMIENTO DEPORTIVO', 14, 22);

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('Informe Antropométrico y Composición Corporal ISAK II', 14, 29);

  // Document Info block
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Fecha de Evaluación: ${date}`, 14, 48);
  doc.text(`Período / Protocolo: ${periodName}`, 14, 54);

  // Box: Player Info
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 60, 182, 34, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('1. ANTECEDENTES DEL JUGADOR', 18, 68);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Futbolista / Jugador: ${player.firstName} ${player.lastName}`, 18, 76);
  doc.text(`Dorsal / Camiseta: #${player.squadNumber}`, 18, 82);
  doc.text(`Posición de Juego: ${player.primaryPosition}`, 18, 88);

  doc.text(`Categoría Formativa: ${player.category}`, 110, 76);
  doc.text(`Ficha / Cédula / RUT: ${player.idCard || '7.892.114-K'}`, 110, 82);
  doc.text(`Fecha Nacimiento / Edad: ${player.birthDate || '2008-05-12'}`, 110, 88);

  // Box: Anthropometry Results
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 100, 182, 65, 3, 3, 'D');

  // Header band
  doc.setFillColor(isOptimo ? 16 : isAlerta ? 217 : 225, isOptimo ? 185 : isAlerta ? 119 : 29, isOptimo ? 129 : isAlerta ? 6 : 72);
  doc.roundedRect(14, 100, 182, 10, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. MEDICIONES ANTROPOMÉTRICAS Y COMPOSICIÓN CORPORAL', 18, 107);

  // Table rows
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const rows = [
    ['Peso Corporal:', `${weight.toFixed(1)} kg`, 'Estatura / Talla:', `${height} cm`],
    ['Índice de Masa Corporal (IMC):', `${bmi} kg/m²`, 'Hidratación Corporal:', `${hydration}%`],
    ['% Masa Grasa (Adiposo):', `${fatPercent.toFixed(1)}%`, 'Sumatoria 6 Pliegues:', `${skinfolds.toFixed(1)} mm`],
    ['% Masa Muscular:', `${musclePercent.toFixed(1)}%`, 'Masa Muscular Estimada:', `${muscleKg} kg`],
    ['Nivel Grasa Visceral:', `${visceral}`, 'Estado Nutricional General:', isOptimo ? 'Óptimo (Verde)' : isAlerta ? 'En Alerta / Seguimiento (Amarillo)' : 'Atención Requerida (Rojo)']
  ];

  let y = 118;
  rows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y - 4, 180, 7, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.text(r[0], 18, y);
    doc.setFont('helvetica', 'normal');
    doc.text(r[1], 80, y);

    doc.setFont('helvetica', 'bold');
    doc.text(r[2], 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(r[3], 162, y);
    y += 8;
  });

  // Box: Diagnosis & Observations
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 172, 182, 40, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. DIAGNÓSTICO NUTRICIONAL Y OBSERVACIONES', 18, 180);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const diagText = isOptimo
    ? `Diagnóstico: El futbolista se encuentra en estado ÓPTIMO. Presenta un % Grasa (${fatPercent}%) dentro del rango objetivo para el fútbol competitivo de alto rendimiento. Buena masa muscular (${musclePercent}%) y adecuada hidratación.`
    : isAlerta
    ? `Diagnóstico: El futbolista se encuentra en estado ACEPTABLE / EN SEGUIMIENTO. Presenta un % Grasa (${fatPercent}%) ligeramente superior a la media ideal de la posición. Requiere afinamiento calórico.`
    : `Diagnóstico: El futbolista requiere ATENCIÓN NUTRICIONAL PRIORITARIA. Presenta un % Grasa (${fatPercent}%) elevado (>15%) y sumatoria de pliegues de ${skinfolds} mm. Se establece plan de recomposición corporal con seguimiento quincenal.`;

  const splitDiag = doc.splitTextToSize(diagText, 174);
  doc.text(splitDiag, 18, 188);

  // Box: Recommendations
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 218, 182, 38, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('4. PAUTA Y RECOMENDACIONES DIETÉTICAS', 18, 226);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const recText = isOptimo
    ? 'Recomendaciones: Mantener consumo regular de proteínas de alto valor biológico (1.8g/kg). Hidratación de 500ml pre-entreno con electrolitos. Carbohidratos complejos post-sesión para reposición de glucógeno.'
    : isAlerta
    ? 'Recomendaciones: Reducir porciones de carbohidratos refinados en cenas nocturnas. Incrementar ingesta de fibra y verduras crudas. Control antropométrico programado en 3 semanas.'
    : 'Recomendaciones: Plan de déficit controlado de 350 kcal/día sin comprometer la masa muscular. Cero bebidas azucaradas ni frituras. Re-evaluación en 15 días con medición de pliegues cutáneos.';

  const splitRec = doc.splitTextToSize(recText, 174);
  doc.text(splitRec, 18, 234);

  // Signatures
  doc.setDrawColor(148, 163, 184);
  doc.line(25, 275, 85, 275);
  doc.line(125, 275, 185, 275);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Lic. Camila Valenzuela R.', 32, 280);
  doc.text('Nutricionista Deportiva San Luis', 28, 284);

  doc.text('Cuerpo Técnico / Preparador Físico', 130, 280);
  doc.text('San Luis de Quillota', 143, 284);

  const fileName = `Evaluacion_Nutricional_${player.lastName}_${player.firstName}_${date}.pdf`.replace(/\s+/g, '_');
  const blob = doc.output('blob');
  const file = new File([blob], fileName, { type: 'application/pdf' });

  return { doc, fileName, blob, file };
}
