export const getDirecciones = async () => {
  try {
    const response = await fetch("https://dhernandeza.inaeba.edu.mx/public/getDirecciones");
    const result = await response.json();

    if (result.status === "success" && Array.isArray(result.data)) {
      return result.data.map(direccion => ({
        value: direccion.id,
        label: direccion.nombre
      }));
    } else {
      console.error("Formato inesperado en respuesta:", result);
      return [];
    }
  } catch (error) {
    console.error("Error al obtener direcciones:", error);
    return [];
  }
};

export const getCoordinacionesByDireccion = async (idDireccion) => {
  try {
    const response = await fetch(`https://dhernandeza.inaeba.edu.mx/public/getCoordinacionArea/${idDireccion}`);
    const result = await response.json();

    if (result.status === "success" && Array.isArray(result.data)) {
      return result.data.map(item => ({
        value: item.id,
        label: item.nombre
      }));
    } else {
      console.error("Respuesta inesperada al obtener coordinaciones:", result);
      return [];
    }
  } catch (error) {
    console.error("Error al obtener coordinaciones:", error);
    return [];
  }
};

export const getJefaturasByCoordinacion = async (idCoordinacion) => {
  try {
    const response = await fetch(`https://dhernandeza.inaeba.edu.mx/public/getJefatura/${idCoordinacion}`); 
    const result = await response.json();

    if (result.status === "success" && Array.isArray(result.data)) {
      return result.data.map((item) => ({
        value: item.id,
        label: item.nombre
      }));
    } else {
      console.error("Respuesta inesperada al obtener jefaturas:", result);
      return [];
    }
  } catch (error) {
    console.error("Error al obtener jefaturas:", error);
    return [];
  }
};

export const getHorarios = async () => {
  try {
    const response = await fetch(`https://dhernandeza.inaeba.edu.mx/public/getHorario/0`);
    const result = await response.json();

    if (result.status === "success" && Array.isArray(result.data)) {
      return result.data.map((item) => ({
        value: item.id,
        label: `${item.start} - ${item.end} (Tolerancia: ${item.tolerance} min)`
      }));
    } else {
      console.error("Respuesta inesperada al obtener horarios:", result);
      return [];
    }
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    return [];
  }
};

export const getMunicipios = async () => {
  try {
    const response = await fetch(`https://inaeba.guanajuato.gob.mx/rest/v1/public/municipio`);
    const result = await response.json();

    if (Array.isArray(result)) {
      return result.map((item) => ({
        value: item.id_mpio,
        label: item.mpio_desc
      }));
    } else {
      console.error("Respuesta inesperada al obtener municipios:", result);
      return [];
    }
  } catch (error) {
    console.error("Error al obtener municipios:", error);
    return [];
  }
};

export const getOficinas = async () => {
  try {
    const response = await fetch(`https://dhernandeza.inaeba.edu.mx/public/getOficina/0`); 
    const result = await response.json();

    if (result.status === "success" && Array.isArray(result.data)) {
      return result.data.map((item) => ({
        value: item.id,
        label: item.nombre
      }));
    } else {
      console.error("Respuesta inesperada al obtener oficinas:", result);
      return [];
    }
  } catch (error) {
    console.error("Error al obtener oficinas:", error);
    return [];
  }
};

export const getTipoBases = async () => {
  try {
    const response = await fetch(`https://dhernandeza.inaeba.edu.mx/public/getTipoBase/0`);
    const result = await response.json();

    if (Array.isArray(result.data)) {
      return result.data.map((item) => ({
        value: item.id,
        label: item.nombre
      }));
    } else {
      console.error("Respuesta inesperada al obtener tipo base:", result);
      return [];
    }
  } catch (error) {
    console.error("Error al obtener tipo base:", error);
    return [];
  }
};

export const registrarEmpleado = async (formData) => {
  try {
    const response = await fetch("https://dhernandeza.inaeba.edu.mx/system/registrationDataSet", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.mensaje || "Error al registrar");
    }

    return result;
  } catch (error) {
    console.error("Error al registrar empleado:", error.message);
    throw error;
  }
};


