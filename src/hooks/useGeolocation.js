import { useState } from 'react';

export const useGeolocation = () => {
  const [error, setError] = useState(null);

  const getCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocalización no soportada');
        setError(err.message);
        return reject(err);
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          resolve({ latitude, longitude });
        },
        (err) => {
          setError(err.message);
          reject(new Error('Error obteniendo ubicación: ' + err.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  return { getCoordinates, error };
};
