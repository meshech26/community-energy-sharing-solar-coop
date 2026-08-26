const { calculateMonthOverMonthComparison } = require("../utils/comparisonCalculator");

describe("calculateMonthOverMonthComparison", () => {
  test("unavailable with fewer than two entries", () => {
    const result = calculateMonthOverMonthComparison([{ month: "2026-08", usageKwh: 100 }], 15);
    expect(result.comparisonAvailable).toBe(false);
  });

  test("ahead of target when usage drops enough", () => {
    const history = [{ month: "2026-07", usageKwh: 200 }, { month: "2026-08", usageKwh: 150 }];
    expect(calculateMonthOverMonthComparison(history, 15).isAheadOfTarget).toBe(true);
  });

  test("behind target when usage barely drops", () => {
    const history = [{ month: "2026-07", usageKwh: 200 }, { month: "2026-08", usageKwh: 195 }];
    expect(calculateMonthOverMonthComparison(history, 15).isAheadOfTarget).toBe(false);
  });
});