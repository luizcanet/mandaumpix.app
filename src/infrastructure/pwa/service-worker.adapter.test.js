import { describe, expect, it, vi } from "vitest";
import {
  CACHE_VERSION,
  DEFAULT_SW_SCOPE,
  DEFAULT_SW_SCRIPT_URL,
  PRECACHE_NAME,
  RUNTIME_CACHE_NAME,
  SERVICE_WORKER_ADAPTER_ERROR_CODES,
  SERVICE_WORKER_STATUS,
  ServiceWorkerAdapter,
  ServiceWorkerAdapterError,
  createServiceWorkerAdapter,
  isOnline,
  isServiceWorkerSupported,
} from "./service-worker.adapter.js";

describe("ServiceWorkerAdapter & Helpers", () => {
  describe("Constantes e Helpers Puros", () => {
    it("deve exportar valores padrão consistentes para scripts e escopos", () => {
      expect(DEFAULT_SW_SCRIPT_URL).toBe("./sw.js");
      expect(DEFAULT_SW_SCOPE).toBe("./");
      expect(CACHE_VERSION).toBe("v1.0.1");
      expect(PRECACHE_NAME).toBe("mandaumpix-v1.0.1-precache");
      expect(RUNTIME_CACHE_NAME).toBe("mandaumpix-v1.0.1-runtime");
    });

    it("deve conter códigos de erro e status congelados", () => {
      expect(Object.isFrozen(SERVICE_WORKER_ADAPTER_ERROR_CODES)).toBe(true);
      expect(Object.isFrozen(SERVICE_WORKER_STATUS)).toBe(true);
      expect(SERVICE_WORKER_STATUS.UNREGISTERED).toBe("UNREGISTERED");
      expect(SERVICE_WORKER_STATUS.REGISTERED).toBe("REGISTERED");
      expect(SERVICE_WORKER_STATUS.UNSUPPORTED).toBe("UNSUPPORTED");
      expect(SERVICE_WORKER_STATUS.ERROR).toBe("ERROR");
    });

    it("deve instanciar ServiceWorkerAdapterError com propriedades estruturadas", () => {
      const cause = new Error("Network error");
      const error = new ServiceWorkerAdapterError("Falha ao registrar", {
        code: SERVICE_WORKER_ADAPTER_ERROR_CODES.REGISTRATION_FAILED,
        field: "scriptUrl",
        cause,
      });

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("ServiceWorkerAdapterError");
      expect(error.message).toBe("Falha ao registrar");
      expect(error.code).toBe(
        SERVICE_WORKER_ADAPTER_ERROR_CODES.REGISTRATION_FAILED,
      );
      expect(error.field).toBe("scriptUrl");
      expect(error.cause).toBe(cause);
    });

    it("isServiceWorkerSupported deve detectar corretamente presença de navigator.serviceWorker", () => {
      expect(isServiceWorkerSupported({ navigatorTarget: null })).toBe(false);
      expect(isServiceWorkerSupported({ navigatorTarget: {} })).toBe(false);
      expect(
        isServiceWorkerSupported({
          navigatorTarget: { serviceWorker: {} },
        }),
      ).toBe(true);
    });

    it("isOnline deve detectar status de rede no navigator", () => {
      expect(isOnline({ navigatorTarget: null })).toBe(true);
      expect(isOnline({ navigatorTarget: { onLine: true } })).toBe(true);
      expect(isOnline({ navigatorTarget: { onLine: false } })).toBe(false);
      expect(isOnline({ navigatorTarget: {} })).toBe(true);
    });
  });

  describe("Instanciação e Estado Inicial", () => {
    it("deve inicializar com estado UNSUPPORTED quando navigator.serviceWorker não existir", () => {
      const adapter = createServiceWorkerAdapter({
        windowTarget: new EventTarget(),
        navigatorTarget: { onLine: true },
      });

      expect(adapter.isSupported()).toBe(false);
      expect(adapter.isRegistered()).toBe(false);
      expect(adapter.hasUpdate()).toBe(false);
      expect(adapter.isOnline()).toBe(true);

      const state = adapter.getState();
      expect(state.isSupported).toBe(false);
      expect(state.status).toBe(SERVICE_WORKER_STATUS.UNSUPPORTED);
      expect(state.isOnline).toBe(true);
      expect(state.isRegistered).toBe(false);
      expect(adapter.getRegistration()).toBeNull();
    });

    it("deve inicializar com valores padrão quando nenhum argumento for passado", () => {
      const adapter = new ServiceWorkerAdapter();
      expect(adapter.getState().scriptUrl).toBe(DEFAULT_SW_SCRIPT_URL);
      expect(adapter.getState().scope).toBe(DEFAULT_SW_SCOPE);
    });

    it("deve lidar de forma segura quando windowTarget for nulo ou sem addEventListener", () => {
      const adapter = new ServiceWorkerAdapter({ windowTarget: null });
      expect(adapter.windowTarget).toBeNull();
    });

    it("deve inicializar com estado UNREGISTERED quando serviceWorker for suportado", () => {
      const mockServiceWorker = new EventTarget();
      mockServiceWorker.register = vi.fn();

      const adapter = new ServiceWorkerAdapter({
        windowTarget: new EventTarget(),
        navigatorTarget: {
          serviceWorker: mockServiceWorker,
          onLine: true,
        },
      });

      expect(adapter.isSupported()).toBe(true);
      expect(adapter.isRegistered()).toBe(false);
      expect(adapter.getState().status).toBe(
        SERVICE_WORKER_STATUS.UNREGISTERED,
      );
    });
  });

  describe("Monitoramento de Conectividade (online / offline)", () => {
    it("deve reagir a eventos online e offline no windowTarget e notificar reativamente", () => {
      const windowTarget = new EventTarget();
      const mockServiceWorker = new EventTarget();
      mockServiceWorker.register = vi.fn();

      const adapter = new ServiceWorkerAdapter({
        windowTarget,
        navigatorTarget: {
          serviceWorker: mockServiceWorker,
          onLine: true,
        },
      });

      const listener = vi.fn();
      const unsubscribe = adapter.subscribe(listener);

      expect(adapter.isOnline()).toBe(true);

      // Simula queda de conexão (offline)
      windowTarget.dispatchEvent(new Event("offline"));
      expect(adapter.isOnline()).toBe(false);
      expect(listener).toHaveBeenCalled();
      expect(adapter.getState().isOnline).toBe(false);

      // Simula recuperação de conexão (online)
      windowTarget.dispatchEvent(new Event("online"));
      expect(adapter.isOnline()).toBe(true);
      expect(adapter.getState().isOnline).toBe(true);

      unsubscribe();
    });

    it("não deve disparar eventos de conectividade após destroy()", () => {
      const windowTarget = new EventTarget();
      const adapter = new ServiceWorkerAdapter({
        windowTarget,
        navigatorTarget: { onLine: true },
      });

      const listener = vi.fn();
      adapter.subscribe(listener);

      adapter.destroy();

      windowTarget.dispatchEvent(new Event("offline"));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("Registro do Service Worker (register)", () => {
    it("deve retornar status { isSupported: false, isRegistered: false } de forma resiliente quando não suportado", async () => {
      const adapter = new ServiceWorkerAdapter({
        windowTarget: new EventTarget(),
        navigatorTarget: {},
      });

      const result = await adapter.register();
      expect(result).toEqual({
        isSupported: false,
        isRegistered: false,
        registration: null,
      });
      expect(adapter.getState().status).toBe(SERVICE_WORKER_STATUS.UNSUPPORTED);
    });

    it("deve registrar o Service Worker com sucesso e configurar listeners de ciclo de vida", async () => {
      const mockRegistration = new EventTarget();
      mockRegistration.scope = "./";
      mockRegistration.waiting = null;
      mockRegistration.active = { state: "activated" };
      mockRegistration.update = vi.fn().mockResolvedValue(mockRegistration);
      mockRegistration.unregister = vi.fn().mockResolvedValue(true);

      const mockServiceWorker = new EventTarget();
      mockServiceWorker.register = vi.fn().mockResolvedValue(mockRegistration);

      const adapter = new ServiceWorkerAdapter({
        windowTarget: new EventTarget(),
        navigatorTarget: {
          serviceWorker: mockServiceWorker,
          onLine: true,
        },
        scriptUrl: "./sw.js",
        scope: "./",
      });

      const listener = vi.fn();
      adapter.subscribe(listener);

      const result = await adapter.register();

      expect(mockServiceWorker.register).toHaveBeenCalledWith("./sw.js", {
        scope: "./",
        type: "module",
      });
      expect(result.isRegistered).toBe(true);
      expect(result.registration).toBe(mockRegistration);
      expect(adapter.isRegistered()).toBe(true);
      expect(adapter.getRegistration()).toBe(mockRegistration);
      expect(adapter.getState().status).toBe(SERVICE_WORKER_STATUS.REGISTERED);
      expect(listener).toHaveBeenCalled();
    });

    it("deve detectar atualizações pendentes (updatefound / waiting worker)", async () => {
      const mockRegistration = new EventTarget();
      mockRegistration.waiting = null;
      mockRegistration.installing = null;

      const mockServiceWorker = new EventTarget();
      mockServiceWorker.register = vi.fn().mockResolvedValue(mockRegistration);

      const adapter = new ServiceWorkerAdapter({
        windowTarget: new EventTarget(),
        navigatorTarget: {
          serviceWorker: mockServiceWorker,
          onLine: true,
        },
      });

      await adapter.register();
      expect(adapter.hasUpdate()).toBe(false);

      // Simula worker novo instalando e entrando em waiting
      const installingWorker = new EventTarget();
      installingWorker.state = "installed";
      mockRegistration.installing = installingWorker;
      mockRegistration.dispatchEvent(new Event("updatefound"));

      // Quando o installingWorker mudar de estado para installed
      mockRegistration.waiting = installingWorker;
      installingWorker.dispatchEvent(new Event("statechange"));

      expect(adapter.hasUpdate()).toBe(true);
      expect(adapter.getState().hasUpdate).toBe(true);
    });

    it("deve lançar ServiceWorkerAdapterError quando register rejeitar", async () => {
      const mockServiceWorker = new EventTarget();
      const originalError = new Error("Script not found");
      mockServiceWorker.register = vi.fn().mockRejectedValue(originalError);

      const adapter = new ServiceWorkerAdapter({
        windowTarget: new EventTarget(),
        navigatorTarget: {
          serviceWorker: mockServiceWorker,
          onLine: true,
        },
      });

      await expect(adapter.register()).rejects.toThrow(
        ServiceWorkerAdapterError,
      );
      expect(adapter.getState().status).toBe(SERVICE_WORKER_STATUS.ERROR);
      expect(adapter.isRegistered()).toBe(false);
    });
  });

  describe("Operações de Ciclo de Vida: update, unregister e skipWaiting", () => {
    it("update deve invocar registration.update() e retornar true", async () => {
      const mockRegistration = {
        update: vi.fn().mockResolvedValue({}),
      };
      const mockServiceWorker = new EventTarget();
      mockServiceWorker.register = vi.fn().mockResolvedValue(mockRegistration);

      const adapter = new ServiceWorkerAdapter({
        windowTarget: new EventTarget(),
        navigatorTarget: { serviceWorker: mockServiceWorker },
      });

      await adapter.register();
      const updated = await adapter.update();

      expect(updated).toBe(true);
      expect(mockRegistration.update).toHaveBeenCalled();
    });

    it("update deve lançar erro se executado sem registro ativo", async () => {
      const adapter = new ServiceWorkerAdapter({
        navigatorTarget: {},
      });

      await expect(adapter.update()).rejects.toThrow(ServiceWorkerAdapterError);
    });

    it("unregister deve desregistrar com sucesso e sincronizar o estado", async () => {
      const mockRegistration = new EventTarget();
      mockRegistration.unregister = vi.fn().mockResolvedValue(true);

      const mockServiceWorker = new EventTarget();
      mockServiceWorker.register = vi.fn().mockResolvedValue(mockRegistration);

      const adapter = new ServiceWorkerAdapter({
        windowTarget: new EventTarget(),
        navigatorTarget: { serviceWorker: mockServiceWorker },
      });

      await adapter.register();
      expect(adapter.isRegistered()).toBe(true);

      const unregisterResult = await adapter.unregister();
      expect(unregisterResult).toBe(true);
      expect(mockRegistration.unregister).toHaveBeenCalled();
      expect(adapter.isRegistered()).toBe(false);
      expect(adapter.getRegistration()).toBeNull();
      expect(adapter.getState().status).toBe(
        SERVICE_WORKER_STATUS.UNREGISTERED,
      );
    });

    it("unregister deve retornar false se não houver registro ativo", async () => {
      const adapter = new ServiceWorkerAdapter({
        navigatorTarget: {},
      });

      const unregisterResult = await adapter.unregister();
      expect(unregisterResult).toBe(false);
    });

    it("skipWaiting deve postar mensagem SKIP_WAITING para waiting worker", async () => {
      const postMessage = vi.fn();
      const mockWaitingWorker = { postMessage };
      const mockRegistration = new EventTarget();
      mockRegistration.waiting = mockWaitingWorker;

      const mockServiceWorker = new EventTarget();
      mockServiceWorker.register = vi.fn().mockResolvedValue(mockRegistration);

      const adapter = new ServiceWorkerAdapter({
        navigatorTarget: { serviceWorker: mockServiceWorker },
      });

      await adapter.register();
      const dispatched = adapter.skipWaiting();

      expect(dispatched).toBe(true);
      expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    });

    it("skipWaiting deve retornar false se não houver waiting worker", async () => {
      const mockRegistration = new EventTarget();
      mockRegistration.waiting = null;

      const mockServiceWorker = new EventTarget();
      mockServiceWorker.register = vi.fn().mockResolvedValue(mockRegistration);

      const adapter = new ServiceWorkerAdapter({
        navigatorTarget: { serviceWorker: mockServiceWorker },
      });

      await adapter.register();
      expect(adapter.skipWaiting()).toBe(false);
    });
  });

  describe("Validação de Subscrição", () => {
    it("deve lançar erro ao passar listener que não é função", () => {
      const adapter = new ServiceWorkerAdapter();

      expect(() => adapter.subscribe(null)).toThrow(ServiceWorkerAdapterError);
      expect(() => adapter.subscribe("invalid")).toThrow(
        ServiceWorkerAdapterError,
      );
    });
  });

  describe("Casos de Borda e Ciclo de Vida Avançado", () => {
    it("createServiceWorkerAdapter deve instanciar ServiceWorkerAdapter corretamente", () => {
      const adapter = createServiceWorkerAdapter({
        scriptUrl: "./custom-sw.js",
      });
      expect(adapter).toBeInstanceOf(ServiceWorkerAdapter);
      expect(adapter.getState().scriptUrl).toBe("./custom-sw.js");
    });

    it("handleNetworkChange não deve sincronizar estado quando destruído", () => {
      const adapter = new ServiceWorkerAdapter();
      adapter.destroyed = true;
      const syncSpy = vi.spyOn(adapter, "syncState");

      adapter.handleNetworkChange(true);
      expect(syncSpy).not.toHaveBeenCalled();
    });

    it("handleUpdateFound deve ignorar se destruído, sem registro ou sem installingWorker", () => {
      const adapter = new ServiceWorkerAdapter();
      const syncSpy = vi.spyOn(adapter, "syncState");

      // Sem registration
      adapter.handleUpdateFound();
      expect(syncSpy).not.toHaveBeenCalled();

      // Com registration mas sem installing worker
      adapter.registration = new EventTarget();
      adapter.registration.installing = null;
      adapter.handleUpdateFound();
      expect(syncSpy).not.toHaveBeenCalled();

      // Com installing worker mas adapter destruído
      adapter.destroyed = true;
      adapter.handleUpdateFound();
      expect(syncSpy).not.toHaveBeenCalled();
    });

    it("handleUpdateFound deve ignorar mudança de estado para valores diferentes de installed", () => {
      const adapter = new ServiceWorkerAdapter();
      const mockRegistration = new EventTarget();
      const installingWorker = new EventTarget();
      installingWorker.state = "installing";

      mockRegistration.installing = installingWorker;
      mockRegistration.waiting = null;
      adapter.registration = mockRegistration;

      adapter.handleUpdateFound();

      const syncSpy = vi.spyOn(adapter, "syncState");
      installingWorker.dispatchEvent(new Event("statechange"));

      expect(syncSpy).not.toHaveBeenCalled();
    });

    it("destroy deve remover listener de registration quando este estiver presente", async () => {
      const mockRegistration = new EventTarget();
      const removeListenerSpy = vi.spyOn(
        mockRegistration,
        "removeEventListener",
      );
      const mockServiceWorker = new EventTarget();
      mockServiceWorker.register = vi.fn().mockResolvedValue(mockRegistration);

      const adapter = new ServiceWorkerAdapter({
        navigatorTarget: { serviceWorker: mockServiceWorker },
      });

      await adapter.register();
      adapter.destroy();

      expect(removeListenerSpy).toHaveBeenCalledWith(
        "updatefound",
        expect.any(Function),
      );
    });
  });
});
