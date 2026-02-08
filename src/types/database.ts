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

// ============ REPORTES MENSUALES ============

// Fila del reporte por propiedad (detalle por habitación)
export interface PropertyReportRow {
  no: number;
  area: string; // 地区
  property_name: string; // アパート名
  room_number: string; // 部屋番号
  layout: string; // 間取 (1K, 2DK...)
  occupant_count: number; // 入居人数
  vacancy: number; // 空状況
  rent_cost: number; // 契約家賃
  rent_target: number; // 設定家賃
  profit: number; // 利益
  notes: string; // 備考
}

// Fila del resumen por empresa (派遣先)
export interface CompanyReportRow {
  company: string; // 派遣先名
  property_count: number; // 物件数
  rent_cost: number; // 契約家賃 total
  rent_target: number; // 設定家賃 total
  profit: number; // 利益
  payroll_deduction: number; // 支給家賃控除 (descuento nómina)
  monthly_profit: number; // 月家賃利益
}

// Fila de descuento nómina (para contabilidad)
export interface PayrollDeductionRow {
  employee_id: string; // 社員No
  company: string; // 派遣先
  name_kana: string; // カナ
  name: string; // 氏名
  property_name: string; // アパート名
  rent_deduction: number; // 家賃控除額
  parking_deduction: number; // 駐車場控除額
  total_deduction: number; // 控除合計
}

// Snapshot de cierre mensual
export interface MonthlySnapshot {
  id: string;
  cycle_month: string; // "2026-02" formato
  cycle_start: string;
  cycle_end: string;
  closed_at: string; // Timestamp del cierre
  total_properties: number;
  total_tenants: number;
  total_collected: number;
  total_cost: number;
  total_target: number;
  profit: number;
  occupancy_rate: number;
  company_summary: CompanyReportRow[];
  property_detail: PropertyReportRow[];
  payroll_detail: PayrollDeductionRow[];
}

// Almacenamiento de histórico de reportes
export interface ReportHistory {
  snapshots: MonthlySnapshot[];
  version: string;
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
