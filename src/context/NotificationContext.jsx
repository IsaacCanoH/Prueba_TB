import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Bell, Info, AlertTriangle } from "lucide-react";
import {
  createNotificationApi,
  getNotificationsByUser,
  markNotificationAsReadApi,
  markNotificationAsViewApi,
  saveNotificationsOffline,
  getNotificationsOfflineByUser,
  createNotificationOffline,
  getPendingNotificationsOffline,
} from "../services/dashboard/notificationsService";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const notificationRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.leida).length;

  // Cierra el panel al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const fetchNotifications = useCallback(async (userId, isOffline) => {
    try {
      setLoading(true);
      let data = [];

      if (isOffline) {
        console.log("Modo offline: obteniendo notificaciones locales");

        const offlineGuardadas = await getNotificationsOfflineByUser(userId);
        const pendientes = await getPendingNotificationsOffline();

        data = [...pendientes, ...offlineGuardadas];

      } else {
        console.log("Modo online: obteniendo notificaciones de la API");
        data = await getNotificationsByUser(userId);
        await saveNotificationsOffline(data);
      }

      const hidden = getHiddenNotifications();
      const visible = data.filter(n => !hidden.includes(n.notificacion_id));

      setNotifications(visible);

    } catch (err) {
      console.error("Error al obtener notificaciones:", err);
    } finally {
      setLoading(false);
    }
  }, []);


  // Crea una nueva notificación y la añade al estado
  // Crea una nueva notificación con fallback offline
  const createNotification = useCallback(async (data) => {
    try {
      const newNotification = await createNotificationApi(data);
      setNotifications(prev => [newNotification, ...prev]);
    } catch {
      console.warn("Fallo conexión al crear notificación. Guardando offline...");

      try {
        const timestamp = new Date().toISOString();

        const offlineNotif = {
          ...data,
          notificacion_id: `offline-${Date.now()}`,
          leida: false,
          fecha_creacion: timestamp
        };

        await createNotificationOffline(offlineNotif);
        setNotifications(prev => [offlineNotif, ...prev]);
        
      } catch (offlineErr) {
        console.error("Error al guardar notificación offline:", offlineErr);
      }
    }
  }, []);


  // Marca una notificación como leída
  const markAsRead = useCallback(async (id) => {
    try {
      await markNotificationAsReadApi(id);
      setNotifications(prev =>
        prev.map(n => n.notificacion_id === id ? { ...n, leida: true } : n)
      );
    } catch (err) {
      console.error("Error al marcar como leída:", err);
    }
  }, []);

  // Marca todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const unread = notifications.filter(n => !n.leida);

      await Promise.all(
        unread.map(n => markNotificationAsReadApi(n.notificacion_id).catch(err =>
          console.error(`Error al marcar como leída ${n.notificacion_id}:`, err)
        ))
      );

      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err);
    }
  }, [notifications]);

  // Oculta una notificación (soft delete)
  const deleteNotification = useCallback(async (id) => {
    try {
      await markNotificationAsViewApi(id);
      setNotifications(prev => prev.filter(n => n.notificacion_id !== id));
    } catch (err) {
      console.error("Error al marcar notificación como vista:", err);
    }
  }, []);

  // Obtiene el icono asociado al tipo
  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case "exito": return <CheckCircle size={18} className="text-success" />;
      case "alerta": return <AlertTriangle size={18} className="text-warning" />;
      case "error": return <XCircle size={18} className="text-danger" />;
      case "general": return <Info size={18} className="text-info" />;
      default: return <Bell size={18} className="text-muted" />;
    }
  };

  // Color del badge
  const getNotificationBadgeColor = (tipo) => {
    switch (tipo) {
      case "exito": return "bg-success";
      case "alerta": return "bg-warning";
      case "error": return "bg-danger";
      case "general": return "bg-info";
      default: return "bg-secondary";
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notificationRef,
        showNotifications,
        setShowNotifications,
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        createNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        getNotificationIcon,
        getNotificationBadgeColor,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

// Ocultar notificaciones soft delete
const getHiddenNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem("hiddenNotifications")) || [];
  } catch {
    return [];
  }
};
