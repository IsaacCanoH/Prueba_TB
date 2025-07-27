import React from "react";
import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes"
import { loadModels } from "./services/faceApiService";

const App = () => {
  useEffect(() => {
    loadModels()
      .then(() => console.log("Modelos de reconocimiento facial precargados"))
      .catch(err => console.error("Error al cargar modelos:", err));
  }, []); 

  return (
    <div>
      <AppRoutes />
    </div>
  );
};

export default App;
