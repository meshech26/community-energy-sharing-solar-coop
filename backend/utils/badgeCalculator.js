const STREAK_BADGES = [
  { months: 3, label: "3-Month Streak" },
  { months: 6, label: "6-Month Streak" },
  { months: 12, label: "12-Month Streak" },
];

const CO2_BADGES = [
  { kg: 10, label: "10kg CO2 Saved" },
  { kg: 50, label: "50kg CO2 Saved" },
  { kg: 100, label: "100kg CO2 Saved" },
];

function calculateEarnedBadges(currentStreakMonths, co2ToDateKg) {
  const earned = [];
  STREAK_BADGES.forEach((b) => { if (currentStreakMonths >= b.months) earned.push(b.label); });
  CO2_BADGES.forEach((b) => { if (co2ToDateKg >= b.kg) earned.push(b.label); });
  return earned;
}

module.exports = { calculateEarnedBadges };