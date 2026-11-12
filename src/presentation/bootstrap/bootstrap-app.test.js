import { describe, expect, it, vi } from "vitest";
import Router from "@modnes/router";
import { bootstrapApp, populateChargePage } from "./bootstrap-app.js";
import "../components/pix-charge-form/pix-charge-form.component.js";

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

  it("should mount and activate <security-banner> when running on unauthorized origin (TASK-08.2.2 / Cenário 02)", () => {
    const root = document.createElement("main");
    root.id = "app";
    document.body.appendChild(root);

    bootstrapApp(root, {
      autoRegisterServiceWorker: false,
      originTarget: "https://manda-um-pix.online",
    });

    const banner = root.querySelector("security-banner");
    expect(banner).not.toBeNull();
    expect(banner.hasAttribute("hidden")).toBe(false);
    expect(banner.getAttribute("role")).toBe("alert");
    expect(banner.getAttribute("aria-live")).toBe("assertive");
    expect(banner.textContent).toContain(
      "Atenção: Este não é o endereço oficial do Manda um PIX. Acesse com segurança em mandaumpix.app",
    );

    root.remove();
  });

  it("should mount <security-banner> but keep it hidden on official canonical origin (TASK-08.2.2 / Cenário 01)", () => {
    const root = document.createElement("main");
    root.id = "app";
    document.body.appendChild(root);

    bootstrapApp(root, {
      autoRegisterServiceWorker: false,
      originTarget: "https://mandaumpix.app",
    });

    const banner = root.querySelector("security-banner");
    expect(banner).not.toBeNull();
    expect(banner.hasAttribute("hidden")).toBe(true);
    expect(banner.isUnauthorized).toBe(false);

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

    it("should synchronize formElement.selectedKey and enable charge button when keys exist", async () => {
      const chargePage = document.createElement("div");
      chargePage.className = "charge-page";
      document.body.appendChild(chargePage);

      const registeredKeys = [
        { id: "key-1", tipo_chave: "email", valor_chave: "test@example.com" },
      ];

      const mockRepo = {
        subscribe: vi.fn(),
        getState: vi.fn().mockReturnValue({
          items: registeredKeys,
          selectedKeyId: "key-1",
          selectedKey: registeredKeys[0],
        }),
      };
      const mockListUseCase = {
        execute: vi.fn().mockResolvedValue({
          items: registeredKeys,
          selectedKeyId: "key-1",
          selectedKey: registeredKeys[0],
        }),
      };

      populateChargePage(chargePage, {
        pixKeyRepository: mockRepo,
        listPixKeysUseCase: mockListUseCase,
      });

      await new Promise((r) => setTimeout(r, 0));

      const formEl = chargePage.querySelector("pix-charge-form");
      expect(formEl).not.toBeNull();
      expect(formEl.selectedKey).toEqual(registeredKeys[0]);
      expect(formEl.disabled).toBe(false);
      const ctaBtn = formEl.querySelector("button.charge-cta");
      expect(ctaBtn).not.toBeNull();
      expect(ctaBtn.disabled).toBe(false);
      expect(ctaBtn.classList.contains("charge-cta--disabled")).toBe(false);

      chargePage.remove();
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

    it("should mount pix-charge-dialog into charge-page and omit static waiting column (TASK-07.4.5)", () => {
      const chargePage = document.createElement("div");
      chargePage.className = "charge-page";

      const mockDistribute = { execute: vi.fn() };

      populateChargePage(chargePage, {
        distributePixChargeUseCase: mockDistribute,
      });

      expect(
        chargePage.querySelector(".charge-page__column--result"),
      ).toBeNull();
      const chargeDialog = chargePage.querySelector("pix-charge-dialog");
      expect(chargeDialog).not.toBeNull();
      expect(chargeDialog.distributePixChargeUseCase).toBe(mockDistribute);
    });
  });
});
