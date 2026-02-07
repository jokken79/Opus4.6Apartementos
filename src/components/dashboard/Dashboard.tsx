/**
 * COMPONENTE: Dashboard
 * Vista principal con KPIs y alertas
 */

import React, { useMemo } from 'react';
import {
  Building,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Database, AlertItem } from '../../types/database';

interface DashboardProps {
  db: Database;
  cycle: {
    start: string;
    end: string;
    month: string;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({ db, cycle }) => {
  // Calcular métricas
  const metrics = useMemo(() => {
    const activeProps = db.properties.filter(
      p => !p.contract_end || new Date(p.contract_end) > new Date()
    );

    const totalProperties = activeProps.length;
    const occupiedCount = db.tenants.filter(
      t => t.property_id !== null && t.status === 'active'
    ).length;
    const totalCapacity = activeProps.reduce((a, b) => a + (b.capacity || 0), 0);
    const occupancyRate = totalCapacity > 0
      ? Math.round((occupiedCount / totalCapacity) * 100)
      : 0;

    const totalRentCollected = db.tenants.reduce(
      (acc, t) => acc + (t.status === 'active' ? t.rent_contribution : 0),
      0
    );
    const totalParkingCollected = db.tenants.reduce(
      (acc, t) => acc + (t.status === 'active' ? t.parking_fee : 0),
      0
    );
    const totalCollected = totalRentCollected + totalParkingCollected;
    const totalPropCost = activeProps.reduce(
      (acc, p) => acc + (p.rent_cost || 0) + (p.parking_cost || 0),
      0
    );
    const totalTargetUNS = activeProps.reduce(
      (acc, p) => acc + (p.rent_price_uns || 0),
      0
    );
    const profit = totalCollected - totalPropCost;

    // Generar alertas
    const alerts: AlertItem[] = [];
    const today = new Date();

    activeProps.forEach(p => {
      if (p.contract_end) {
        const endDate = new Date(p.contract_end);
        const diffTime = Math.abs(endDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 60) {
          alerts.push({
            type: 'warning',
            msg: `📋 Contrato de ${p.name} vence en ${diffDays} días`,
            severity: diffDays <= 30 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    const zeroRentTenants = db.tenants.filter(
      t => t.status === 'active' && t.rent_contribution === 0
    );

    if (zeroRentTenants.length > 0) {
      alerts.push({
        type: 'danger',
        msg: `⚠️ ${zeroRentTenants.length} inquilino(s) sin renta configurada`,
        severity: 'high',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      totalProperties,
      occupiedCount,
      totalCapacity,
      occupancyRate,
      profit,
      totalCollected,
      totalPropCost,
      totalTargetUNS,
      alerts,
    };
  }, [db.properties, db.tenants]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900/20 via-[#15171c] to-[#0d0f12] border border-white/5 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 p-32 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-500/30 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Sistema Activo
              </span>
              <span className="text-gray-500 text-xs font-mono">
                {new Date().toLocaleDateString('es-ES')}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
              Bienvenido a <span className="text-blue-500">UNS</span>
            </h2>
            <p className="text-gray-400 text-sm max-w-md">
              Plataforma de gestión inmobiliaria corporativa refactorizada.
            </p>
          </div>

          <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-4 min-w-[280px]">
            <div className="p-3 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                Ciclo Actual
              </div>
              <div className="text-lg font-bold text-white leading-tight">
                {cycle.month}
              </div>
              <div className="text-xs text-gray-500">
                {cycle.start} - {cycle.end}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {metrics.alerts.length > 0 && (
        <div className="grid gap-3 animate-in zoom-in-95 duration-300">
          {metrics.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                alert.type === 'danger'
                  ? 'bg-red-900/10 border-red-500/30 text-red-200'
                  : 'bg-yellow-900/10 border-yellow-500/30 text-yellow-200'
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{alert.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Beneficio Neto"
          value={`¥${metrics.profit.toLocaleString()}`}
          subtext="Margen Mensual Real"
          icon={TrendingUp}
          trend={metrics.profit > 0 ? 'up' : 'down'}
        />
        <KPICard
          title="Total Recaudado"
          value={`¥${metrics.totalCollected.toLocaleString()}`}
          subtext="Renta + Parking"
          icon={DollarSign}
          trend="up"
        />
        <KPICard
          title="Ocupación Total"
          value={`${metrics.occupancyRate}%`}
          subtext={`${metrics.occupiedCount} de ${metrics.totalCapacity} camas`}
          icon={Users}
        />
        <KPICard
          title="Costo Operativo"
          value={`¥${metrics.totalPropCost.toLocaleString()}`}
          subtext="Pagos a Propietarios"
          icon={Building}
        />
      </div>

      {/* Balance Financiero */}
      <FinancialBalance
        collected={metrics.totalCollected}
        target={metrics.totalTargetUNS}
        cost={metrics.totalPropCost}
      />
    </div>
  );
};

// ============ SUB-COMPONENTES ============

interface KPICardProps {
  title: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
}) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1a1d24]/80 backdrop-blur-md shadow-xl p-5 transition-all duration-300 hover:border-blue-500/30 hover:bg-[#20242c] hover:-translate-y-1">
    <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

    <div className="flex justify-between items-start mb-3">
      <div className="p-2.5 bg-gradient-to-br from-gray-800 to-black rounded-xl border border-white/5 shadow-inner">
        <Icon className="text-blue-400 w-5 h-5" />
      </div>
      {trend && (
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
            trend === 'up'
              ? 'bg-green-500/10 text-green-400 border-green-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}
        >
          {trend === 'up' ? '▲' : '▼'}
        </span>
      )}
    </div>

    <div className="space-y-1">
      <h3 className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">
        {title}
      </h3>
      <div className="text-3xl font-black text-white tracking-tight leading-none">
        {value}
      </div>
      <div className="text-xs text-gray-500 font-medium">{subtext}</div>
    </div>
  </div>
);

interface FinancialBalanceProps {
  collected: number;
  target: number;
  cost: number;
}

const FinancialBalance: React.FC<FinancialBalanceProps> = ({
  collected,
  target,
  cost,
}) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1a1d24]/80 backdrop-blur-md shadow-xl p-6">
    <div className="flex justify-between items-end mb-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Balance Financiero</h3>
        <p className="text-gray-400 text-xs">Comparativa de Ingresos vs Egresos</p>
      </div>
      <div className="text-right">
        <div className="text-2xl font-mono font-bold text-blue-400">
          ¥{target.toLocaleString()}
        </div>
        <div className="text-[10px] text-gray-500 uppercase font-bold">
          Objetivo Máximo
        </div>
      </div>
    </div>

    <div className="space-y-4">
      {/* Ingresos */}
      <div className="relative pt-6 pb-2">
        <div className="flex mb-2 items-center justify-between">
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-400 bg-green-200/10 border border-green-500/30">
            Ingresos Totales
          </span>
          <span className="text-xs font-bold inline-block text-green-400">
            {Math.round((collected / target) * 100)}%
          </span>
        </div>
        <div className="flex h-4 overflow-hidden text-xs bg-gray-800 rounded-full border border-white/5">
          <div
            style={{ width: `${Math.min((collected / target) * 100, 100)}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000"
          />
        </div>
      </div>

      {/* Costos */}
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-400 bg-red-200/10 border border-red-500/30">
            Costos Fijos
          </span>
          <span className="text-xs font-bold inline-block text-red-400">
            ¥{cost.toLocaleString()}
          </span>
        </div>
        <div className="flex h-2 overflow-hidden text-xs bg-gray-800 rounded-full border border-white/5">
          <div
            style={{ width: `${Math.min((cost / target) * 100, 100)}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500 transition-all duration-1000"
          />
        </div>
      </div>
    </div>
  </div>
);
