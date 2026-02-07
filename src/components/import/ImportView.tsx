/**
 * COMPONENTE: ImportView
 * Centro de sincronización con validación mejorada
 */

import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useExcelImport } from '../../hooks/useExcelImport';
import { useNotifications } from '../../hooks/useNotifications';

interface ImportViewProps {
  onSyncSuccess: (data: any) => void;
}

export const ImportView: React.FC<ImportViewProps> = ({ onSyncSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importData, setImportData] = useState<any>(null);
  const [errors, setErrors] = useState<Array<{ row: number; field: string; message: string }>>([]);

  const { processFile, isLoading } = useExcelImport();
  const { loading, success, error: errorNotify, warning } = useNotifications();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length) {
      await processExcelFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      processExcelFile(files[0]);
    }
  };

  const processExcelFile = async (file: File) => {
    // Validar extensión
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xlsm')) {
      errorNotify('Formato inválido', 'Solo se aceptan archivos .xlsx y .xlsm');
      return;
    }

    setImportStatus('loading');
    const loader = loading('Analizando archivo Excel...');

    try {
      const result = await processFile(file);

      if (result.success && result.data) {
        setImportStatus('success');
        setImportData(result.data);
        setErrors(result.errors);

        success('Archivo validado', 'Excel procesado correctamente');

        // Mostrar errores no-bloqueantes si existen
        if (result.errors.length > 0) {
          warning(
            'Validación parcial',
            `${result.errors.length} advertencia(s) encontrada(s)`,
            { duration: 6000 }
          );
        }
      } else {
        setImportStatus('error');
        setErrors(result.errors);
        errorNotify('Error de validación', result.summary);
      }
    } catch (err) {
      setImportStatus('error');
      errorNotify(
        'Error al procesar',
        err instanceof Error ? err.message : 'Error desconocido'
      );
    } finally {
      loader.remove();
    }
  };

  const handleSync = () => {
    if (importData) {
      onSyncSuccess(importData);
      setImportStatus('idle');
      setImportData(null);
      setErrors([]);
      success('Sincronización exitosa', 'Datos importados correctamente');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col items-center justify-center py-10">
        <h2 className="text-3xl font-black text-white mb-2">Centro de Sincronización</h2>
        <p className="text-gray-500 max-w-md text-center">
          Importa tus archivos Excel maestros para actualizar la base de datos con validación avanzada.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="relative overflow-hidden rounded-3xl border-dashed border-2 border-gray-700 bg-transparent p-10 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />

        <input
          type="file"
          id="fileUpload"
          className="hidden"
          onChange={handleFileChange}
          accept=".xlsx, .xlsm"
          disabled={isLoading}
        />

        <label
          htmlFor="fileUpload"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center h-64 cursor-pointer transition-all duration-300 rounded-2xl relative z-10 ${
            isDragging ? 'scale-105' : ''
          }`}
        >
          {isLoading ? (
            <div className="animate-pulse flex flex-col items-center gap-4">
              <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
              <p className="text-blue-500 font-bold text-2xl">Procesando Datos...</p>
            </div>
          ) : importStatus === 'success' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <FileCheck className="w-12 h-12 text-green-400" />
              </div>
              <div>
                <p className="text-green-400 font-bold text-3xl">Archivo Validado</p>
                <p className="text-gray-400 mt-2 text-lg">Listo para sincronizar</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 group">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500 shadow-2xl border border-white/5 group-hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  Arrastra tu Excel aquí
                </p>
                <p className="text-sm text-gray-500">Soporta formato .xlsx y .xlsm</p>
              </div>
            </div>
          )}
        </label>
      </div>

      {/* Error Display */}
      {importStatus === 'error' && (
        <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-2xl text-red-200 flex items-start gap-4 animate-in fade-in shadow-lg">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold mb-2">Errores de Validación</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {errors.slice(0, 10).map((err, idx) => (
                <div key={idx} className="text-sm opacity-90">
                  <span className="font-mono">Fila {err.row}</span>: {err.message}
                </div>
              ))}
              {errors.length > 10 && (
                <p className="text-xs opacity-60">
                  + {errors.length - 10} errores más...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation */}
      {importStatus === 'success' && importData && (
        <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-8 shadow-2xl animate-in slide-in-from-bottom-10">
          <div className="flex items-start gap-6">
            <div className="bg-green-500/20 p-4 rounded-xl">
              <FileCheck className="w-8 h-8 text-green-500" />
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-3">
                Confirmación de Importación
              </h3>

              {/* Resumen */}
              <div className="bg-black/50 p-6 rounded-xl border border-white/5 mb-8 space-y-3">
                {importData.employees && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Empleados a importar:</span>
                    <span className="text-green-400 font-bold">{importData.employees.length}</span>
                  </div>
                )}
                {importData.properties && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Propiedades:</span>
                    <span className="text-green-400 font-bold">{importData.properties.length}</span>
                  </div>
                )}
                {importData.tenants && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Inquilinos:</span>
                    <span className="text-green-400 font-bold">{importData.tenants.length}</span>
                  </div>
                )}

                {errors.length > 0 && (
                  <div className="pt-3 border-t border-yellow-500/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-yellow-200">
                      {errors.length} advertencia(s) - Revisión recomendada
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSync}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:shadow-green-500/20 text-lg"
              >
                <span>Ejecutar Sincronización</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
