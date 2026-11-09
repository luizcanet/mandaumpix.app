import { describe, expect, it, vi } from "vitest";
import Router from "@modnes/router";
import { bootstrapApp, populateChargePage } from "./bootstrap-app.js";

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

  describe("populateChargePage (Visibility sync between pix-key-empty and pix-key-selector)", () => {
    it("should return early when chargePageElement is null or undefined", () => {
      expect(populateChargePage(null)).toBeUndefined();
    });

    it("should display pix-key-empty and hide pix-key-selector when there are 0 keys", async () => {
      const chargePage = document.createElement("div");
      chargePage.className = "charge-page";

      const mockRepo = {
        subscribe: vi.fn(),
        getState: vi.fn().mockReturnValue({ items: [] }),
      };
      const mockListUseCase = {
        execute: vi.fn().mockResolvedValue({ items: [] }),
      };

      populateChargePage(chargePage, {
        pixKeyRepository: mockRepo,
        listPixKeysUseCase: mockListUseCase,
      });

      const emptyEl = chargePage.querySelector("pix-key-empty");
      const selectorEl = chargePage.querySelector("pix-key-selector");

      expect(emptyEl).not.toBeNull();
      expect(selectorEl).not.toBeNull();

      expect(emptyEl.classList.contains("hidden")).toBe(false);
      expect(emptyEl.hasAttribute("hidden")).toBe(false);

      expect(selectorEl.classList.contains("hidden")).toBe(true);
      expect(selectorEl.hasAttribute("hidden")).toBe(true);
    });

    it("should hide pix-key-empty and show pix-key-selector when keys are registered", async () => {
      const chargePage = document.createElement("div");
      chargePage.className = "charge-page";

      const registeredKeys = [
        { id: "key-1", tipo_chave: "email", valor_chave: "test@example.com" },
      ];

      const mockRepo = {
        subscribe: vi.fn(),
        getState: vi.fn().mockReturnValue({ items: registeredKeys }),
      };
      const mockListUseCase = {
        execute: vi.fn().mockResolvedValue({ items: registeredKeys }),
      };

      populateChargePage(chargePage, {
        pixKeyRepository: mockRepo,
        listPixKeysUseCase: mockListUseCase,
      });

      // Wait for listPixKeysUseCase promise resolution
      await new Promise((r) => setTimeout(r, 0));

      const emptyEl = chargePage.querySelector("pix-key-empty");
      const selectorEl = chargePage.querySelector("pix-key-selector");

      expect(emptyEl.classList.contains("hidden")).toBe(true);
      expect(emptyEl.hasAttribute("hidden")).toBe(true);

      expect(selectorEl.classList.contains("hidden")).toBe(false);
      expect(selectorEl.hasAttribute("hidden")).toBe(false);
    });

    it("should reactively toggle visibility when repository subscriber receives updates", () => {
      const chargePage = document.createElement("div");
      chargePage.className = "charge-page";

      let subscriberCallback = null;
      const mockRepo = {
        subscribe: vi.fn((cb) => {
          subscriberCallback = cb;
        }),
        getState: vi.fn().mockReturnValue({ items: [] }),
      };

      populateChargePage(chargePage, {
        pixKeyRepository: mockRepo,
      });

      const emptyEl = chargePage.querySelector("pix-key-empty");
      const selectorEl = chargePage.querySelector("pix-key-selector");

      // Initial: 0 keys
      expect(emptyEl.classList.contains("hidden")).toBe(false);
      expect(selectorEl.classList.contains("hidden")).toBe(true);

      // Simulate key saved
      subscriberCallback({
        items: [{ id: "key-1", valor_chave: "pix@test.com" }],
      });

      expect(emptyEl.classList.contains("hidden")).toBe(true);
      expect(emptyEl.hasAttribute("hidden")).toBe(true);
      expect(selectorEl.classList.contains("hidden")).toBe(false);
      expect(selectorEl.hasAttribute("hidden")).toBe(false);

      // Simulate key deleted (all keys removed)
      subscriberCallback({ items: [] });

      expect(emptyEl.classList.contains("hidden")).toBe(false);
      expect(emptyEl.hasAttribute("hidden")).toBe(false);
      expect(selectorEl.classList.contains("hidden")).toBe(true);
      expect(selectorEl.hasAttribute("hidden")).toBe(true);
    });
  });
});
