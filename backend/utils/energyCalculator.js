/**
 * Helper calculations for Energy Monitoring & Alerts
 */

/**
 * Calculates current energy balance: Solar Generation - Energy Consumption
 * @param {number} generation - Solar generation in kW
 * @param {number} consumption - Energy consumption in kW
 * @returns {number} Balance in kW (positive is surplus, negative is deficit)
 */
const calculateBalance = (generation, consumption) => {
  return parseFloat((generation - consumption).toFixed(2));
};

/**
 * Detects unusual energy usage based on current consumption vs historical average.
 * If the current consumption is significantly higher (e.g. 3x) than the average,
 * and exceeds a baseline threshold (e.g., 2.0 kW) to prevent false alerts on low consumption,
 * it triggers an alert.
 * 
 * @param {number} currentConsumption - Current consumption in kW
 * @param {number} averageConsumption - Historical average consumption in kW
 * @returns {boolean} True if usage is abnormal
 */
const isUnusualConsumption = (currentConsumption, averageConsumption) => {
  const BASELINE_MIN = 2.0; // Minimum kW usage to trigger anomalies
  const ANOMALY_MULTIPLIER = 3.0; // Must be 3x the normal usage

  if (currentConsumption < BASELINE_MIN) {
    return false;
  }

  // If we don't have historical average, fallback to a default threshold (e.g., 5.0 kW)
  const norm = averageConsumption > 0 ? averageConsumption : 1.5;
  return currentConsumption >= norm * ANOMALY_MULTIPLIER;
};

module.exports = {
  calculateBalance,
  isUnusualConsumption,
};
