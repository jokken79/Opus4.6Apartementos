/**
 * COMPONENTE: RentManager
 * Gestión de rentas y parking por propiedad
 */

import React, { useMemo } from 'react';
import { Calculator, UserPlus, AlertCircle } from 'lucide-react';
import { Property, Tenant } from '../../types/database';

interface RentManagerProps {
  property: Property;
  tenants: Tenant[];
  onUpdateTenant: (tenantId: number, field: string, value: number) => void;
  onDistributeEvenly: (propertyId: number) => void;
  onAddTenant: () => void;
}

export const RentManager: React.FC<RentManagerProps> = ({
  property,
  tenants,
  onUpdateTenant,
  onDistributeEvenly,
  onAddTenant,
}) => {
  // Calcular totales
  const totals = useMemo(() => {
    const totalRent = tenants.reduce((acc, t) => acc + (t.rent_contribution || 0), 0);
    const totalParking = tenants.reduce((acc, t) => acc + (t.parking_fee || 0), 0);
    const totalAll = totalRent + totalParking;

    return { totalRent, totalParking, totalAll };
  }, [tenants]);

  const isFull = totals.totalRent >= property.rent_price_uns;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 p-4 rounded-xl border border-white/5 text-center">
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
            Objetivo UNS
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ¥{(property.rent_price_uns || 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 text-center">
          <div className="text-[10px] text-green-400 uppercase font-bold tracking-widest mb-1">
            Total Rentas
          </div>
          <div className="text-2xl font-black text-green-400 font-mono">
            ¥{totals.totalRent.toLocaleString()}
          </div>
        </div>

        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-center">
          <div className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-1">
            Total Parking
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            ¥{totals.totalParking.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-800/50 p-4 rounded-xl border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-400">Progreso de Recaudación</span>
          <span className="text-xs font-bold text-white">
            {Math.round((totals.totalRent / property.rent_price_uns) * 100)}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
            style={{
              width: `${Math.min((totals.totalRent / property.rent_price_uns) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-4">
        <button
          onClick={() => onDistributeEvenly(property.id)}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition border border-white/10"
        >
          <Calculator className="w-4 h-4" />
          Dividir Equitativamente
        </button>

        <button
          onClick={onAddTenant}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          Añadir Inquilino
        </button>
      </div>

      {/* Tabla de Inquilinos */}
      <div className="bg-gray-900/50 rounded-2xl border border-white/5 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 text-[10px] text-gray-500 uppercase font-bold p-4 bg-black/20 border-b border-white/5">
          <div className="col-span-5">Inquilino</div>
          <div className="col-span-3 text-right">Renta Base (¥)</div>
          <div className="col-span-4 text-right pr-2">Parking (¥)</div>
        </div>

        {/* Rows */}
        <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
          {tenants.length === 0 ? (
            <p className="text-center text-gray-600 py-8 text-sm">
              No hay inquilinos activos
            </p>
          ) : (
            tenants.map(tenant => (
              <TenantRowComponent
                key={tenant.id}
                tenant={tenant}
                onUpdateTenant={onUpdateTenant}
              />
            ))
          )}
        </div>
      </div>

      {/* Estado */}
      {isFull && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-200 flex items-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm font-bold">✓ Objetivo alcanzado</span>
        </div>
      )}

      {tenants.some(t => t.rent_contribution === 0) && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 flex items-center gap-3">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-bold">
            {tenants.filter(t => t.rent_contribution === 0).length} inquilino(s) sin configuración
          </span>
        </div>
      )}
    </div>
  );
};

const TenantRowComponent: React.FC<{
  tenant: Tenant;
  onUpdateTenant: (tenantId: number, field: string, value: number) => void;
}> = ({ tenant, onUpdateTenant }) => (
  <div className="grid grid-cols-12 gap-2 items-center bg-gray-800/30 p-3 rounded-xl border border-white/5 hover:border-blue-500/30 transition">
    <div className="col-span-5">
      <p className="text-sm font-semibold text-white truncate">{tenant.name}</p>
      <p className="text-xs text-gray-500">{tenant.employee_id}</p>
    </div>
    <input
      type="number"
      value={tenant.rent_contribution}
      onChange={(e) => onUpdateTenant(tenant.id, 'rent_contribution', parseInt(e.target.value) || 0)}
      className="col-span-3 bg-gray-900 border border-white/10 rounded px-2 py-1 text-right text-white text-sm"
    />
    <input
      type="number"
      value={tenant.parking_fee}
      onChange={(e) => onUpdateTenant(tenant.id, 'parking_fee', parseInt(e.target.value) || 0)}
      className="col-span-4 bg-gray-900 border border-white/10 rounded px-2 py-1 text-right text-white text-sm"
    />
  </div>
);
