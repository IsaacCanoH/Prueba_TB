const DEVICE_KEY_STORAGE = "081c3d20e1d28ac253afb732b71621881ff5adc1af94bf6efe299b70f1936f63";

// Genera una clave aleatoria segura en hexadecimal
const generateLocalKey = () => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Obtiene la clave local única del dispositivo
// Si no existe, la genera y la guarda
export const getLocalKey = () => {
    let key = localStorage.getItem(DEVICE_KEY_STORAGE);
    if (!key) {
        key = generateLocalKey();
        localStorage.setItem(DEVICE_KEY_STORAGE, key);
    }
    return key;
};

// Forzar la regeneración de la clave
export const resetLocalKey = () => {
    localStorage.removeItem(DEVICE_KEY_STORAGE);
};
