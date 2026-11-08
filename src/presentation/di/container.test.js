import { describe, expect, it } from "vitest";
import {
  bindServicesToRoot,
  createAppServices,
  registerInjectables,
} from "./container.js";

describe("container.js", () => {
  function resolveDependency(target, name) {
    let resolvedValue = null;
    target.dispatchEvent(
      new CustomEvent("request-provider", {
        bubbles: true,
        composed: true,
        detail: {
          name,
          inject: (val) => {
            resolvedValue = val;
          },
        },
      }),
    );
    return resolvedValue;
  }

  describe("createAppServices", () => {
    it("should instantiate all default adapters and use cases", () => {
      const services = createAppServices();

      expect(services.serviceWorkerAdapter).toBeDefined();
      expect(services.pwaInstallAdapter).toBeDefined();
      expect(services.installPwaUseCase).toBeDefined();
      expect(services.browserShareGateway).toBeDefined();
      expect(services.pixKeyRepository).toBeDefined();
      expect(services.generatePixChargeUseCase).toBeDefined();
      expect(services.distributePixChargeUseCase).toBeDefined();
      expect(services.savePixKeyUseCase).toBeDefined();
      expect(services.listPixKeysUseCase).toBeDefined();
      expect(services.selectPixKeyUseCase).toBeDefined();
      expect(services.deletePixKeyUseCase).toBeDefined();
    });

    it("should honor overrides when provided", () => {
      const customRepo = { custom: true };
      const services = createAppServices({
        overrides: { pixKeyRepository: customRepo },
      });

      expect(services.pixKeyRepository).toBe(customRepo);
      expect(services.generatePixChargeUseCase.pixKeyRepository).toBe(
        customRepo,
      );
    });
  });

  describe("registerInjectables", () => {
    it("should register all services into ownerDoc and resolve via request-provider", () => {
      const testContainer = document.createElement("div");
      document.body.appendChild(testContainer);
      const services = createAppServices();

      registerInjectables(document, services);

      expect(resolveDependency(testContainer, "pix-key-repository")).toBe(
        services.pixKeyRepository,
      );
      expect(
        resolveDependency(testContainer, "generate-pix-charge-use-case"),
      ).toBe(services.generatePixChargeUseCase);
      expect(
        resolveDependency(testContainer, "distribute-pix-charge-use-case"),
      ).toBe(services.distributePixChargeUseCase);
      expect(resolveDependency(testContainer, "install-pwa-use-case")).toBe(
        services.installPwaUseCase,
      );
      expect(resolveDependency(testContainer, "pwa-install-gateway")).toBe(
        services.pwaInstallAdapter,
      );

      testContainer.remove();
    });

    it("should safely ignore null ownerDoc", () => {
      expect(() => registerInjectables(null)).not.toThrow();
    });
  });

  describe("bindServicesToRoot", () => {
    it("should attach services to root element properties", () => {
      const root = document.createElement("div");
      const services = createAppServices();

      bindServicesToRoot(root, services);

      expect(root.__pixKeyRepository).toBe(services.pixKeyRepository);
      expect(root.__generatePixChargeUseCase).toBe(
        services.generatePixChargeUseCase,
      );
    });

    it("should safely ignore null root element", () => {
      expect(() => bindServicesToRoot(null)).not.toThrow();
    });
  });
});
