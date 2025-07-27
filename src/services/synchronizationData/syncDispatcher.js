import { db } from "../../db/indexedDB";
import { decryptData } from "../../utils/cryptoUtils";
import { deleteSecureData } from "../security/saveDataService";
import { createIncident } from "../dashboard/incidentsService";
import { dataURLtoBlob } from "../../utils/fileUtils";
import { createNotificationApi } from "../dashboard/notificationsService";

const SYNC_HANDLERS = {
  "incidencia-pendiente": async (record) => {
    const incident = decryptData(record.data);

    const formData = new FormData();
    formData.append("usuario_id", incident.usuario_id);
    formData.append("tipo_incidencia", incident.tipo_incidencia);
    formData.append("descripcion", incident.descripcion);
    formData.append("fecha_incidencia", incident.fecha_incidencia);

    incident.evidencias.forEach(evidence => {
      const blob = dataURLtoBlob(evidence.content);
      const file = new File([blob], evidence.name, { type: evidence.type });
      formData.append("archivos", file);
    });

    await createIncident(formData);
  },

  "notificacion-pendiente": async (record) => {
    const notification = decryptData(record.data);
    await createNotificationApi(notification);
  },

};

// Sincroniza todos los datos pendientes almacenados en IndexedDB.
// Procesa cada registro orrespondiente según su tipo.
export const syncPendingData = async () => {
  try {
    const pending = await db.encryptedData.toArray();
    let synced = 0;

    for (const record of pending) {
      const baseType = record.type.split("-").slice(0, 2).join("-");

      const handler = SYNC_HANDLERS[baseType];

      if (!handler) {
        console.warn(`No existe handler para el tipo: ${baseType}`);
        continue;
      }

      try {
        await handler(record);
        await deleteSecureData(record.id);
        synced++;
        console.log(`Sincronizado correctamente: ${record.type}`);
      } catch (err) {
        console.error(`Error al sincronizar ${record.type}:`, err.message);
      }
    }

    return synced;

  } catch (err) {
    console.error("Error en la sincronización general:", err);
    throw err;
  }
};
