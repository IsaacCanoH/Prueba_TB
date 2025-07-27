import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
let modelosCargados = false;

// Carga los modelos de face-api.js desde la carpeta pública /models.
export const loadModels = async () => {
  if (modelosCargados) return;

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(`${MODEL_URL}/tiny_face_detector`),
      faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`),
      faceapi.nets.faceRecognitionNet.loadFromUri(`${MODEL_URL}/face_recognition`),
    ]);

    modelosCargados = true;

  } catch (err) {
    console.error("Error al cargar los modelos de face-api.js:", err);
    throw err;
  }
};

// Compara dos descriptores faciales y determina si son similares.
export const compareDescriptors = (descriptor1, descriptor2, threshold = 0.5) => {
  try {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    return distance < threshold;
    
  } catch (err) {
    console.error("Error al comparar descriptores faciales:", err);
    throw err;
  }
};
