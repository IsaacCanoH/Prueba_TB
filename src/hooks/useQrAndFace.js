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
import { createAttendance } from "../services/dashboard/attendancesService";

export const useQrAndFace = (usuario, attendanceHistory = []) => {
  const { showSuccess, showError } = useToast();
  const { getCoordinates } = useGeolocation();
  const { showLoader, hideLoader } = useLoader();

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
        showError("El c贸digo QR escaneado no es v谩lido para esta sede.");
        return;
      }

      if (!workInfo?.lat || !workInfo?.lng) {
        showError("No se pudo obtener la ubicaci贸n esperada.");
        return;
      }

      showLoader("Obteniendo ubicaci贸n precisa...");

      const currentCoords = await getCoordinates();
      const distance = getDistanceInMeters(
        parseFloat(workInfo.lat),
        parseFloat(workInfo.lng),
        currentCoords.latitude,
        currentCoords.longitude
      );

      hideLoader();

      if (distance <= 100) {
        console.log("Ubicaci贸n validada correctamente (antes de facial)");
        setQrDetectado(qrText);
        setShowFaceModal(true);
      } else {
        showError("Est谩s fuera del rango de la ubicaci贸n esperada.");
      }

    } catch (err) {
      console.error("Error obteniendo ubicaci贸n:", err.message);
      showError("No se pudo obtener la ubicaci贸n actual.");
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
      formData.append("fecha_hora_registro", getLocalISOString(now)); // 馃憟 HORA LOCAL
      formData.append("ubicacion_lat", latitude.toString());
      formData.append("ubicacion_lon", longitude.toString());

      console.log("FORM DATA ENVIADO:", Object.fromEntries(formData));

      await createAttendance(formData);

      showSuccess(`Asistencia registrada correctamente como ${tipo}.`);
      setQrDetectado(null);
    } catch (err) {
      console.error("Error registrando asistencia:", err.message);
      showError("No se pudo registrar la asistencia.");
    } finally {
      hideLoader();
    }
  }, [qrDetectado, getCoordinates, usuario, attendanceHistory, showSuccess, showError, hideLoader]);

  const handleFaceFailure = useCallback(() => {
    setShowFaceModal(false);
    setQrDetectado(null);
    showError("Fall贸 la autenticaci贸n facial.");
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