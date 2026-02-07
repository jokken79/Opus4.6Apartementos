/**
 * HOOK: Sistema de Notificaciones
 * Reemplaza alert() con toast persistentes y personalizables
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Notification } from '../types/database';

interface NotificationConfig {
  maxNotifications?: number;
  defaultDuration?: number; // ms
}

export function useNotifications(config: NotificationConfig = {}) {
  const {
    maxNotifications = 5,
    defaultDuration = 4000,
  } = config;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Agregar notificación
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const notify = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    const duration = options?.duration ?? defaultDuration;

    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration: duration > 0 ? duration : undefined,
      action: options?.action,
      timestamp: new Date().toISOString(),
    };

    setNotifications(prev => {
      const updated = [notification, ...prev];
      // Limitar número de notificaciones
      return updated.slice(0, maxNotifications);
    });

    // Auto-remover si tiene duración
    if (duration > 0) {
      const timeout = setTimeout(() => {
        removeNotification(id);
      }, duration);
      timeoutRefs.current.set(id, timeout);
    }

    return id;
  }, [defaultDuration, maxNotifications]);

  /**
   * Remover notificación
   */
  const removeNotification = useCallback((id: string) => {
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * Accesos rápidos
   */
  const success = useCallback((title: string, message: string, options?: any) =>
    notify('success', title, message, options), [notify]);

  const error = useCallback((title: string, message: string, options?: any) =>
    notify('error', title, message, { ...options, duration: options?.duration ?? 6000 }), [notify]);

  const warning = useCallback((title: string, message: string, options?: any) =>
    notify('warning', title, message, options), [notify]);

  const info = useCallback((title: string, message: string, options?: any) =>
    notify('info', title, message, options), [notify]);

  /**
   * Notificación de validación
   */
  const validationError = useCallback((field: string, message: string) =>
    error(`Campo: ${field}`, message), [error]);

  /**
   * Notificación de carga
   */
  const loading = useCallback((message: string) => {
    const id = notify('info', 'Procesando...', message, { duration: -1 });
    return { id, remove: () => removeNotification(id) };
  }, [notify, removeNotification]);

  /**
   * Confirmar acción
   */
  const confirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    const id = notify('warning', title, message, {
      duration: -1, // Persistente
      action: {
        label: 'Confirmar',
        onClick: () => {
          onConfirm();
          removeNotification(id);
        },
      },
    });
  }, [notify, removeNotification]);

  return {
    notifications,
    notify,
    removeNotification,
    success,
    error,
    warning,
    info,
    validationError,
    loading,
    confirm,
    clearAll: () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
      setNotifications([]);
    },
  };
}

/**
 * COMPONENTE: Toast Container
 * Renderiza todas las notificaciones activas
 */
interface ToastContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  onRemove,
}) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-200 [&>svg]:text-green-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-200 [&>svg]:text-red-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200 [&>svg]:text-yellow-400';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-200 [&>svg]:text-blue-400';
    }
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] max-w-md space-y-3 pointer-events-none">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            flex gap-3 items-start p-4 rounded-xl border
            backdrop-blur-md shadow-lg animate-in slide-in-from-top-4
            pointer-events-auto
            ${getStyles(notification.type)}
          `}
        >
          <div className="mt-0.5 flex-shrink-0">
            {getIcon(notification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm mb-0.5 truncate">
              {notification.title}
            </h3>
            <p className="text-xs opacity-90 line-clamp-2">
              {notification.message}
            </p>

            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="text-xs font-bold mt-2 hover:underline"
              >
                {notification.action.label}
              </button>
            )}
          </div>

          <button
            onClick={() => onRemove(notification.id)}
            className="text-xs opacity-60 hover:opacity-100 flex-shrink-0 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
