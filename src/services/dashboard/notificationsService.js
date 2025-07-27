import { db } from "../../db/indexedDB";
import { encryptData, decryptData } from "../../utils/cryptoUtils";
import { saveSecureData } from "../security/saveDataService";

const API_URL = "http://localhost:3000/api/notificacion";

// Crea una notificación en el backend.
export const createNotificationApi = async (data) => {
  try {
    const response = await fetch(`${API_URL}/crear-notificacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const contentType = response.headers.get("Content-Type");

    if (!response.ok) {
      const errorText = contentType?.includes("application/json")
        ? (await response.json())?.error || "Error al crear la notificación."
        : await response.text();

      throw new Error(errorText || "Error desconocido al crear la notificación.");
    }

    return await response.json();

  } catch (err) {
    console.error("Error al crear la notificación:", err.message);
    throw err; // deja que lo capture el contexto
  }
};

// Obtiene todas las notificaciones de un usuario.
export const getNotificationsByUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/${userId}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al obtener las notificaciones.");
    }

    return await response.json();

  } catch (err) {
    console.error("Error al obtener notificaciones:", err);
    return [];
  }
};

// Marca una notificación como leída en el backend.
export const markNotificationAsReadApi = async (notificationId) => {
  try {
    const response = await fetch(`${API_URL}/leer/${notificationId}`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al marcar la notificación como leída.");
    }

    return await response.json();

  } catch (err) {
    console.error("Error al marcar notificación como leída:", err);
    throw err;
  }
};

export const markNotificationAsViewApi = async (notificationId) => {
  try {
    const response = await fetch(`${API_URL}/vista/${notificationId}`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al marcar la notificación como vista.");
    }

    return await response.json();

  } catch (err) {
    console.error("Error al marcar notificación como vista:", err);
    throw err;
  }
};

// Guarda notificaciones cifradas en IndexedDB
export const saveNotificationsOffline = async (notificaciones) => {
  try {
    const encrypted = notificaciones.map(n => ({
      notificacion_id: n.notificacion_id,
      usuario_id: n.usuario_id,
      encrypted: encryptData(n)
    }));

    await db.notificaciones.bulkPut(encrypted);
  } catch (err) {
    console.error("Error al guardar notificaciones offline:", err);
  }
};

// Obtiene y desencripta las notificaciones del usuario
export const getNotificationsOfflineByUser = async (userId) => {
  try {
    const rows = await db.notificaciones
      .where("usuario_id")
      .equals(userId)
      .toArray();

    return rows
      .map(r => decryptData(r.encrypted))
      .filter(Boolean);

  } catch (err) {
    console.error("Error al obtener notificaciones offline:", err);
    return [];
  }
};

// Crear notificaciones nuevas en tabla encryptedData en IndexDB
export const createNotificationOffline = async (notification) => {
  try {
    const timestamp = Date.now();

    await saveSecureData(`notificacion-${timestamp}`, notification);
  } catch (err) {
    console.error("Error al guardar notificacion offline:", err);
    throw err;
  }
}

// Obtiene todas las notificaciones pendientes (almacenadas en encryptedData)
export const getPendingNotificationsOffline = async () => {
  try {
    const rows = await db.encryptedData
      .where("type")
      .startsWith("notificacion-")
      .toArray();

    return rows
      .map(r => {
        const decrypted = decryptData(r.data);
        return decrypted
          ? {
            ...decrypted,
            notificacion_id: r.id,
            leida: false,
            fecha_creacion: decrypted.fecha_creacion || new Date(r.savedAt).toISOString()
          }
          : null;
      })
      .filter(Boolean);


  } catch (err) {
    console.error("Error al obtener notificaciones pendientes offline:", err);
    return [];
  }
};




