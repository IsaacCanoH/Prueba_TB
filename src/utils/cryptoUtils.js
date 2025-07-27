import CryptoJS from "crypto-js";
import { getLocalKey } from "./claveLocalService";

// Obtiene la clave única del dispositivo
const BASE_KEY = getLocalKey();

// Deriva claves distintas para AES y HMAC de la misma clave base
const SECRET_KEY = BASE_KEY; 
const HMAC_KEY = BASE_KEY.split('').reverse().join(''); 

export const encryptData = (data) => {
    const strData = JSON.stringify(data);

    // Cifrado AES
    const ciphertext = CryptoJS.AES.encrypt(strData, SECRET_KEY).toString();

    // HMAC para "integridad"
    const hmac = CryptoJS.HmacSHA256(ciphertext, HMAC_KEY).toString();

    // Devuelve un objeto seguro
    return JSON.stringify({
        ciphertext,
        hmac
    });
};

export const decryptData = (stored) => {
    try {
        const { ciphertext, hmac } = JSON.parse(stored);

        // Verificar integridad antes de descifrar
        const recalculatedHmac = CryptoJS.HmacSHA256(ciphertext, HMAC_KEY).toString();

        if (hmac !== recalculatedHmac) {
            throw new Error("Integridad comprometida");
        }

        // Descifrar
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        if (!decrypted) {
            throw new Error("Error al descifrar: datos corruptos o clave incorrecta.");
        }

        return JSON.parse(decrypted);
    } catch (error) {
        console.error("Error al descifrar o verificar los datos:", error.message);
        return null;
    }
};
