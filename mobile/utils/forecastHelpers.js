export function computeTrendForecast(progressHistory) {
  if (!progressHistory || progressHistory.length < 2) {
    return { forecastAvailable: false };
  }

  const sorted = [...progressHistory].sort((a, b) => a.month.localeCompare(b.month));
  const points = sorted.map((entry, index) => ({ x: index, y: entry.usageKwh }));

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const nextX = n;
  const projectedUsageKwh = Math.max(0, Math.round(slope * nextX + intercept));
  const projectedCo2OffsetKg = Number((projectedUsageKwh * 0.5).toFixed(2));

  return {
    forecastAvailable: true,
    sorted,
    projectedUsageKwh,
    projectedCo2OffsetKg,
    trendDirection: slope < -1 ? "decreasing" : slope > 1 ? "increasing" : "flat",
  };
}