import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/Empleado/DashboardHeader";
import DashboardTabs from "../components/Empleado/DashboardTabs";
import QRModal from "../components/Empleado/QRModal";
import IncidentModal from "../components/Empleado/IncidentModal";
import FaceRecognitionModal from "../components/Empleado/FaceRecognitionModal";
import styles from "../styles/dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";

// Contextos y hooks personalizados
import { useNotifications } from "../context/NotificationContext";
import { useQrAndFace } from "../hooks/useQrAndFace";
import { useIncident } from "../hooks/useIncident";
import { useAttendances } from "../hooks/useAttendances";
import useAutoLogout from "../hooks/useAutoLogout";
import { useSyncData } from "../hooks/synchronizationData/useSyncDatos";

const DashboardPage = () => {
  const navigate = useNavigate();

  useAutoLogout(10 * 60 * 1000);
  useSyncData();

  //-------------------- Autenticación --------------------
  const storedUser = localStorage.getItem("usuario");
  const usuario = storedUser ? JSON.parse(storedUser) : null;
  // const usuario = usuarioData?.user;
  const isOffline = usuario?.offline === true;

  useEffect(() => {
    if (!usuario) {
      navigate("/login", { replace: true });
    }
  }, [usuario, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/login");
  };


  //-------------------- Notificaciones --------------------
  const {
    notificationRef,
    showNotifications,
    setShowNotifications,
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon,
    getNotificationBadgeColor,
  } = useNotifications();


  useEffect(() => {
    if (usuario?.user?.empleado_id) {
      fetchNotifications(usuario.user.empleado_id, isOffline);
    }
  }, [usuario?.user?.empleado_id, fetchNotifications, isOffline]);

  //-------------------- Asistencias --------------------
  const [activeTab, setActiveTab] = useState("attendances");
  const { attendanceHistory, statistics } = useAttendances(usuario, isOffline);

  //-------------------- QR + Reconocimiento Facial --------------------
  const {
    showQRModal,
    setShowQRModal,
    cameraActive,
    showFaceModal,
    handleOpenCamera,
    handleCloseCamera,
    handleScanSuccess,
    handleFaceSuccess,
    handleFaceFailure,
  } = useQrAndFace(usuario, attendanceHistory);

  const registrarAsistencia = () => handleOpenCamera();

  //-------------------- Incidencias --------------------
  const {
    showIncidentModal,
    setShowIncidentModal,
    incidentForm,
    handleIncidentChange,
    handleFileUpload,
    handleSubmitIncident,
  } = useIncident(usuario);


  //-------------------- Render --------------------
  return (
    

  <div className="bg-light min-vh-100">
    <DashboardHeader
      usuario={usuario}
      unreadCount={unreadCount}
      showNotifications={showNotifications}
      setShowNotifications={setShowNotifications}
      notificationRef={notificationRef}
      notifications={notifications}
      markAllAsRead={markAllAsRead}
      markAsRead={markAsRead}
      deleteNotification={deleteNotification}
      getNotificationIcon={getNotificationIcon}
      getNotificationBadgeColor={getNotificationBadgeColor}
      styles={styles}
      handleLogout={handleLogout}
    />

    <div className="container-fluid px-4 py-4">
      <DashboardTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        attendanceHistory={attendanceHistory}
        statistics={statistics}
        setShowIncidenciaModal={setShowIncidentModal}
        usuario={usuario}
        registrarAsistencia={registrarAsistencia}
        setShowQRModal={setShowQRModal}
        isOffline={isOffline}
        styles={styles}
      />
    </div>

    {showQRModal && (
      <QRModal
        handleOpenCamera={handleOpenCamera}
        handleCloseCamera={handleCloseCamera}
        cameraActive={cameraActive}
        onScanSuccess={handleScanSuccess}
        styles={styles}
      />
    )}

    {showIncidentModal && (
      <IncidentModal
        incidentForm={incidentForm}
        handleIncidentChange={handleIncidentChange}
        handleFileUpload={handleFileUpload}
        handleSubmitIncident={handleSubmitIncident}
        setShowIncidentModal={setShowIncidentModal}
        styles={styles}
      />
    )}


    <FaceRecognitionModal
      show={showFaceModal}
      onSuccess={handleFaceSuccess}
      onFailure={handleFaceFailure}
      usuario={usuario}
      onClose={handleFaceFailure}
    />
  </div>
  );
};

export default DashboardPage;
