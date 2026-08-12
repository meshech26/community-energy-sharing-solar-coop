// Sri Lanka's grid emission factor — adjust if your project has a specific source to cite
const GRID_EMISSION_FACTOR_KG_PER_KWH = 0.5;

function calculateCo2OffsetKg(solarUsageKwh) {
  if (typeof solarUsageKwh !== "number" || solarUsageKwh < 0) {
    throw new Error("solarUsageKwh must be a non-negative number");
  }
  return Number((solarUsageKwh * GRID_EMISSION_FACTOR_KG_PER_KWH).toFixed(2));
}

module.exports = { calculateCo2OffsetKg, GRID_EMISSION_FACTOR_KG_PER_KWH };