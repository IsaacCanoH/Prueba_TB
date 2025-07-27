import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../components/Auth/LoginForm";
import LoginHeader from "../components/Auth/LoginHeader";
import { login } from "../services/auth/authService";
import { useLoader } from "../context/LoaderContext";
import { useToast } from "../context/ToastContext";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../styles/login.module.css";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const toastShown = useRef(false);

  const { showLoader, hideLoader } = useLoader();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Maneja los cambios del formulario.
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = "El usuario es obligatorio";
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "La contraseña es obligatoria";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  useEffect(() => {
    if (location.state?.registered && !toastShown.current) {
      toastShown.current = true;
      showSuccess("Registro exitoso");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state, showSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      showLoader("Ingresando al sistema...");
      const { username, password } = formData;
      const result = await login(username, password);

      if (result.success) {
        navigate("/dashboard");
      } else {
        showError(`Error: ${result.error}`);
      }

    } catch {
      showError("Hubo un error inesperado.");
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100">
      <div className="row g-0 min-vh-100">
        <LoginHeader styles={styles} />
        <div className="col-lg-7 col-12 d-flex justify-content-center py-3 py-lg-0 align-items-start align-items-lg-center">
          <div className="w-100 pt-0 px-3 px-sm-4 px-lg-5">
            <LoginForm
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              styles={styles}
              errors={errors}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
