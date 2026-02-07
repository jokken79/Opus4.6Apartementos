/**
 * HOOK: useDatabase
 * Gestión centralizada de la base de datos (CRUD + persistencia)
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Database,
  Property,
  Tenant,
  Employee,
  Config,
} from '../types/database';
import { validateProperty, validateTenant, validateEmployee } from '../utils/validators';

const STORAGE_KEY = 'uns_db_v7_0';
const DEFAULT_CONFIG: Config = {
  companyName: 'UNS-KIKAKU',
  closingDay: 0,
};

const INITIAL_DB: Database = {
  properties: [],
  tenants: [],
  employees: [],
  config: DEFAULT_CONFIG,
  version: '7.0',
  last_sync: new Date().toISOString(),
};

export function useDatabase() {
  const [db, setDb] = useState<Database>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DB;
    } catch {
      return INITIAL_DB;
    }
  });

  // Persistir cambios automáticamente
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  // ========== PROPERTIES ==========

  const addProperty = useCallback((property: Omit<Property, 'id'>) => {
    const validation = validateProperty({ ...property, id: Date.now() });
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    setDb(prev => ({
      ...prev,
      properties: [...prev.properties, { ...property, id: Date.now() }],
    }));
    return { success: true };
  }, []);

  const updateProperty = useCallback((id: number, updates: Partial<Property>) => {
    const existing = db.properties.find(p => p.id === id);
    if (!existing) return { success: false, error: 'Propiedad no encontrada' };

    const updated = { ...existing, ...updates };
    const validation = validateProperty(updated);
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    setDb(prev => ({
      ...prev,
      properties: prev.properties.map(p => p.id === id ? updated : p),
    }));
    return { success: true };
  }, [db.properties]);

  const deleteProperty = useCallback((id: number) => {
    setDb(prev => ({
      ...prev,
      properties: prev.properties.filter(p => p.id !== id),
      // También remover tenants asociados
      tenants: prev.tenants.filter(t => t.property_id !== id),
    }));
    return { success: true };
  }, []);

  // ========== TENANTS ==========

  const addTenant = useCallback((tenant: Omit<Tenant, 'id'>) => {
    // Validar que la propiedad existe
    if (!db.properties.find(p => p.id === tenant.property_id)) {
      return { success: false, error: 'Propiedad no existe' };
    }

    // Validar ID único
    if (db.tenants.find(t => t.employee_id === tenant.employee_id && t.status === 'active')) {
      return { success: false, error: 'ID empleado ya asignado' };
    }

    const validation = validateTenant({ ...tenant, id: Date.now() });
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    setDb(prev => ({
      ...prev,
      tenants: [...prev.tenants, { ...tenant, id: Date.now() }],
    }));
    return { success: true };
  }, [db.properties, db.tenants]);

  const updateTenant = useCallback((id: number, updates: Partial<Tenant>) => {
    const existing = db.tenants.find(t => t.id === id);
    if (!existing) return { success: false, error: 'Inquilino no encontrado' };

    const updated = { ...existing, ...updates };
    const validation = validateTenant(updated);
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    setDb(prev => ({
      ...prev,
      tenants: prev.tenants.map(t => t.id === id ? updated : t),
    }));
    return { success: true };
  }, [db.tenants]);

  const deleteTenant = useCallback((id: number) => {
    setDb(prev => ({
      ...prev,
      tenants: prev.tenants.filter(t => t.id !== id),
    }));
    return { success: true };
  }, []);

  // ========== EMPLOYEES ==========

  const addEmployees = useCallback((employees: Employee[]) => {
    setDb(prev => ({
      ...prev,
      employees: [
        ...prev.employees,
        ...employees.filter(emp => !prev.employees.find(e => e.id === emp.id)),
      ],
    }));
    return { success: true, count: employees.length };
  }, []);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    const existing = db.employees.find(e => e.id === id);
    if (!existing) return { success: false, error: 'Empleado no encontrado' };

    const updated = { ...existing, ...updates };
    const validation = validateEmployee(updated);
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    setDb(prev => ({
      ...prev,
      employees: prev.employees.map(e => e.id === id ? updated : e),
    }));
    return { success: true };
  }, [db.employees]);

  // ========== CONFIG ==========

  const updateConfig = useCallback((config: Partial<Config>) => {
    setDb(prev => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
    return { success: true };
  }, []);

  // ========== QUERIES ==========

  const getProperty = useCallback((id: number) =>
    db.properties.find(p => p.id === id), [db.properties]);

  const getPropertiesByStatus = useCallback((active: boolean) => {
    return db.properties.filter(p => {
      if (!p.contract_end) return active;
      const isActive = new Date(p.contract_end) > new Date();
      return active ? isActive : !isActive;
    });
  }, [db.properties]);

  const getTenantsByProperty = useCallback((propertyId: number, activeOnly = true) => {
    return db.tenants.filter(t =>
      t.property_id === propertyId && (!activeOnly || t.status === 'active')
    );
  }, [db.tenants]);

  const getEmployeeById = useCallback((id: string) =>
    db.employees.find(e => e.id === id), [db.employees]);

  // ========== EXPORT/IMPORT ==========

  const export_ = useCallback(() => {
    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UNS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  }, [db]);

  const import_ = useCallback((jsonData: string) => {
    try {
      const imported = JSON.parse(jsonData);
      if (!imported.properties || !imported.tenants) {
        return { success: false, error: 'Formato de archivo inválido' };
      }
      setDb(imported);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al parsear JSON' };
    }
  }, []);

  const reset = useCallback(() => {
    setDb(INITIAL_DB);
    return { success: true };
  }, []);

  return {
    // Estado
    db,
    setDb,

    // Properties
    addProperty,
    updateProperty,
    deleteProperty,
    getProperty,
    getPropertiesByStatus,

    // Tenants
    addTenant,
    updateTenant,
    deleteTenant,
    getTenantsByProperty,

    // Employees
    addEmployees,
    updateEmployee,
    getEmployeeById,

    // Config
    updateConfig,

    // Import/Export
    export: export_,
    import: import_,
    reset,
  };
}
