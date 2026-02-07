/**
 * TIPOS PRINCIPALES - UNS Estate OS
 * Estructura centralizada de tipos TypeScript
 */

// ============ PROPIEDAD ============
export interface Property {
  id: number;
  name: string;
  room_number?: string;
  postal_code?: string;
  address_auto: string;
  address_detail?: string;
  address: string; // Dirección completa formateada
  type: string; // 1K, 2K, etc
  capacity: number;

  // Financiero
  rent_cost: number; // Costo real (a propietario)
  rent_price_uns: number; // Precio objetivo UNS
  parking_cost: number;

  // Administración
  manager_name?: string;
  manager_phone?: string;

  // Contrato
  contract_start: string; // YYYY-MM-DD
  contract_end?: string;

  // Metadata
  created_at?: string;
  updated_at?: string;
}

// ============ INQUILINO/ASIGNACIÓN ============
export interface Tenant {
  id: number;
  employee_id: string; // ID empleado (社員№)
  name: string;
  name_kana: string;
  property_id: number; // FK Property
  rent_contribution: number; // ¥ asignado
  parking_fee: number; // ¥ parking
  entry_date: string; // YYYY-MM-DD
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

// ============ EMPLEADO ============
export interface Employee {
  id: string;
  name: string;
  name_kana: string;
  company: string;
  full_data?: Record<string, any>; // Datos raw del Excel
  created_at?: string;
  updated_at?: string;
}

// ============ CONFIGURACIÓN ============
export interface Config {
  companyName: string;
  closingDay: 0 | 15 | 20 | 25; // Día de cierre de mes
}

// ============ BASE DE DATOS PRINCIPAL ============
export interface Database {
  properties: Property[];
  tenants: Tenant[];
  employees: Employee[];
  config: Config;
  // Metadata
  version: string;
  last_sync: string;
}

// ============ DATOS DASHBOARD ============
export interface DashboardMetrics {
  totalProperties: number;
  occupiedCount: number;
  totalCapacity: number;
  occupancyRate: number;
  profit: number;
  totalCollected: number;
  totalPropCost: number;
  totalTargetUNS: number;
  alerts: AlertItem[];
}

export interface AlertItem {
  type: 'warning' | 'danger';
  msg: string;
  severity?: 'low' | 'medium' | 'high';
  timestamp?: string;
}

// ============ NOTIFICACIONES ============
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // ms, undefined = persistente
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: string;
}

// ============ IMPORTACIÓN EXCEL ============
export interface ImportStatus {
  type: '' | 'loading' | 'success' | 'error';
  msg: string;
}

export interface ExcelImportData {
  type: 'employees' | 'rent_management' | '';
  data: any;
  summary: string;
}

// ============ VALIDACIÓN ============
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ============ CICLO FACTURACIÓN ============
export interface BillingCycle {
  start: string; // Fecha formateada
  end: string;
  month: string;
  closingDay: number;
}

// ============ HISTORIAL (Future) ============
export interface AuditLog {
  id: string;
  action: string;
  entity_type: 'property' | 'tenant' | 'employee';
  entity_id: number;
  changes: Record<string, any>;
  user_id: string;
  timestamp: string;
}

// ============ RESPUESTA API (Future) ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}
