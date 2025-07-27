import { useState, useEffect, useRef } from "react";
import { 
  getAttendancesByUser, 
  saveAttendancesOffline, 
  getAttendancesOffline 
} from "../services/dashboard/attendancesService";

export const useAttendances = (usuario, isOffline) => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [statistics, setStatistics] = useState({});
  const hasFetched = useRef(false);

  useEffect(() => {
    const loadAttendances = async () => {
      if (!usuario || hasFetched.current) return;

      hasFetched.current = true;

      try {
        const data = await fetchAttendanceData(usuario.user.empleado_id, isOffline);
        const history = processAttendanceHistory(data);
        const stats = calculateAttendanceStats(history);

        setAttendanceHistory(history);
        setStatistics(stats);

      } catch (err) {
        console.error("Error al cargar asistencias:", err);
      }
    };

    loadAttendances();

  }, [usuario, isOffline]);

  return {
    attendanceHistory,
    statistics,
  };
};

const fetchAttendanceData = async (employeeId, isOffline) => {
  let data = [];

  if (isOffline) {
    data = await getAttendancesOffline(employeeId);
  } else {
    data = await getAttendancesByUser(employeeId);
    await saveAttendancesOffline(data);
  }

  return data;
};

// Procesa el historial de asistencias, agrupando por día.
const processAttendanceHistory = (attendances) => {
  const grouped = {};

  attendances.forEach((record) => {
    const date = new Date(record.fecha_hora_registro);
    const day = date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const time = `${date.getUTCHours().toString().padStart(2, "0")}:${date
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")}`;

    if (!grouped[day]) {
      grouped[day] = {
        entrada: "",
        salida: "",
        horas: "00:00",
        estado: "",
        fecha: day,
      };
    }

    if (record.tipo === "entrada") {
      if (!grouped[day].entrada || date < new Date(`${day} ${grouped[day].entrada}`)) {
        grouped[day].entrada = time;
        grouped[day].estado = record.condicion;
      }
    }

    if (record.tipo === "salida") {
      if (!grouped[day].salida || date > new Date(`${day} ${grouped[day].salida}`)) {
        grouped[day].salida = time;
      }
    }
  });

  return calculateWorkedHours(Object.values(grouped));
};

// Calcula las horas trabajadas por día.
const calculateWorkedHours = (data) => {
  return data.map((item) => {
    if (item.entrada && item.salida) {
      const [h1, m1] = item.entrada.split(":").map(Number);
      const [h2, m2] = item.salida.split(":").map(Number);

      const entradaDate = new Date(0, 0, 0, h1, m1);
      const salidaDate = new Date(0, 0, 0, h2, m2);
      const diffMs = salidaDate - entradaDate;

      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);

      item.horas = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }

    return item;
  });
};

// Calcula las estadísticas de asistencia.
const calculateAttendanceStats = (history) => {
  const total = history.length;
  const present = history.filter((h) => h.estado === "puntual").length;
  const late = history.filter((h) => h.estado === "retardo").length;
  const absent = history.filter((h) => h.estado === "falta").length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    asistencias: present,
    retardos: late,
    faltas: absent,
    porcentaje: percentage,
  };
};
