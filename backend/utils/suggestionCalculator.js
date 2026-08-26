function suggestTargetPercentReduction(progressHistory) {
  if (!progressHistory || progressHistory.length === 0) return 10;
  if (progressHistory.length === 1) return 10;

  const sorted = [...progressHistory].sort((a, b) => a.month.localeCompare(b.month));
  const previous = sorted[sorted.length - 2];
  const current = sorted[sorted.length - 1];
  const percentChange = ((current.usageKwh - previous.usageKwh) / previous.usageKwh) * 100;

  if (percentChange > 10) return 20; // usage rising sharply — suggest a bigger cut
  if (percentChange > 0) return 15;  // usage rising slightly
  return 10;                          // usage already falling — modest target is enough
}

module.exports = { suggestTargetPercentReduction };