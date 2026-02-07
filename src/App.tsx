import React, { useMemo, useState } from 'react';
import { useDatabase } from './hooks/useDatabase';
import { useNotifications, ToastContainer } from './hooks/useNotifications';
import { Dashboard } from './components/dashboard/Dashboard';
import { RentManager } from './components/properties/RentManager';
import { ImportView } from './components/import/ImportView';
import './App.css';

type ViewType = 'dashboard' | 'properties' | 'import' | 'settings';

function App() {
  const db = useDatabase();
  const { notifications, removeNotification, success, error } = useNotifications();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  // Calcular ciclo de facturación
  const cycle = useMemo(() => {
    const today = new Date();
    const month = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    const start = `1 de ${today.toLocaleDateString('es-ES', { month: 'long' })}`;
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

    return { start, end, month };
  }, []);

  // Manejadores de RentManager
  const handleUpdateTenant = (tenantId: number, field: string, value: number) => {
    const result = db.updateTenant(tenantId, { [field]: value } as any);
    if (!result.success) {
      error('Error', result.error || 'No se pudo actualizar el inquilino');
    }
  };

  const handleDistributeEvenly = (propertyId: number) => {
    const property = db.getProperty(propertyId);
    const tenants = db.getTenantsByProperty(propertyId);

    if (!property || tenants.length === 0) {
      error('Error', 'No hay inquilinos para distribuir');
      return;
    }

    const rentPerTenant = Math.floor(property.rent_price_uns / tenants.length);
    const remainder = property.rent_price_uns % tenants.length;

    tenants.forEach((tenant, idx) => {
      const rent = idx === 0 ? rentPerTenant + remainder : rentPerTenant;
      db.updateTenant(tenant.id, { rent_contribution: rent });
    });

    success('Distribución completada', `Renta distribuida entre ${tenants.length} inquilinos`);
  };

  const handleAddTenant = () => {
    // Placeholder - en un app real sería un modal
    error('No implementado', 'Esta funcionalidad será agregada pronto');
  };

  // Manejador de importación
  const handleSyncSuccess = (importData: any) => {
    let importedCount = 0;

    if (importData.employees?.length > 0) {
      db.addEmployees(importData.employees);
      importedCount += importData.employees.length;
    }

    if (importData.properties?.length > 0) {
      importData.properties.forEach((p: any) => {
        db.addProperty(p);
      });
      importedCount += importData.properties.length;
    }

    if (importData.tenants?.length > 0) {
      importData.tenants.forEach((t: any) => {
        db.addTenant(t);
      });
      importedCount += importData.tenants.length;
    }

    success('Importación exitosa', `Se importaron ${importedCount} registros`);
    setCurrentView('dashboard');
  };

  const selectedProperty = selectedPropertyId
    ? db.getProperty(selectedPropertyId)
    : null;
  const selectedTenants = selectedPropertyId
    ? db.getTenantsByProperty(selectedPropertyId)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0f12] via-[#1a1d24] to-[#15171c] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            UNS Estate OS v7.0
          </h1>

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('properties')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                currentView === 'properties'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Propiedades
            </button>
            <button
              onClick={() => setCurrentView('import')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                currentView === 'import'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Importar
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {currentView === 'dashboard' && (
          <Dashboard db={db.db} cycle={cycle} />
        )}

        {currentView === 'properties' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-black text-white mb-4">Gestión de Propiedades</h2>

              {db.db.properties.length === 0 ? (
                <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-12 text-center">
                  <p className="text-gray-400 text-lg">No hay propiedades registradas</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {db.db.properties.map(prop => (
                    <div
                      key={prop.id}
                      className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-blue-500/30 transition"
                      onClick={() => setSelectedPropertyId(prop.id)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">{prop.name}</h3>
                          <p className="text-gray-400 text-sm">{prop.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-blue-400">¥{prop.rent_price_uns.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Objetivo UNS</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedProperty && (
              <div className="bg-gray-900/50 border border-blue-500/30 rounded-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">{selectedProperty.name}</h3>
                  <button
                    onClick={() => setSelectedPropertyId(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <RentManager
                  property={selectedProperty}
                  tenants={selectedTenants}
                  onUpdateTenant={handleUpdateTenant}
                  onDistributeEvenly={handleDistributeEvenly}
                  onAddTenant={handleAddTenant}
                />
              </div>
            )}
          </div>
        )}

        {currentView === 'import' && (
          <ImportView onSyncSuccess={handleSyncSuccess} />
        )}
      </main>

      {/* Toast Container */}
      <ToastContainer notifications={notifications} onRemove={removeNotification} />
    </div>
  );
}

export default App;
