import { useState, useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { useGeolocation } from "./useGeolocation";
import { getDistanceInMeters } from "../utils/geoUtils";
import { useLoader } from "../context/LoaderContext";
import {
  isWeekday,
  isWithinAllowedTimeRange,
  getPunctualityStatus
} from "../utils/attendanceValidator";
import { createAttendance, saveAttendanceOffline } from "../services/dashboard/attendancesService";
import { useNotifications } from "../context/NotificationContext";

export const useQrAndFace = (usuario, attendanceHistory = []) => {
  const { showSuccess, showError } = useToast();
  const { getCoordinates } = useGeolocation();
  const { showLoader, hideLoader } = useLoader();
  const { createNotification } = useNotifications();

  const [showQRModal, setShowQRModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [qrDetectado, setQrDetectado] = useState(null);

  const handleOpenCamera = useCallback(() => {
    setCameraActive(true);
    setShowQRModal(true);
  }, []);

  const handleCloseCamera = useCallback(() => {
    setCameraActive(false);
    setShowQRModal(false);
  }, []);

  const getTodayAttendanceStatus = () => {
    const today = new Date();
    const todayString = today.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const todayRecord = attendanceHistory.find((a) => a.fecha === todayString);
    if (!todayRecord) return { entrada: false, salida: false };

    return {
      entrada: Boolean(todayRecord.entrada),
      salida: Boolean(todayRecord.salida),
    };
  };

  const getLocalISOString = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, -1);
  };

  const handleScanSuccess = useCallback(async (qrText) => {
    console.log("QR detectado:", qrText);
    setShowQRModal(false);
    setCameraActive(false);

    if (!isWeekday()) {
      showError("Solo puedes registrar asistencias de lunes a viernes.");
      return;
    }

    if (!isWithinAllowedTimeRange()) {
      showError("Fuera del horario permitido");
      return;
    }

    const status = getTodayAttendanceStatus();
    if (status.entrada && status.salida) {
      showError("Ya registraste entrada y salida hoy.");
      return;
    }

    try {
      const workInfo = usuario?.work_info;

      if (qrText !== workInfo?.block_key_qr) {
        showError("El código QR escaneado no es válido para esta sede.");
        return;
      }

      if (!workInfo?.lat || !workInfo?.lng) {
        showError("No se pudo obtener la ubicación esperada.");
        return;
      }

      showLoader("Obteniendo ubicación precisa...");

      const currentCoords = await getCoordinates();
      const distance = getDistanceInMeters(
        parseFloat(workInfo.lat),
        parseFloat(workInfo.lng),
        currentCoords.latitude,
        currentCoords.longitude
      );

      hideLoader();

      if (distance <= 100) {
        console.log("Ubicación validada correctamente (antes de facial)");
        setQrDetectado(qrText);
        setShowFaceModal(true);
      } else {
        showError("Estás fuera del rango de la ubicación esperada.");
      }

    } catch (err) {
      console.error("Error obteniendo ubicación:", err.message);
      showError("No se pudo obtener la ubicación actual.");
    }
  }, [usuario, getCoordinates, showError]);

  const handleFaceSuccess = useCallback(async () => {
    setShowFaceModal(false);
    if (!qrDetectado) return;

    try {
      showLoader("Registrando asistencia...");

      const now = new Date();
      const status = getTodayAttendanceStatus();
      const tipo = status.entrada ? "salida" : "entrada";

      const schedule = usuario?.schedule;
      const condicion = tipo === "entrada"
        ? getPunctualityStatus(now, schedule)
        : "puntual";

      const { latitude, longitude } = await getCoordinates();

      const formData = new FormData();
      formData.append("usuario_id", usuario?.user?.empleado_id);
      formData.append("tipo", tipo);
      formData.append("condicion", condicion);
      formData.append("fecha_hora_registro", getLocalISOString(now));
      formData.append("ubicacion_lat", latitude.toString());
      formData.append("ubicacion_lon", longitude.toString());

      try {
        const result = await createAttendance(formData);

        if (!result || result.status !== "success") {
          throw new Error("Respuesta inesperada del servidor.");
        }

        const capitalizeFirst = tipo.charAt(0).toUpperCase() + tipo.slice(1);

        try {
          await createNotification({
            usuario_id: usuario?.user?.empleado_id,
            titulo: "Asistencia Registrada",
            mensaje: `${capitalizeFirst} del día registrada correctamente`,
            tipo: "exito",
            metadata: {
              tipo_asistencia: tipo,
              condicion,
              fecha_hora: getLocalISOString(now),
              ubicacion: {
                lat: latitude,
                lon: longitude,
              },
              sede: usuario?.work_info?.office_name,
              horario: usuario?.schedule || null,
            }
          });
        } catch (notifErr) {
          console.warn("No se pudo guardar la notificación:", notifErr.message);
        }

        showSuccess(`Asistencia registrada correctamente como ${tipo}.`);

      } catch (err) {
        console.warn("Error enviando asistencia. Guardando offline:", err.message);

        const offlineData = {
          usuario_id: usuario?.user?.empleado_id,
          tipo,
          condicion,
          fecha_hora_registro: getLocalISOString(now),
          ubicacion_lat: latitude.toString(),
          ubicacion_lon: longitude.toString(),
        };

        try {
          await saveAttendanceOffline(offlineData);
        } catch (offlineErr) {
          console.warn("Error guardando asistencia offline:", offlineErr.message);
        }

        try {
          await createNotification({
            usuario_id: usuario?.user?.empleado_id,
            titulo: "Asistencia Pendiente",
            mensaje: `No se pudo enviar la ${tipo}, se sincronizará luego.`,
            tipo: "alerta",
            fecha_creacion: new Date().toISOString(),
            metadata: offlineData,
          });
        } catch (notifErr) {
          console.warn("Error creando notificación offline:", notifErr.message);
        }

        showSuccess(`Asistencia ${tipo} almacenada localmente. Se enviará cuando haya conexión.`);
      }

      setQrDetectado(null);
    } catch (err) {
      console.error("Error general registrando asistencia:", err.message);
      showError("No se pudo registrar la asistencia.");
    } finally {
      hideLoader();
    }
  }, [qrDetectado, getCoordinates, usuario, attendanceHistory, showSuccess, showError, hideLoader]);

  const handleFaceFailure = useCallback(() => {
    setShowFaceModal(false);
    setQrDetectado(null);
    showError("Falló la autenticación facial.");
  }, [showError]);

  return {
    showQRModal,
    showFaceModal,
    cameraActive,
    handleOpenCamera,
    handleCloseCamera,
    handleScanSuccess,
    handleFaceSuccess,
    handleFaceFailure,
    setShowQRModal,
  };
};
