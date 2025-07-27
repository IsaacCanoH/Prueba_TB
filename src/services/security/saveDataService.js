import { db } from "../../db/indexedDB";
import { nanoid } from "nanoid";
import { encryptData, decryptData } from "../../utils/cryptoUtils";

// Guarda un objeto cifrado en IndexedDB.
export const saveSecureData = async (type, object) => {
  try {
    await db.encryptedData.add({
      id: nanoid(),
      type,
      data: encryptData(object),
      savedAt: new Date(),
    });

  } catch (err) {
    console.error("Error al guardar dato seguro:", err);
    throw err;
  }
};

// Obtiene un objeto cifrado desde IndexedDB y lo descifra.
export const getSecureData = async (type) => {
  try {
    const record = await db.encryptedData.where("type").equals(type).first();
    if (!record) return null;

    return decryptData(record.data);

  } catch (err) {
    console.error("Error al obtener dato seguro:", err);
    throw err;
  }
};

// Elimina un objeto cifrado de IndexedDB por id.
export const deleteSecureData = async (id) => {
  try {
    await db.encryptedData.delete(id);
  } catch (err) {
    console.error("Error al eliminar dato seguro:", err);
    throw err;
  }
};
