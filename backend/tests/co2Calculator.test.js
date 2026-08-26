const { calculateCo2OffsetKg } = require("../utils/co2Calculator");

describe("calculateCo2OffsetKg", () => {
  test("calculates offset correctly", () => {
    expect(calculateCo2OffsetKg(100)).toBe(50);
  });
  test("returns 0 for zero usage", () => {
    expect(calculateCo2OffsetKg(0)).toBe(0);
  });
  test("throws for negative usage", () => {
    expect(() => calculateCo2OffsetKg(-10)).toThrow();
  });
});