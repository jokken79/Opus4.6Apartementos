/**
 * ESQUEMAS DE VALIDACIÓN - Zod
 * Validación centralizada y reutilizable
 */

import { z } from 'zod';

// ============ PROPERTY ============
export const PropertySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  room_number: z.string().optional(),
  postal_code: z.string().regex(/^\d{3}-?\d{4}$/, 'Código postal inválido (formato: 123-4567)').optional(),
  address_auto: z.string().optional(),
  address_detail: z.string().optional(),
  address: z.string().min(5, 'Dirección debe tener al menos 5 caracteres'),
  type: z.string().default('1K'),
  capacity: z.number().int().min(1, 'Capacidad mínima: 1').max(20),
  rent_cost: z.number().nonnegative('Costo no puede ser negativo'),
  rent_price_uns: z.number().nonnegative('Precio UNS no puede ser negativo'),
  parking_cost: z.number().nonnegative('Costo parking no puede ser negativo'),
  manager_name: z.string().optional(),
  manager_phone: z.string().regex(/^\d{10,11}$/, 'Teléfono debe tener 10-11 dígitos').optional(),
  contract_start: z.string().datetime().optional(),
  contract_end: z.string().datetime().optional(),
});

// ============ TENANT ============
export const TenantSchema = z.object({
  id: z.number().optional(),
  employee_id: z.string().min(1, 'ID empleado requerido').max(50),
  name: z.string().min(1, 'Nombre requerido'),
  name_kana: z.string().min(1, 'Nombre en Kana requerido'),
  property_id: z.number().int().positive('ID propiedad inválido'),
  rent_contribution: z.number().nonnegative('Renta no puede ser negativa'),
  parking_fee: z.number().nonnegative('Parking no puede ser negativo'),
  entry_date: z.string().datetime(),
  status: z.string().default('active'),
});

// ============ EMPLOYEE ============
export const EmployeeSchema = z.object({
  id: z.string().min(1, 'ID requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  name_kana: z.string().min(1, 'Nombre kana requerido'),
  company: z.string().default(''),
  full_data: z.any().optional(),
});

// ============ IMPORTACIÓN EXCEL ============
export const ExcelPropertyRowSchema = z.object({
  'ｱﾊﾟｰﾄ': z.string(),
  '住所': z.string().optional(),
  '入居人数': z.any().optional(),
  '家賃': z.any().optional(),
  'USN家賃': z.any().optional(),
  '駐車場代': z.any().optional(),
  '契約開始日': z.string().optional(),
  '契約終了': z.string().optional(),
});

export const ExcelTenantRowSchema = z.object({
  'ｱﾊﾟｰﾄ': z.string(),
  'カナ': z.string(),
  '家賃': z.any().optional(),
  '駐車場': z.any().optional(),
  '入居': z.string().optional(),
});

export const ExcelEmployeeRowSchema = z.object({
  '社員No': z.any(),
  '氏名': z.string(),
  'カナ': z.string(),
  '派遣先': z.string().optional(),
});

// ============ VALIDADORES FUNCIONALES ============

/**
 * Valida una propiedad completa
 */
export function validateProperty(data: unknown) {
  try {
    return { success: true, data: PropertySchema.parse(data) };
  } catch (error: any) {
    if (error.issues) {
      return {
        success: false,
        errors: error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    throw error;
  }
}

/**
 * Valida un inquilino completo
 */
export function validateTenant(data: unknown) {
  try {
    return { success: true, data: TenantSchema.parse(data) };
  } catch (error: any) {
    if (error.issues) {
      return {
        success: false,
        errors: error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    throw error;
  }
}

/**
 * Valida un empleado
 */
export function validateEmployee(data: unknown) {
  try {
    return { success: true, data: EmployeeSchema.parse(data) };
  } catch (error: any) {
    if (error.issues) {
      return {
        success: false,
        errors: error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    throw error;
  }
}

/**
 * Valida una fila de Excel para propiedades
 */
export function validateExcelPropertyRow(row: any) {
  return ExcelPropertyRowSchema.safeParse(row);
}

/**
 * Valida una fila de Excel para inquilinos
 */
export function validateExcelTenantRow(row: any) {
  return ExcelTenantRowSchema.safeParse(row);
}

/**
 * Valida una fila de Excel para empleados
 */
export function validateExcelEmployeeRow(row: any) {
  return ExcelEmployeeRowSchema.safeParse(row);
}

/**
 * Validador compuesto para verificar relaciones (FK)
 */
export function validateDataIntegrity(db: any) {
  const errors: Array<{ type: string; message: string }> = [];

  // Verificar que todos los tenant.property_id existan en properties
  for (const tenant of db.tenants || []) {
    if (!db.properties.find((p: any) => p.id === tenant.property_id)) {
      errors.push({
        type: 'FK_ERROR',
        message: `Inquilino "${tenant.name}" asignado a propiedad inexistente (ID: ${tenant.property_id})`,
      });
    }
  }

  // Verificar capacidad de propiedades
  for (const property of db.properties || []) {
    const tenantCount = db.tenants.filter((t: any) => t.property_id === property.id && t.status === 'active').length;
    if (tenantCount > property.capacity) {
      errors.push({
        type: 'CAPACITY_ERROR',
        message: `Propiedad "${property.name}" excede capacidad (${tenantCount}/${property.capacity})`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
