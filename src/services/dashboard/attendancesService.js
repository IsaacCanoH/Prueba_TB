import { db } from "../../db/indexedDB";
import { encryptData, decryptData } from "../../utils/cryptoUtils";
import { saveSecureData } from "../security/saveDataService";

const API_URL = 'https://backend-node-9ax3.onrender.com/api/asistencias';

export const createAttendance = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/registrar-asistencia`, {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get('Content-Type');

    if (!response.ok) {
      const errorText = contentType?.includes('application/json')
        ? (await response.json()).error || 'Error al crear la asistencia.'
        : await response.text();

      throw new Error(errorText || "Error desconocido al crear la asistencia.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error al crear la asistencia:", err.message);
    throw err;
  }
}

export const getAttendancesByUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/obtener-asistencia/${userId}`);
    const result = await response.json();

    if (response.ok && result.status === "success") {
      return result.data;
    }

    console.error("Error en respuesta:", result);
    return [];

  } catch (err) {
    console.error("Error al obtener asistencias online:", err);
    return [];
  }
};

// Guarda asistencias de forma cifrada en IndexedDB.
export const saveAttendancesOffline = async (attendances) => {
  try {
    const encryptedAttendances = attendances.map(attendance => ({
      id: attendance.id,
      usuario_id: attendance.usuario_id,
      data_cifrada: encryptData(attendance),
    }));

    await db.asistencias.clear();
    await db.asistencias.bulkAdd(encryptedAttendances);

  } catch (err) {
    console.error("Error al guardar asistencias offline:", err);
  }
};

// Obtiene asistencias cifradas desde IndexedDB y las descifra.
export const getAttendancesOffline = async (userId) => {
  try {
    const records = await db.asistencias
      .where("usuario_id")
      .equals(userId)
      .toArray();

    return records
      .map(item => decryptData(item.data_cifrada))
      .filter(attendance => attendance !== null);

  } catch (err) {
    console.error("Error al obtener asistencias offline:", err);
    return [];
  }
};

export const saveAttendanceOffline = async (attendance) => {
  try {
    const timestamp = new Date();
    await saveSecureData(`asistencia-pendiente-${timestamp}`, attendance);
  } catch (error) {
    console.error("Error al guardar asiste offline:", err);
    throw err;
  }
}