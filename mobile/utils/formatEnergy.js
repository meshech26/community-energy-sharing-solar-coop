/**
 * Formats power values (kW) with 1 decimal place
 */
export const formatKW = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0.0 kW';
  return `${Number(val).toFixed(1)} kW`;
};

/**
 * Formats energy values (kWh) with 1 decimal place
 */
export const formatKWh = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0.0 kWh';
  return `${Number(val).toFixed(1)} kWh`;
};
