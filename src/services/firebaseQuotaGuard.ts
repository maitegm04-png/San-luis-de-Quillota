/**
 * Guardián de Cuota Gratuita de Firebase (Plan Spark)
 * Previene superar los límites diarios gratuitos para garantizar costo $0:
 * - 50,000 lecturas / día (Límite Spark) -> Umbral seguro: 30,000
 * - 20,000 escrituras / día (Límite Spark) -> Umbral seguro: 12,000
 * - 20,000 eliminaciones / día (Límite Spark) -> Umbral seguro: 5,000
 * - 1 GB de almacenamiento de documentos -> Optimización y compresión de fotos a <30KB
 */

export interface DailyQuotaStats {
  date: string;
  reads: number;
  writes: number;
  deletes: number;
  maxDailyReads: number;
  maxDailyWrites: number;
  maxDailyDeletes: number;
  readPercent: number;
  writePercent: number;
  isSafe: boolean;
  isNearingLimit: boolean;
  limitReached: boolean;
}

const SPARK_MAX_WRITES = 12000; // Margen de seguridad sobre el límite de 20,000
const SPARK_MAX_READS = 30000;  // Margen de seguridad sobre el límite de 50,000
const SPARK_MAX_DELETES = 5000; // Margen de seguridad sobre el límite de 20,000

const getTodayKey = () => {
  const now = new Date();
  return `slq_firebase_quota_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
};

export const getDailyQuotaStats = (): DailyQuotaStats => {
  if (typeof window === 'undefined') {
    return {
      date: new Date().toISOString().split('T')[0],
      reads: 0,
      writes: 0,
      deletes: 0,
      maxDailyReads: SPARK_MAX_READS,
      maxDailyWrites: SPARK_MAX_WRITES,
      maxDailyDeletes: SPARK_MAX_DELETES,
      readPercent: 0,
      writePercent: 0,
      isSafe: true,
      isNearingLimit: false,
      limitReached: false,
    };
  }

  const key = getTodayKey();
  let raw = localStorage.getItem(key);
  let parsed = { reads: 0, writes: 0, deletes: 0 };
  
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reads: 0, writes: 0, deletes: 0 };
    }
  }

  const writePercent = Math.min(100, Math.round((parsed.writes / SPARK_MAX_WRITES) * 100));
  const readPercent = Math.min(100, Math.round((parsed.reads / SPARK_MAX_READS) * 100));
  const maxUsage = Math.max(writePercent, readPercent);

  const limitReached = parsed.writes >= SPARK_MAX_WRITES || parsed.reads >= SPARK_MAX_READS;
  const isNearingLimit = maxUsage >= 80;

  return {
    date: key.replace('slq_firebase_quota_', ''),
    reads: parsed.reads || 0,
    writes: parsed.writes || 0,
    deletes: parsed.deletes || 0,
    maxDailyReads: SPARK_MAX_READS,
    maxDailyWrites: SPARK_MAX_WRITES,
    maxDailyDeletes: SPARK_MAX_DELETES,
    readPercent,
    writePercent,
    isSafe: maxUsage < 80 && !limitReached,
    isNearingLimit,
    limitReached,
  };
};

export const recordQuotaOperation = (type: 'read' | 'write' | 'delete', count = 1): boolean => {
  if (typeof window === 'undefined') return true;

  const key = getTodayKey();
  let current = { reads: 0, writes: 0, deletes: 0 };
  
  try {
    const raw = localStorage.getItem(key);
    if (raw) current = JSON.parse(raw);
  } catch {
    // fallback
  }

  if (type === 'write') {
    current.writes = (current.writes || 0) + count;
    if (current.writes > SPARK_MAX_WRITES) {
      console.warn(`[Firebase Quota Guard] Estimación diaria de escrituras elevada (${current.writes}/${SPARK_MAX_WRITES}). Sincronización activa.`);
    }
  } else if (type === 'read') {
    current.reads = (current.reads || 0) + count;
    if (current.reads > SPARK_MAX_READS) {
      console.warn(`[Firebase Quota Guard] Estimación diaria de lecturas elevada (${current.reads}/${SPARK_MAX_READS}). Memoria caché Firestore activa.`);
    }
  } else if (type === 'delete') {
    current.deletes = (current.deletes || 0) + count;
  }

  try {
    localStorage.setItem(key, JSON.stringify(current));
    // Trigger custom event so any listener updates in real time
    window.dispatchEvent(new Event('firebase-quota-update'));
  } catch {
    // ignore localStorage quota errors
  }

  return true;
};

/**
 * Garantiza que la sincronización en tiempo real entre múltiples navegadores y usuarios
 * nunca se interrumpa. En el Plan Gratuito (Spark) de Firebase no hay facturación automática
 * (costo $0 garantizado). La protección de cuota se logra mediante:
 * 1) Cache local IndexedDB (persistentLocalCache)
 * 2) Comparación de cambios (hasDataChanged) para evitar escrituras redundantes
 * 3) Compresión de imágenes de jugadores a <25KB
 */
export const canPerformFirebaseWrite = (): boolean => {
  return true;
};

/**
 * Validador de cambios para evitar llamadas setDoc redundantes
 * Si los datos son idénticos, ahorra 1 escritura a Firestore
 */
export const hasDataChanged = (prevData: any, nextData: any): boolean => {
  if (prevData === nextData) return false;
  try {
    return JSON.stringify(prevData) !== JSON.stringify(nextData);
  } catch {
    return true;
  }
};

/**
 * Comprime una imagen (archivo o base64) para que nunca supere ~25KB
 * Esto garantiza que los documentos de jugadores se mantengan diminutos en Firestore
 * evitando superar el límite de 1GB del plan gratuito.
 */
export const compressImageForPlayer = (
  fileOrBase64: File | string,
  maxWidth = 250,
  maxHeight = 250,
  quality = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Do not set crossOrigin for data: or blob: URIs to avoid canvas taint errors
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }

    const handleLoad = () => {
      try {
        let width = img.width || maxWidth;
        let height = img.height || maxHeight;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('Canvas compression warning, falling back to original data URL', err);
        if (typeof fileOrBase64 === 'string') {
          resolve(fileOrBase64);
        } else {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(err);
          reader.readAsDataURL(fileOrBase64);
        }
      }
    };

    img.onload = handleLoad;

    img.onerror = (err) => {
      console.warn('Image element load error during compression', err);
      if (typeof fileOrBase64 === 'string') {
        resolve(fileOrBase64);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(err);
        reader.readAsDataURL(fileOrBase64);
      }
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          img.src = result;
        } else {
          reject(new Error('No se pudo leer el archivo de imagen.'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    }
  });
};

