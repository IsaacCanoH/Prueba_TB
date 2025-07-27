import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/Auth/RegisterForm";
import RegisterHeader from "../components/Auth/RegisterHeader";
import {
  getDirecciones,
  getCoordinacionesByDireccion,
  getJefaturasByCoordinacion,
  getHorarios,
  getMunicipios,
  getOficinas,
  getTipoBases,
  registrarEmpleado,
} from "../services/register/registerService";
import { useLoader } from "../context/LoaderContext";
import { useToast } from "../context/ToastContext";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "../styles/register.module.css";


const RegisterPage = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { showError } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    correoInstitucional: "",
    usuario: "",
    password: "",
    pin: "",
    direccion: "",
    coordinacion: "",
    jefatura: "",
    oficinas: "",
    tipoBase: "",
    grupo: "",
    municipio: "",
    telefono: "",
  });

  const [catalogos, setCatalogos] = useState({
    direcciones: [],
    coordinaciones: [],
    jefaturas: [],
    grupos: [],
    municipios: [],
    oficinas: [],
    tipoBases: [],
  });

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [
          direcciones, horarios, municipios, oficinas, tipoBases
        ] = await Promise.all([
          getDirecciones(),
          getHorarios(),
          getMunicipios(),
          getOficinas(),
          getTipoBases(),
        ]);

        setCatalogos((prev) => ({
          ...prev,
          direcciones,
          grupos: horarios,
          municipios,
          oficinas,
          tipoBases,
        }));

      } catch (err) {
        console.error("Error al cargar catálogos iniciales:", err);
      }
    };

    fetchCatalogos();
  }, []);

  useEffect(() => {
    const fetchCoordinaciones = async () => {
      if (formData.direccion) {
        const data = await getCoordinacionesByDireccion(formData.direccion);
        setCatalogos((prev) => ({ ...prev, coordinaciones: data }));
      } else {
        setCatalogos((prev) => ({ ...prev, coordinaciones: [] }));
      }
    };

    fetchCoordinaciones();
  }, [formData.direccion]);

  useEffect(() => {
    const fetchJefaturas = async () => {
      if (formData.coordinacion) {
        const data = await getJefaturasByCoordinacion(formData.coordinacion);
        setCatalogos((prev) => ({ ...prev, jefaturas: data }));
      } else {
        setCatalogos((prev) => ({ ...prev, jefaturas: [] }));
      }
    };

    fetchJefaturas();
  }, [formData.coordinacion]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    const requiredFields = [
      { key: "nombre", label: "El nombre es obligatorio" },
      { key: "apellidoPaterno", label: "El apellido paterno es obligatorio" },
      { key: "apellidoMaterno", label: "El apellido materno es obligatorio" },
      { key: "correoInstitucional", label: "El correo es obligatorio" },
      { key: "usuario", label: "El usuario es obligatorio" },
      { key: "password", label: "La contraseña es obligatoria" },
      { key: "pin", label: "El PIN es obligatorio" },
      { key: "direccion", label: "Seleccione una dirección" },
      { key: "coordinacion", label: "Seleccione una coordinación" },
      { key: "jefatura", label: "Seleccione una jefatura" },
      { key: "oficinas", label: "Seleccione una oficina" },
      { key: "tipoBase", label: "Seleccione un tipo de base" },
      { key: "grupo", label: "Seleccione un horario" },
      { key: "municipio", label: "Seleccione un municipio" },
      { key: "telefono", label: "El teléfono es obligatorio" },
    ];

    requiredFields.forEach(({ key, label }) => {
      if (!formData[key] || (typeof formData[key] === "string" && formData[key].trim() === "")) {
        newErrors[key] = label;
        isValid = false;
      }
    });

    if (
      formData.correoInstitucional &&
      !formData.correoInstitucional.endsWith("@inaeba.edu.mx")
    ) {
      newErrors.correoInstitucional = "El correo debe pertenecer al dominio inaeba.edu.mx";
      isValid = false;
    }

    if (formData.pin && formData.pin.length !== 4) {
      newErrors.pin = "El PIN debe tener 4 dígitos";
      isValid = false;
    }

    if (formData.telefono && formData.telefono.length !== 10) {
      newErrors.telefono = "El teléfono debe tener 10 dígitos";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const formDataToSend = prepararFormData(formData);

    try {
      showLoader("Registrado datos...");
      await registrarEmpleado(formDataToSend);
      navigate("/login", { state: { registrado: true } });
    } catch (err) {
      console.error(err.message);
      showError("Error al registrar usuario");
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100">
      <RegisterHeader styles={styles} />
      <div className="row g-0 justify-content-center py-4">
        <div className="col-12 d-flex justify-content-center">
          <div className="w-100 px-3 px-sm-4 px-lg-5" style={{ maxWidth: "1000px" }}>
            <RegisterForm
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              direccionOptions={catalogos.direcciones}
              coordinacionOptions={catalogos.coordinaciones}
              jefaturaOptions={catalogos.jefaturas}
              gruposOptions={catalogos.grupos}
              municipioOptions={catalogos.municipios}
              oficinaOptions={catalogos.oficinas}
              tipoBasesOptions={catalogos.tipoBases}
              errors={errors}
              styles={styles}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

const prepararFormData = (form) => {
  const data = new FormData();

  data.append("nombre", form.nombre);
  data.append("ap_paterno", form.apellidoPaterno);
  data.append("ap_materno", form.apellidoMaterno);
  data.append("email", form.correoInstitucional);
  data.append("usuario", form.usuario);
  data.append("clave_acceso", form.password);
  data.append("ping_hash", form.pin);
  data.append("id_direccion", parseInt(form.direccion));
  data.append("id_coordinacion", parseInt(form.coordinacion));
  data.append("id_jefatura", parseInt(form.jefatura));
  data.append("id_oficina", parseInt(form.oficinas));
  data.append("id_tipo_usuario", parseInt(form.tipoBase));
  data.append("ig_grupo_horario", parseInt(form.grupo));
  data.append("id_municipio", parseInt(form.municipio));
  data.append("telefono", form.telefono);

  return data;
};
