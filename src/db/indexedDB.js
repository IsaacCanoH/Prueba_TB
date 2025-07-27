import Dexie from "dexie";

export const db = new Dexie('INAEBA_LOCAL');

db.version(4).stores({
    usuarios: "usuario, credentials, data",
    asistencias: "++id,usuario_id,fecha_hora_registro",
    notificaciones: "notificacion_id, usuario_id, encrypted",
    rostros: "usuario_id, encrypted",
    encryptedData: "id, type, savedAt"
})