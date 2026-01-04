import { Provider } from "@/app/lib/types";
import { IProviderAdapter } from "./interfaces";
import { VendorAAdapter } from "./vendorA";
import { VendorBAdapter } from "./vendorB";

export class ProviderFactory {
  private static adapters: Map<Provider, IProviderAdapter> = new Map();

  static getProvider(provider: Provider): IProviderAdapter {
    if (!this.adapters.has(provider)) {
      switch (provider) {
        case "vendorA":
          this.adapters.set(provider, new VendorAAdapter());
          break;
        case "vendorB":
          this.adapters.set(provider, new VendorBAdapter());
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    }
    return this.adapters.get(provider)!;
  }
}

