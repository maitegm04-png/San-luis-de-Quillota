/**
 * Sanitizador de objetos para Firestore
 * Elimina recursivamente todas las propiedades con valor `undefined`,
 * evitando errores de "Unsupported field value: undefined" que bloquean
 * la sincronización en la nube entre dispositivos.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(cleanForFirestore) as any;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      result[key] = cleanForFirestore(value);
    }
  }
  return result as T;
}
