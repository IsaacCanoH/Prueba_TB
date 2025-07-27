import { useEffect, useRef, useCallback } from "react";
import { syncPendingData } from "../../services/synchronizationData/syncDispatcher";
import { useToast } from "../../context/ToastContext";

export const useSyncData = () => {
  const { showSuccess, showError } = useToast(); 
  const handlerRef = useRef(); 
  const alreadySynced = useRef(false); 

  // Función que ejecuta la sincronización de datos pendientes
  const sync = useCallback(async () => {
    try {
      const count = await syncPendingData(); 
      if (count > 0) {
        showSuccess(`Se sincronizaron ${count} dato(s) pendiente(s).`);
      }
    } catch (err) {
      console.error("Error al sincronizar datos:", err.message);
      showError("Error al sincronizar datos pendientes.");
    }
  }, [showSuccess, showError]);

  useEffect(() => {
    handlerRef.current = sync;
  }, [sync]);

  // Detecta cuando el dispositivo está online y ejecuta la sincronización automáticamente
  useEffect(() => {
    const handler = () => {
      if (!alreadySynced.current) {
        alreadySynced.current = true;
        if (handlerRef.current) handlerRef.current(); 
      }
    };

    if (navigator.onLine) { // Si ya está online al cargar, sincroniza inmediatamente
      handler();
    }

    window.addEventListener("online", handler); // Escucha evento "online" del navegador

    return () => {
      window.removeEventListener("online", handler); 
    };
  }, []);
};
