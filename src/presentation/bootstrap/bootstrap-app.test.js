import { describe, expect, it, vi } from "vitest";
import Router from "@modnes/router";
import { bootstrapApp } from "./bootstrap-app.js";

describe("bootstrap-app.js", () => {
  it("should return null if rootElement is not provided", () => {
    expect(bootstrapApp(null)).toBeNull();
  });

  it("should mark rootElement as initialized and bind services", () => {
    const root = document.createElement("main");
    root.id = "app";
    const outlet = document.createElement("div");
    outlet.id = "router-outlet";
    root.appendChild(outlet);
    document.body.appendChild(root);

    const result = bootstrapApp(root, {
      autoRegisterServiceWorker: false,
    });

    expect(result).toBe(root);
    expect(root.dataset.initialized).toBe("true");
    expect(root.__serviceWorkerAdapter).toBeDefined();
    expect(root.__pwaInstallAdapter).toBeDefined();
    expect(root.__installPwaUseCase).toBeDefined();
    expect(root.__browserShareGateway).toBeDefined();
    expect(root.__pixKeyRepository).toBeDefined();
    expect(root.__generatePixChargeUseCase).toBeDefined();
    expect(root.__distributePixChargeUseCase).toBeDefined();
    expect(root.__savePixKeyUseCase).toBeDefined();
    expect(root.__listPixKeysUseCase).toBeDefined();
    expect(root.__selectPixKeyUseCase).toBeDefined();
    expect(root.__deletePixKeyUseCase).toBeDefined();
    expect(root.__appRouter).toBeInstanceOf(Router);

    root.remove();
  });

  it("should inject installPwaUseCase into app-header element when present", () => {
    const root = document.createElement("main");
    root.id = "app";
    const header = document.createElement("app-header");
    root.appendChild(header);
    document.body.appendChild(root);

    bootstrapApp(root, {
      autoRegisterServiceWorker: false,
    });

    expect(header.installPwaUseCase).toBeDefined();
    expect(header.installPwaUseCase).toBe(root.__installPwaUseCase);

    root.remove();
  });

  it("should register service worker when readyState is complete and autoRegister is true", () => {
    const root = document.createElement("main");
    document.body.appendChild(root);

    const mockRegister = vi.fn().mockResolvedValue({});
    const customSwAdapter = {
      register: mockRegister,
    };

    const mockWindow = {
      document: { readyState: "complete" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      location: { pathname: "/" },
    };

    bootstrapApp(root, {
      autoRegisterServiceWorker: true,
      serviceWorkerAdapter: customSwAdapter,
      windowTarget: mockWindow,
    });

    expect(mockRegister).toHaveBeenCalled();

    root.remove();
  });
});
