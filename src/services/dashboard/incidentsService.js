import { saveSecureData } from '../security/saveDataService';

const API_URL = "http://localhost:3000/api/inicidencia";

export const createIncident = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/crear-incidencia`, {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get('Content-Type');

    if (!response.ok) {
      const errorText = contentType?.includes('application/json')
        ? (await response.json()).error || 'Error al crear la incidencia.'
        : await response.text();

      throw new Error(errorText || "Error desconocido al crear la incidencia.");
    }

    return await response.json();

  } catch (err) {
    console.error("Error al crear la incidencia:", err.message);
    throw err;
  }
};

// Guarda una incidencia cifrada en IndexedDB para sincronización offline.
export const saveIncidentOffline = async (incident) => {
  try {
    const timestamp = Date.now();
    await saveSecureData(`incidencia-pendiente-${timestamp}`, incident);
  } catch (err) {
    console.error("Error al guardar incidencia offline:", err);
    throw err;
  }
}