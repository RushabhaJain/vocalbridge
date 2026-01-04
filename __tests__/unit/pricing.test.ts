import { calculateCost } from "@/app/lib/pricing";

describe("Pricing", () => {
  describe("calculateCost", () => {
    it("should calculate cost for vendorA correctly", () => {
      const cost = calculateCost("vendorA", 1000, 2000);
      // vendorA: $0.002 per 1K tokens
      // Input: 1000 tokens = $0.002
      // Output: 2000 tokens = $0.004
      // Total: $0.006
      expect(cost).toBeCloseTo(0.006, 6);
    });

    it("should calculate cost for vendorB correctly", () => {
      const cost = calculateCost("vendorB", 1500, 3000);
      // vendorB: $0.003 per 1K tokens
      // Input: 1500 tokens = $0.0045
      // Output: 3000 tokens = $0.009
      // Total: $0.0135
      expect(cost).toBeCloseTo(0.0135, 6);
    });

    it("should handle zero tokens", () => {
      const cost = calculateCost("vendorA", 0, 0);
      expect(cost).toBe(0);
    });

    it("should handle fractional costs correctly", () => {
      const cost = calculateCost("vendorA", 500, 750);
      // Input: 500 tokens = $0.001
      // Output: 750 tokens = $0.0015
      // Total: $0.0025
      expect(cost).toBeCloseTo(0.0025, 6);
    });
  });
});

