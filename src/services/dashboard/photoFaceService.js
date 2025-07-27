import { db } from '../../db/indexedDB';
import { encryptData, decryptData} from '../../utils/cryptoUtils';

const API_URL = 'https://backend-node-9ax3.onrender.com/api/fotosRostros';

// Guarda la foto de rostro y el descriptor facial del usuario en el backend.
export const saveFacePhoto  = async (userId, imagen_base64, descriptor) => {
  try {
    const response = await fetch(`${API_URL}/guardar-foto-rostro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, imagen_base64, descriptor }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al guardar la foto de rostro.');
    }

    return await response.json();

  } catch (err) {
    console.error('Error al guardar la foto de rostro:', err);
    throw err;
  }
};

// Obtiene la foto de rostro y descriptor de un usuario desde el backend.
export const getFacePhoto = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/obtener-foto-rostro/${userId}`);

    if (response.status === 404) {
      return null; 
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al obtener la foto de rostro.');
    }

    const data = await response.json();

    // Guarda el rostro en IndexedDB (seguro)
    await saveLocalFace(userId, data);

    return data;

  } catch (err) {
    console.error('Error al obtener la foto de rostro:', err);
    throw err;
  }
};

// Guarda el rostro en IndexedDB (solo los descargados, no se usa para nuevos)
export const saveLocalFace = async (usuario_id, rostroData) => {
    try {
        const encrypted = encryptData(rostroData);

        await db.rostros.put({
            usuario_id,
            encrypted
        });

    } catch (error) {
        console.error(`Error al guardar rostro localmente para usuario ${usuario_id}:`, error);
        throw error;
    }
};

// Obtiene un rostro del almacenamiento local
export const getLocalFace = async (usuario_id) => {
    try {
        const entry = await db.rostros.get(usuario_id);
        if (!entry) return null;

        return decryptData(entry.encrypted);
    } catch (error) {
        console.error(`Error al obtener rostro localmente para usuario ${usuario_id}:`, error);
        return null;
    }
};