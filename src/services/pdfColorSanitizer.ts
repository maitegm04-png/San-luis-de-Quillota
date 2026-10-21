/**
 * Sanitizador Matemático de Colores Modernos (oklch, oklab, color())
 * y sincronizador de estilos computados para html2canvas / html2canvas-pro.
 * 
 * Tailwind v4 compila su paleta por defecto en oklch(...).
 * html2canvas-pro no soporta nativamente oklch y falla reseteando a negro (#000000)
 * o transparente. Esta utilidad:
 * 1. Convierte matemáticamente cualquier función oklch(...) a sRGB rgb()/rgba() estándar.
 * 2. Mapea estilos computados del elemento original en vivo al elemento clonado.
 * 3. Sanitiza hojas de estilo <style> para que html2canvas las interprete perfectamente.
 */

/**
 * Convierte valores OKLCH a espacio de color sRGB estándar (RGB 0-255).
 * Basado en la especificación W3C CSS Color Module Level 4.
 */
export function oklchToRgb(l: number, c: number, h: number, alpha: number = 1): string {
  // Manejo de valores acromáticos o bordes
  if (isNaN(h)) h = 0;
  if (isNaN(c) || c < 0) c = 0;
  if (isNaN(l)) l = 0;

  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  // OKLab a OKLab lineal no lineal (estimación de conos)
  const l_ = Math.pow(Math.max(0, l + 0.3963377774 * a + 0.2158037573 * b), 3);
  const m_ = Math.pow(Math.max(0, l - 0.1055613458 * a - 0.0638541728 * b), 3);
  const s_ = Math.pow(Math.max(0, l - 0.0894841775 * a - 1.2914855480 * b), 3);

  // Transformación a sRGB lineal
  const rLin = +4.0767434750 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const gLin = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const bLin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

  // Corrección gamma a sRGB estándar
  const toSrgb = (val: number): number => {
    const clamped = Math.max(0, Math.min(1, val));
    const s = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(s * 255);
  };

  const r = toSrgb(rLin);
  const g = toSrgb(gLin);
  const bVal = toSrgb(bLin);

  if (alpha < 1) {
    const safeA = Math.round(alpha * 100) / 100;
    return `rgba(${r}, ${g}, ${bVal}, ${safeA})`;
  }
  return `rgb(${r}, ${g}, ${bVal})`;
}

/**
 * Parsea y reemplaza cualquier función oklch(...) encontrada dentro de una cadena de texto CSS.
 */
export function convertOklchStringToRgb(cssText: string): string {
  if (!cssText || typeof cssText !== 'string' || !cssText.includes('oklch')) {
    return cssText;
  }

  // Regex para capturar variantes:
  // oklch(0.85 0.17 85)
  // oklch(85% 0.17 85)
  // oklch(0.85 0.17 85deg)
  // oklch(0.85 0.17 85 / 0.8)
  // oklch(0.85 0.17 85 / 80%)
  const oklchRegex = /oklch\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+(?:deg)?)(?:\s*\/\s*([0-9.]+%?))?\s*\)/gi;

  return cssText.replace(oklchRegex, (_match, lStr, cStr, hStr, aStr) => {
    let l = parseFloat(lStr);
    if (lStr.includes('%')) l = l / 100;

    let c = parseFloat(cStr);
    if (cStr.includes('%')) c = (c / 100) * 0.4;

    let h = parseFloat(hStr);

    let a = 1;
    if (aStr) {
      a = parseFloat(aStr);
      if (aStr.includes('%')) a = a / 100;
    }

    return oklchToRgb(l, c, h, a);
  });
}

/**
 * Propiedades de color críticas que deben asegurarse en formato RGB
 */
const COLOR_PROPERTIES = [
  'backgroundColor',
  'color',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'fill',
  'stroke',
] as const;

/**
 * Sanitiza a fondo el documento clonado por html2canvas:
 * 1. Convierte oklch en todas las hojas de estilo <style>.
 * 2. Si se pasa el elemento de origen en vivo (sourceEl), copia sus estilos computados
 *    (que el navegador ya resolvió a RGB) a los elementos clonados correspondientes.
 * 3. Asegura CORS y display adecuado en imágenes.
 */
export function sanitizeClonedDocColors(clonedDoc: Document, sourceEl?: HTMLElement): void {
  try {
    // 1. Sanitizar hojas de estilo embebidas en el clon (<style>)
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach((tag) => {
      if (tag.textContent && tag.textContent.includes('oklch')) {
        tag.textContent = convertOklchStringToRgb(tag.textContent);
      }
    });

    // 2. Mapeo profundo de estilos computados del DOM original al DOM clonado
    if (sourceEl && typeof window !== 'undefined') {
      const origNodes = [sourceEl, ...Array.from(sourceEl.querySelectorAll('*'))] as HTMLElement[];
      
      // Buscar el elemento raíz correspondiente en el documento clonado
      let clonedRoot: HTMLElement | null = null;
      if (sourceEl.id) {
        clonedRoot = clonedDoc.getElementById(sourceEl.id);
      }
      if (!clonedRoot) {
        clonedRoot = clonedDoc.querySelector(`[class="${sourceEl.className}"]`) || clonedDoc.body;
      }

      if (clonedRoot) {
        const clonedNodes = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll('*'))] as HTMLElement[];
        const count = Math.min(origNodes.length, clonedNodes.length);

        for (let i = 0; i < count; i++) {
          const orig = origNodes[i];
          const clone = clonedNodes[i];

          if (!orig || !clone || !clone.style) continue;

          try {
            const comp = window.getComputedStyle(orig);

            COLOR_PROPERTIES.forEach((prop) => {
              const compVal = comp[prop as any];
              if (compVal && typeof compVal === 'string' && compVal !== 'transparent' && compVal !== 'rgba(0, 0, 0, 0)') {
                if (compVal.includes('oklch')) {
                  clone.style[prop as any] = convertOklchStringToRgb(compVal);
                } else {
                  clone.style[prop as any] = compVal;
                }
              }
            });

            // Asegurar que las imágenes conserven sus dimensiones y crossorigin
            if (orig instanceof HTMLImageElement && clone instanceof HTMLImageElement) {
              clone.crossOrigin = 'anonymous';
              if (orig.complete && orig.naturalWidth > 0) {
                clone.width = orig.offsetWidth;
                clone.height = orig.offsetHeight;
              }
            }
          } catch {
            // Continuar con el siguiente nodo
          }
        }
      }
    }

    // 3. Barrido de seguridad en todos los elementos del clon para reemplazar oklch en atributos style
    const allCloned = clonedDoc.querySelectorAll('*');
    allCloned.forEach((node) => {
      const htmlEl = node as HTMLElement;
      if (htmlEl.style) {
        COLOR_PROPERTIES.forEach((prop) => {
          const val = htmlEl.style[prop as any];
          if (val && typeof val === 'string' && val.includes('oklch')) {
            htmlEl.style[prop as any] = convertOklchStringToRgb(val);
          }
        });
      }
    });
  } catch (err) {
    console.warn('Advertencia en sanitización de colores para PDF:', err);
  }
}
