/**
 * Sanitizador de Colores Modernos (oklch, oklab, color()) para html2canvas / html2canvas-pro.
 * Tailwind v4 compila su paleta por defecto en oklch(...).
 * Esta utilidad convierte cualquier función oklch a rgb() o hex mediante el parser nativo de Canvas.
 */

let helperCtx: CanvasRenderingContext2D | null = null;

function getHelperContext(): CanvasRenderingContext2D | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  if (!helperCtx) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    helperCtx = canvas.getContext('2d');
  }
  return helperCtx;
}

export function safeCssColorToRgb(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  if (!colorStr.includes('oklch') && !colorStr.includes('oklab')) return colorStr;

  const ctx = getHelperContext();
  if (!ctx) return '#000000';

  try {
    ctx.fillStyle = '#000000';
    ctx.fillStyle = colorStr;
    return ctx.fillStyle || '#000000';
  } catch {
    return '#000000';
  }
}

/**
 * Sanitiza todas las hojas de estilo y elementos clonados en el DOM virtual
 * antes de que html2canvas los procese.
 */
export function sanitizeClonedDocColors(clonedDoc: Document): void {
  try {
    // 1. Sanitizar hojas de estilo embebidas que puedan contener oklch(...)
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach((tag) => {
      if (tag.textContent && tag.textContent.includes('oklch')) {
        tag.textContent = tag.textContent.replace(/oklch\([^)]+\)/gi, (match) => {
          return safeCssColorToRgb(match);
        });
      }
    });

    // 2. Sanitizar elementos y sus estilos computados / inline
    const allElements = clonedDoc.querySelectorAll('*');
    const colorProps = [
      'backgroundColor',
      'color',
      'borderColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'outlineColor',
      'fill',
      'stroke'
    ] as const;

    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style) {
        colorProps.forEach((prop) => {
          const val = htmlEl.style[prop as any];
          if (val && typeof val === 'string' && val.includes('oklch')) {
            htmlEl.style[prop as any] = safeCssColorToRgb(val);
          }
        });
      }
    });
  } catch (err) {
    console.warn('Advertencia en sanitización de colores para PDF:', err);
  }
}
