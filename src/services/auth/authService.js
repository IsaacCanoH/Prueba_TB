import { db } from "../../db/indexedDB";
import { encryptData, decryptData } from "../../utils/cryptoUtils";

const API_URL = "https://backend-node-9ax3.onrender.com/api/auth";

export const login = async (username, password) => {
  try {
    const userInfo = await loginOnline(username, password);
    await saveLocalSession(username, password, userInfo);

    return { success: true, user: userInfo };

  } catch {
    console.warn("Fallo conexión online. Intentando login offline...");
    return await loginOffline(username, password);
  }
};

const loginOnline = async (username, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario: username, clave_acceso: password }),
  });

  const json = await response.json();
  const data = Array.isArray(json) ? json[0] : json;

  if (response.ok && data.status === "success" && data.data) {
    return data.data;
  }

  throw new Error(data.error || "Credenciales inválidas (online)");
};

const saveLocalSession = async (username, password, userInfo) => {
  localStorage.setItem("usuario", JSON.stringify(userInfo));

  await db.usuarios.put({
    usuario: username,
    credentials: encryptData({ usuario: username, password }),
    data: encryptData(userInfo),
  });
};

const loginOffline = async (username, password) => {
  try {
    const stored = await db.usuarios.get(username);
    if (!stored) {
      return { success: false, error: "No hay datos locales para este usuario." };
    }

    const creds = decryptData(stored.credentials);
    if (!creds || creds.usuario !== username || creds.password !== password) {
      return { success: false, error: "Credenciales incorrectas (offline)" };
    }

    const localUser = { ...decryptData(stored.data), offline: true };
    localStorage.setItem("usuario", JSON.stringify(localUser));

    return { success: true, user: localUser };

  } catch (err) {
    console.error("Error en login offline:", err.message);
    return { success: false, error: "Fallo al intentar login offline." };
  }
};
