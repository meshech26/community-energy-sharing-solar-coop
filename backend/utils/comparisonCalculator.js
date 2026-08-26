function calculateMonthOverMonthComparison(progressHistory, targetPercentReduction) {
  if (!progressHistory || progressHistory.length < 2) {
    return { comparisonAvailable: false, message: "Need at least two logged months to compare." };
  }

  const sorted = [...progressHistory].sort((a, b) => a.month.localeCompare(b.month));
  const previous = sorted[sorted.length - 2];
  const current = sorted[sorted.length - 1];

  const percentChange = ((current.usageKwh - previous.usageKwh) / previous.usageKwh) * 100;
  const actualReductionPercent = Number((-percentChange).toFixed(2)); // positive = usage went down

  return {
    comparisonAvailable: true,
    previousMonth: previous.month,
    currentMonth: current.month,
    previousUsageKwh: previous.usageKwh,
    currentUsageKwh: current.usageKwh,
    actualReductionPercent,
    targetPercentReduction,
    isAheadOfTarget: actualReductionPercent >= targetPercentReduction,
  };
}

module.exports = { calculateMonthOverMonthComparison };