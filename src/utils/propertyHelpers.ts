/**
 * Utilidades compartidas para propiedades
 * - isPropertyActive: determina si una propiedad tiene contrato vigente
 * - extractArea: extrae zona/distrito de la dirección
 */

import type { Property } from '../types/database';

/**
 * Determina si una propiedad tiene contrato vigente (activa).
 * Activa si: no tiene contract_end, o fecha inválida, o posterior a hoy.
 */
export function isPropertyActive(p: Property): boolean {
  if (!p.contract_end) return true;
  const d = new Date(p.contract_end);
  return isNaN(d.getTime()) || d > new Date();
}

/**
 * Extraer zona/distrito de la dirección para agrupar en reportes.
 * Prioriza extracción de 市区町村 (ciudad/ward) de la dirección.
 */
export function extractArea(_name: string, address: string): string {
  if (address) {
    // Eliminar código postal si presente (〒XXX-XXXX)
    const cleaned = address.replace(/〒?\s*\d{3}-?\d{4}\s*/, '');
    // Extraer ciudad/ward/pueblo (市区町村郡)
    const cityMatch = cleaned.match(/([^\s〒]+?[市区町村郡])/);
    if (cityMatch) return cityMatch[1];
    // Fallback: primer segmento delimitado por espacio
    const parts = cleaned.split(/[　 ]/);
    if (parts.length >= 2 && parts[0]) return parts[0];
    if (cleaned.length > 0) return cleaned.substring(0, 6);
  }
  return '';
}
