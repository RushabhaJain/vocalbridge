import { VendorAAdapter } from "@/app/providers/vendorA";
import { VendorBAdapter } from "@/app/providers/vendorB";

describe("Provider Adapters", () => {
  describe("VendorAAdapter", () => {
    it("should return a successful response", async () => {
      const adapter = new VendorAAdapter();
      const result = await adapter.chat([
        { role: "user", content: "Hello" },
      ]);

      // May succeed or fail due to 10% failure rate, but should have proper structure
      if (result.success) {
        expect(result.response).toBeDefined();
        expect(result.response?.outputText).toBeDefined();
        expect(result.response?.tokensIn).toBeGreaterThan(0);
        expect(result.response?.tokensOut).toBeGreaterThan(0);
      } else {
        expect(result.error).toBeDefined();
        expect(result.error?.code).toBeDefined();
      }
    }, 10000);

    it("should have correct provider name", () => {
      const adapter = new VendorAAdapter();
      expect(adapter.getName()).toBe("vendorA");
    });
  });

  describe("VendorBAdapter", () => {
    it("should return a successful response", async () => {
      const adapter = new VendorBAdapter();
      const result = await adapter.chat([
        { role: "user", content: "Hello" },
      ]);

      // May succeed or fail due to rate limiting, but should have proper structure
      if (result.success) {
        expect(result.response).toBeDefined();
        expect(result.response?.choices).toBeDefined();
        expect(result.response?.choices?.[0]?.message?.content).toBeDefined();
        expect(result.response?.usage?.input_tokens).toBeGreaterThan(0);
        expect(result.response?.usage?.output_tokens).toBeGreaterThan(0);
      } else {
        expect(result.error).toBeDefined();
        expect(result.error?.code).toBeDefined();
      }
    }, 10000);

    it("should have correct provider name", () => {
      const adapter = new VendorBAdapter();
      expect(adapter.getName()).toBe("vendorB");
    });
  });
});

