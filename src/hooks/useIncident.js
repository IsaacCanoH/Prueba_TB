import { useState } from "react";
import { createIncident, saveIncidentOffline } from "../services/dashboard/incidentsService";
import { useToast } from "../context/ToastContext";
import { useNotifications } from "../context/NotificationContext";
import { useLoader } from "../context/LoaderContext";
import { fileToBase64 } from "../utils/fileUtils";

export const useIncident = (usuario) => {
  const { showSuccess, showError, showInfo } = useToast();
  const { createNotification } = useNotifications();
  const { showLoader, hideLoader } = useLoader();

  const [showIncidentModal, setShowIncidentModal] = useState(false);

  const [incidentForm, setIncidentForm] = useState({
    tipo: "",
    descripcion: "",
    fecha_incidencia: "",
    evidencias: [],
  });

  const handleIncidentChange = (e) => {
    const { name, value } = e.target;
    setIncidentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setIncidentForm(prev => ({
      ...prev,
      evidencias: [...prev.evidencias, ...files],
    }));
  };

  const handleSubmitIncident = async (e) => {
    e.preventDefault();
    showLoader("Registrando incidencia...");

    try {
      if (!usuario?.user?.empleado_id) {
        showError("Error: El usuario no tiene un empleado_id definido.");
        hideLoader();
        return;
      }

      const incidentData = await prepareIncidentData(usuario, incidentForm);
      const formData = prepareFormData(usuario, incidentForm);

      if (navigator.onLine) {
        await sendIncidentOnline(formData, usuario, incidentForm, createNotification, showSuccess, showInfo);
      } else {
        await saveIncidentOffline(incidentData);

        await createNotification({
          usuario_id: usuario?.user?.empleado_id,
          titulo: "Incidencia registrada",
          mensaje: "Incidencia creada correctamente, se enviará cuando exista conexión.",
          tipo: "alerta",
          fecha_creacion: new Date().toISOString(),
          metadata: {
            descripcion: incidentForm.descripcion,
            fecha: incidentForm.fecha_incidencia,
          },
        });

        showInfo("Incidencia almacenada localmente. Se sincronizará cuando haya conexión.");
      }

      clearForm();

    } catch (err) {
      console.error(err);
      showError("Error al registrar la incidencia.");
    } finally {
      hideLoader();
    }
  };

  const clearForm = () => {
    setShowIncidentModal(false);
    setIncidentForm({
      tipo: "",
      descripcion: "",
      fecha_incidencia: "",
      evidencias: [],
    });
  };

  return {
    showIncidentModal,
    setShowIncidentModal,
    incidentForm,
    handleIncidentChange,
    handleFileUpload,
    handleSubmitIncident,
  };
};

const prepareIncidentData = async (usuario, form) => {
  const evidences = form.evidencias.length > 0
    ? await Promise.all(
      form.evidencias.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        content: await fileToBase64(file),
      }))
    )
    : [];

  return {
    usuario_id: usuario?.user?.empleado_id,
    tipo_incidencia: form.tipo,
    descripcion: form.descripcion,
    fecha_incidencia: form.fecha_incidencia,
    evidencias: evidences,
  };
};

const prepareFormData = (usuario, form) => {
  const formData = new FormData();
  formData.append("usuario_id", usuario?.user?.empleado_id);
  formData.append("tipo_incidencia", form.tipo);
  formData.append("descripcion", form.descripcion);
  formData.append("fecha_incidencia", form.fecha_incidencia);

  form.evidencias.forEach(file => {
    formData.append("archivos", file);
  });

  return formData;
};

const sendIncidentOnline = async (formData, usuario, form, createNotification, showSuccess, showInfo) => {
  try {
    await createIncident(formData);

    await createNotification({
      usuario_id: usuario?.user?.empleado_id,
      titulo: "Incidencia registrada",
      mensaje: "Incidencia enviada correctamente.",
      tipo: "exito",
      metadata: {
        descripcion: form.descripcion,
        fecha: form.fecha_incidencia,
      },
    });

    showSuccess("Incidencia registrada correctamente.");

  } catch (err) {
    console.warn("Error al enviar incidencia, almacenando localmente:", err.message);

    const incidentData = await prepareIncidentData(usuario, form);
    await saveIncidentOffline(incidentData);

    await createNotification({
      usuario_id: usuario?.user?.empleado_id,
      titulo: "Incidencia registrada",
      mensaje: "Incidencia creada correctamente, se enviará cuando exista conexión.",
      tipo: "alerta",
      fecha_creacion: new Date().toISOString(),
      metadata: {
        descripcion: form.descripcion,
        fecha: form.fecha_incidencia,
      },
    });

    showInfo("Incidencia almacenada localmente. Se sincronizará cuando haya conexión.");
  }
};
