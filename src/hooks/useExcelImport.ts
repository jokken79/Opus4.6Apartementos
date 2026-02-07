/**
 * HOOK: useExcelImport
 * Procesamiento y validación de archivos Excel
 */

import { useState, useCallback } from 'react';
import {
  validateExcelPropertyRow,
  validateExcelTenantRow,
  validateExcelEmployeeRow,
  validateDataIntegrity,
} from '../utils/validators';
import { Property, Tenant, Employee } from '../types/database';

interface ImportResult {
  success: boolean;
  type?: 'employees' | 'rent_management';
  data?: {
    properties?: Property[];
    tenants?: Tenant[];
    employees?: Employee[];
  };
  errors: Array<{ row: number; field: string; message: string }>;
  summary: string;
}

export function useExcelImport() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Procesar archivo Excel
   */
  const processFile = useCallback(async (file: File): Promise<ImportResult> => {
    setIsLoading(true);

    try {
      // Cargar librería XLSX dinámicamente
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
        throw new Error('Librería XLSX no cargada');
      }

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      const sheetNames = workbook.SheetNames;

      // Detectar tipo de importación
      const hasEmployees = sheetNames.some((n: string) =>
        n.includes('Genzai') || n.includes('Ukeoi') || n.includes('社員')
      );

      const hasProperties = sheetNames.some((n: string) =>
        n.includes('会社寮情報') || n.includes('物件')
      );

      const hasTenants = sheetNames.some((n: string) =>
        n.includes('入居者一覧') || n.includes('入居')
      );

      if (hasEmployees) {
        return processEmployeeImport(workbook, sheetNames);
      } else if (hasProperties || hasTenants) {
        return processRentImport(workbook, sheetNames);
      } else {
        return {
          success: false,
          errors: [],
          summary: 'No se detectó formato válido de importación',
        };
      }
    } catch (error) {
      console.error('Error procesando Excel:', error);
      return {
        success: false,
        errors: [],
        summary: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Procesar importación de empleados
   */
  const processEmployeeImport = (workbook: any, sheetNames: string[]) => {
    const errors: ImportResult['errors'] = [];
    const employees: Employee[] = [];

    const empSheet = sheetNames.find((n: string) =>
      n.includes('Genzai') || n.includes('Ukeoi') || n.includes('社員')
    );

    if (!empSheet) {
      return {
        success: false,
        errors: [],
        summary: 'Hoja de empleados no encontrada',
      };
    }

    const data = (window as any).XLSX.utils.sheet_to_json(
      workbook.Sheets[empSheet],
      { defval: '' }
    );

    data.forEach((row: any, index: number) => {
      const validation = validateExcelEmployeeRow(row);

      if (!validation.success) {
        errors.push({
          row: index + 1,
          field: 'múltiples',
          message: 'Datos incompletos',
        });
        return;
      }

      const id = String(row['社員No'] || row['ID']).trim();
      const name = String(row['氏名'] || row['Name']).trim();

      if (!id || !name) {
        errors.push({
          row: index + 1,
          field: 'ID/Nombre',
          message: 'ID y Nombre requeridos',
        });
        return;
      }

      employees.push({
        id,
        name,
        name_kana: String(row['カナ'] || '').trim(),
        company: String(row['派遣先'] || '').trim(),
        full_data: row,
      });
    });

    const summary = `
Importación de Empleados:
- Total filas procesadas: ${data.length}
- Empleados válidos: ${employees.length}
- Errores encontrados: ${errors.length}
    `.trim();

    return {
      success: errors.length === 0,
      type: 'employees' as const,
      data: { employees },
      errors,
      summary,
    };
  };

  /**
   * Procesar importación de rentas
   */
  const processRentImport = (workbook: any, sheetNames: string[]) => {
    const errors: ImportResult['errors'] = [];
    const properties: Property[] = [];
    const tenants: Tenant[] = [];

    // Procesar propiedades
    const propSheet = sheetNames.find((n: string) =>
      n.includes('会社寮情報') || n.includes('物件')
    );

    if (propSheet) {
      const propData = (window as any).XLSX.utils.sheet_to_json(
        workbook.Sheets[propSheet],
        { defval: '' }
      );

      propData.forEach((row: any, index: number) => {
        const validation = validateExcelPropertyRow(row);
        if (!validation.success) {
          errors.push({
            row: index + 1,
            field: 'propiedad',
            message: 'Campos requeridos faltantes',
          });
          return;
        }

        const name = String(row['ｱﾊﾟｰﾄ'] || row['物件名']).trim();
        if (!name) {
          errors.push({
            row: index + 1,
            field: 'nombre',
            message: 'Nombre de propiedad requerido',
          });
          return;
        }

        properties.push({
          id: Date.now() + index,
          name,
          address: String(row['住所'] || '').trim(),
          address_auto: String(row['住所'] || '').trim(),
          capacity: parseInt(String(row['入居人数'] || 2)) || 2,
          rent_cost: parseInt(String(row['家賃'] || 0)) || 0,
          rent_price_uns: parseInt(String(row['USN家賃'] || 0)) || 0,
          parking_cost: parseInt(String(row['駐車場代'] || 0)) || 0,
          type: '1K',
          contract_start: row['契約開始日'] || '',
          contract_end: row['契約終了'] || '',
        });
      });
    }

    // Procesar inquilinos
    const tenantSheet = sheetNames.find((n: string) =>
      n.includes('入居者一覧') || n.includes('入居')
    );

    if (tenantSheet) {
      const tenantData = (window as any).XLSX.utils.sheet_to_json(
        workbook.Sheets[tenantSheet],
        { defval: '' }
      );

      tenantData.forEach((row: any, index: number) => {
        const validation = validateExcelTenantRow(row);
        if (!validation.success) {
          errors.push({
            row: index + 1,
            field: 'inquilino',
            message: 'Campos requeridos faltantes',
          });
          return;
        }

        const apt = String(row['ｱﾊﾟｰﾄ']).trim();
        const kana = String(row['カナ']).trim();

        if (!apt || !kana) {
          errors.push({
            row: index + 1,
            field: 'apt/kana',
            message: 'Apartamento y Kana requeridos',
          });
          return;
        }

        // Encontrar propiedad matching
        const prop = properties.find((p: Property) => p.name === apt);
        if (!prop) {
          errors.push({
            row: index + 1,
            field: 'apartamento',
            message: `Propiedad "${apt}" no encontrada`,
          });
          return;
        }

        tenants.push({
          id: Date.now() + index,
          employee_id: `IMP-${index}`,
          name: kana,
          name_kana: kana,
          property_id: prop.id,
          rent_contribution: parseInt(String(row['家賃'] || 0)) || 0,
          parking_fee: parseInt(String(row['駐車場'] || 0)) || 0,
          entry_date: row['入居'] || new Date().toISOString().split('T')[0],
          status: 'active',
        });
      });
    }

    // Validar integridad
    const integrityCheck = validateDataIntegrity({
      properties,
      tenants,
      employees: [],
      config: {},
    });

    const summary = `
Importación de Gestión de Rentas:
- Propiedades: ${properties.length}
- Inquilinos: ${tenants.length}
- Errores de validación: ${errors.length}
- Errores de integridad: ${integrityCheck.errors.length}
    `.trim();

    return {
      success: errors.length === 0 && integrityCheck.valid,
      type: 'rent_management' as const,
      data: { properties, tenants },
      errors: [
        ...errors,
        ...integrityCheck.errors.map((e: any, i: number) => ({
          row: i,
          field: e.type,
          message: e.message,
        })),
      ],
      summary,
    };
  };

  return {
    processFile,
    isLoading,
  };
}
