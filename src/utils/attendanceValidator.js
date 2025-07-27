// Valida si es día hábil (lunes a viernes)
export const isWeekday = (date = new Date()) => {
  const day = date.getDay(); // 0 = domingo, 6 = sábado
  return day >= 1 && day <= 7;
};

// Valida si la hora está entre las 07:50 y 16:40
export const isWithinAllowedTimeRange = (date = new Date()) => {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const min = 7 * 60 + 50;
  const max = 22 * 60 + 40;
  return currentMinutes >= min && currentMinutes <= max;
};

export const getPunctualityStatus = (date, schedule) => {
  const [hStart, mStart] = schedule.start.split(":").map(Number);
  const [hTol, mTol, sTol] = schedule.tolerance.split(":").map(Number);

  const startMinutes = hStart * 60 + mStart;
  const toleranceMinutes = hTol * 60 + mTol + sTol / 60;
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  if (currentMinutes <= startMinutes + toleranceMinutes) {
    return "puntual";
  } else {
    return "retardo";
  }
};
