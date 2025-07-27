import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { compareDescriptors, loadModels } from '../services/faceApiService';
import { saveFacePhoto, getFacePhoto, getLocalFace } from '../services/dashboard/photoFaceService';
import { useToast } from '../context/ToastContext';
import { useLoader } from '../context/LoaderContext';

const tinyOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 160,
  scoreThreshold: 0.5,
});

export const useFaceRecognition = ({ show, usuario, onSuccess, onFailure }) => {
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const processingRef = useRef(false);
  const alreadyFinishedRef = useRef(false);

  const { showError } = useToast();
  const { showLoader, hideLoader } = useLoader();

  const [feedback, setFeedback] = useState('Cargando modelos...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels()
      .then(() => console.log("Modelos precargados en useFaceRecognition"))
      .catch((err) => console.error("Error cargando modelos en useFaceRecognition:", err));
  }, []);

  useEffect(() => {
    if (show) handleStart();
    return cleanup;
  }, [show]);

  const cleanup = () => {
    clearInterval(intervalRef.current);
    processingRef.current = false;
    alreadyFinishedRef.current = false;
    resetFeedback();
  };

  const resetFeedback = () => {
    setFeedback('Cargando modelos...');
    setLoading(true);
  };

  const handleStart = () => {
    setFeedback('Prepara tu rostro, comenzaremos en 3 segundos...');
    setLoading(false);

    setTimeout(() => {
      setFeedback('Buscando rostro...');
      startDetectionLoop();
    }, 3000);
  };

  const startDetectionLoop = () => {
    const video = webcamRef.current.video;
    let attempts = 0;
    const maxAttempts = 30;

    intervalRef.current = setInterval(async () => {
      if (!video || processingRef.current || alreadyFinishedRef.current) return;

      const detection = await faceapi.detectSingleFace(video, tinyOptions);

      attempts++;

      if (!detection) {
        if (attempts % 3 === 0) setFeedback('No se detecta tu rostro');
        if (attempts >= maxAttempts) finishDetection(false);
        return;
      }

      const detectionStatus = evaluateDetection(detection, video);

      if (detectionStatus === 'ok') {
        finishDetection(true);
      } else if (attempts % 3 === 0) {
        setFeedback(detectionStatus);
      }
    }, 1000);
  };

  const evaluateDetection = (detection, video) => {
    const { box } = detection;
    const sizeRatio = box.width / video.videoWidth;
    const centerX = box.x + box.width / 2;
    const deviation = Math.abs(centerX - video.videoWidth / 2);

    if (sizeRatio < 0.2) return 'Acércate un poco más';
    if (sizeRatio > 0.6) return 'Aléjate un poco';
    if (deviation > 50) return 'Centra tu rostro';

    return 'ok';
  };

  const finishDetection = (success) => {
    if (alreadyFinishedRef.current) return;
    alreadyFinishedRef.current = true;

    clearInterval(intervalRef.current);

    if (success) {
      captureAndCompareFace();
    } else {
      showError('No se pudo capturar el rostro');
      onFailure?.();
    }
  };

  const captureAndCompareFace = async () => {
    processingRef.current = true;

    try {
      setFeedback('Procesando rostro, por favor espere...');
      showLoader('Comparando rostros...');

      const video = webcamRef.current.video;
      const detection = await detectFullFace(video);

      if (!detection) throw new Error('No se detectó el rostro.');

      const imageBase64 = getImageBase64(video);
      const descriptorArray = Array.from(detection.descriptor);

      let referenceData = null;

      try {
        referenceData = await getFacePhoto(usuario.user.empleado_id);
      } catch (err) {
        console.warn('Fallo al obtener rostro remoto, intentando local:', err.message);
        referenceData = await getLocalFace(usuario.user.empleado_id);
      }

      if (referenceData?.descriptor) {
        verifyFace(detection.descriptor, referenceData.descriptor);
      } else if (navigator.onLine) {
        await registerNewFace(usuario.user.empleado_id, imageBase64, descriptorArray);
      } else {
        showError('No se encontró rostro registrado para comparar (modo offline).');
        hideLoader(); // ✅ Se oculta si no hay referencia y está offline
        onFailure?.();
      }

    } catch (err) {
      console.error(err);
      showError('Error al procesar rostro');
      hideLoader(); // ✅ Se oculta en caso de error general
      onFailure?.();
    }
  };


  const detectFullFace = (video) => {
    return faceapi.detectSingleFace(video, tinyOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();
  };

  const verifyFace = (currentDescriptor, referenceDescriptorObj) => {
    const referenceDescriptor = new Float32Array(Object.values(referenceDescriptorObj));
    const isMatch = compareDescriptors(currentDescriptor, referenceDescriptor);

    if (isMatch) {
      setFeedback('Rostro verificado correctamente');
      hideLoader()
      onSuccess?.();
    } else {
      showError('Rostro no coincide');
      hideLoader()
      onFailure?.();
    }
  };

  const registerNewFace = async (empleadoId, imageBase64, descriptorArray) => {
    await saveFacePhoto(empleadoId, imageBase64, descriptorArray);
    setFeedback('Rostro registrado correctamente');
    hideLoader();
    onSuccess?.();
  };

  const getImageBase64 = (video) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  };

  return {
    webcamRef,
    feedback,
    loading,
  };
};
