import { describe, expect, it, vi } from "vitest";
import {
  CACHE_VERSION,
  PRECACHE_ASSETS,
  PRECACHE_NAME,
  RUNTIME_CACHE_NAME,
  fetchCacheFirstOrStaleWhileRevalidate,
  fetchNetworkFirst,
  handleActivateEvent,
  handleFetchEvent,
  handleInstallEvent,
  isNavigationRequest,
  isServiceWorkerScriptRequest,
  isStaticAssetRequest,
  precacheResources,
  registerServiceWorkerListeners,
} from "../../../sw.js";

describe("Service Worker (sw.js) & Offline Strategies", () => {
  describe("Constantes e Lista de Pré-cache", () => {
    it("deve exportar versão e nomes de caches estruturados", () => {
      expect(CACHE_VERSION).toBe("1.0.0");
      expect(PRECACHE_NAME).toBe("mandaumpix-1.0.0-precache");
      expect(RUNTIME_CACHE_NAME).toBe("mandaumpix-1.0.0-runtime");
    });

    it("PRECACHE_ASSETS deve conter ativos essenciais da App Shell", () => {
      expect(Array.isArray(PRECACHE_ASSETS)).toBe(true);
      expect(Object.isFrozen(PRECACHE_ASSETS)).toBe(true);
      expect(PRECACHE_ASSETS).toContain("./");
      expect(PRECACHE_ASSETS).toContain("./index.html");
      expect(PRECACHE_ASSETS).toContain("./manifest.json");
      expect(PRECACHE_ASSETS).toContain("./src/main.js");
      expect(PRECACHE_ASSETS).toContain("./src/assets/icons/icon.svg");
      expect(PRECACHE_ASSETS).toContain("./src/assets/icons/icon-192.png");
      expect(PRECACHE_ASSETS).toContain(
        "./src/assets/icons/apple-touch-icon.png",
      );
    });
  });

  describe("Classificadores de Requisição", () => {
    it("deve lidar com valores nulos ou vazios de forma segura", () => {
      expect(isServiceWorkerScriptRequest(null)).toBe(false);
      expect(isNavigationRequest(null)).toBe(false);
      expect(isStaticAssetRequest(null)).toBe(false);
    });

    it("isServiceWorkerScriptRequest deve identificar requisição para o sw.js", () => {
      expect(
        isServiceWorkerScriptRequest(
          new Request("https://mandaumpix.app/sw.js"),
        ),
      ).toBe(true);
      expect(
        isServiceWorkerScriptRequest(
          new Request("https://mandaumpix.app/src/main.js"),
        ),
      ).toBe(false);
    });

    it("isNavigationRequest deve identificar requisições de página/HTML", () => {
      const navigateRequest = {
        url: "https://mandaumpix.app/",
        mode: "navigate",
        headers: new Headers(),
      };
      const htmlRequest = new Request("https://mandaumpix.app/sobre", {
        headers: { accept: "text/html,application/xhtml+xml" },
      });
      const jsonRequest = new Request("https://mandaumpix.app/manifest.json", {
        headers: { accept: "application/json" },
      });

      expect(isNavigationRequest(navigateRequest)).toBe(true);
      expect(isNavigationRequest(htmlRequest)).toBe(true);
      expect(isNavigationRequest(jsonRequest)).toBe(false);
    });

    it("isStaticAssetRequest deve identificar scripts, estilos, imagens e CDN JSPM", () => {
      expect(
        isStaticAssetRequest(new Request("https://mandaumpix.app/src/main.js")),
      ).toBe(true);
      expect(
        isStaticAssetRequest(
          new Request("https://mandaumpix.app/src/assets/icons/icon.svg"),
        ),
      ).toBe(true);
      expect(
        isStaticAssetRequest(
          new Request(
            "https://ga.jspm.io/npm:@modnes/custom-element@1.1.0/custom-element.js",
          ),
        ),
      ).toBe(true);
      expect(
        isStaticAssetRequest(new Request("https://mandaumpix.app/api/status")),
      ).toBe(false);
    });
  });

  describe("precacheResources", () => {
    it("deve usar cache.addAll quando este for bem-sucedido", async () => {
      const cache = {
        addAll: vi.fn().mockResolvedValue(undefined),
      };

      await precacheResources(cache, ["./index.html", "./manifest.json"]);
      expect(cache.addAll).toHaveBeenCalledWith([
        "./index.html",
        "./manifest.json",
      ]);
    });

    it("deve fazer fallback com Promise.allSettled caso addAll falhe e tratar falha de add individual", async () => {
      const cache = {
        addAll: vi.fn().mockRejectedValue(new Error("Network failure")),
        add: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error("Individual asset failure")),
      };

      await precacheResources(cache, ["./index.html", "./failed.json"]);
      expect(cache.add).toHaveBeenCalledTimes(2);
    });
  });

  describe("handleInstallEvent", () => {
    it("deve invocar skipWaiting, abrir o cache e pré-carregar ativos", async () => {
      const mockCache = {
        addAll: vi.fn().mockResolvedValue(undefined),
      };
      const mockCacheStorage = {
        open: vi.fn().mockResolvedValue(mockCache),
      };
      const mockSwScope = {
        skipWaiting: vi.fn(),
      };
      const mockEvent = {
        waitUntil: vi.fn((promise) => promise),
      };

      await handleInstallEvent(mockEvent, {
        cacheName: "test-precache",
        assets: ["./index.html"],
        cacheStorage: mockCacheStorage,
        swScope: mockSwScope,
      });

      expect(mockSwScope.skipWaiting).toHaveBeenCalled();
      expect(mockCacheStorage.open).toHaveBeenCalledWith("test-precache");
      expect(mockCache.addAll).toHaveBeenCalledWith(["./index.html"]);
      expect(mockEvent.waitUntil).toHaveBeenCalled();
    });
  });

  describe("handleActivateEvent", () => {
    it("deve invocar clients.claim e deletar caches legados", async () => {
      const mockCacheStorage = {
        keys: vi
          .fn()
          .mockResolvedValue([
            "mandaumpix-v0.9.0-precache",
            "mandaumpix-1.0.0-precache",
            "mandaumpix-1.0.0-runtime",
          ]),
        delete: vi.fn().mockResolvedValue(true),
      };
      const mockSwScope = {
        clients: {
          claim: vi.fn(),
        },
      };
      const mockEvent = {
        waitUntil: vi.fn((promise) => promise),
      };

      await handleActivateEvent(mockEvent, {
        activeCacheNames: [
          "mandaumpix-1.0.0-precache",
          "mandaumpix-1.0.0-runtime",
        ],
        cacheStorage: mockCacheStorage,
        swScope: mockSwScope,
      });

      expect(mockSwScope.clients.claim).toHaveBeenCalled();
      expect(mockCacheStorage.delete).toHaveBeenCalledWith(
        "mandaumpix-v0.9.0-precache",
      );
      expect(mockCacheStorage.delete).not.toHaveBeenCalledWith(
        "mandaumpix-1.0.0-precache",
      );
      expect(mockCacheStorage.delete).not.toHaveBeenCalledWith(
        "mandaumpix-1.0.0-runtime",
      );
      expect(mockEvent.waitUntil).toHaveBeenCalled();
    });
  });

  describe("Estratégias de Fetch: Network-First & Stale-While-Revalidate", () => {
    it("fetchNetworkFirst deve retornar resposta da rede quando disponível", async () => {
      const mockNetworkResponse = new Response("<h1>Online HTML</h1>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
      const fetchFn = vi.fn().mockResolvedValue(mockNetworkResponse);
      const mockCacheStorage = {
        open: vi.fn().mockResolvedValue({
          put: vi.fn().mockResolvedValue(undefined),
        }),
        match: vi.fn(),
      };

      const request = new Request("https://mandaumpix.app/");
      const response = await fetchNetworkFirst(request, {
        cacheStorage: mockCacheStorage,
        fetchTarget: fetchFn,
      });

      expect(response).toBe(mockNetworkResponse);
      expect(fetchFn).toHaveBeenCalledWith(request);
    });

    it("fetchNetworkFirst deve retornar resposta do cache quando a rede falhar", async () => {
      const mockCachedResponse = new Response("<h1>Offline HTML</h1>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
      const fetchFn = vi.fn().mockRejectedValue(new Error("Offline"));
      const mockCacheStorage = {
        match: vi.fn().mockResolvedValue(mockCachedResponse),
      };

      const request = new Request("https://mandaumpix.app/");
      const response = await fetchNetworkFirst(request, {
        cacheStorage: mockCacheStorage,
        fetchTarget: fetchFn,
        fallbackUrl: "./index.html",
      });

      expect(response).toBe(mockCachedResponse);
      expect(mockCacheStorage.match).toHaveBeenCalled();
    });

    it("fetchCacheFirstOrStaleWhileRevalidate deve retornar do cache imediatamente e atualizar em background", async () => {
      const mockCachedResponse = new Response("console.log('cached');", {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
      const mockNetworkResponse = new Response("console.log('fresh');", {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
      const mockRuntimeCache = {
        put: vi.fn().mockResolvedValue(undefined),
      };
      const mockCacheStorage = {
        match: vi.fn().mockResolvedValue(mockCachedResponse),
        open: vi.fn().mockResolvedValue(mockRuntimeCache),
      };
      const fetchFn = vi.fn().mockResolvedValue(mockNetworkResponse);

      const request = new Request("https://mandaumpix.app/src/main.js");
      const response = await fetchCacheFirstOrStaleWhileRevalidate(request, {
        cacheStorage: mockCacheStorage,
        fetchTarget: fetchFn,
      });

      expect(response).toBe(mockCachedResponse);
      expect(fetchFn).toHaveBeenCalledWith(request);
    });

    it("fetchCacheFirstOrStaleWhileRevalidate deve retornar do cache mesmo se a atualização em background rejeitar", async () => {
      const mockCachedResponse = new Response("console.log('cached');", {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
      const mockCacheStorage = {
        match: vi.fn().mockResolvedValue(mockCachedResponse),
      };
      const fetchFn = vi
        .fn()
        .mockRejectedValue(new Error("Background offline"));

      const request = new Request("https://mandaumpix.app/src/main.js");
      const response = await fetchCacheFirstOrStaleWhileRevalidate(request, {
        cacheStorage: mockCacheStorage,
        fetchTarget: fetchFn,
      });

      expect(response).toBe(mockCachedResponse);
    });

    it("fetchNetworkFirst deve lançar erro se a rede falhar e não houver cache", async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error("Network down"));
      const mockCacheStorage = {
        match: vi.fn().mockResolvedValue(null),
      };

      const request = new Request("https://mandaumpix.app/unknown");
      await expect(
        fetchNetworkFirst(request, {
          cacheStorage: mockCacheStorage,
          fetchTarget: fetchFn,
        }),
      ).rejects.toThrow("Falha de rede e recurso não disponível em cache");
    });

    it("fetchCacheFirstOrStaleWhileRevalidate deve buscar na rede e salvar no cache caso não esteja em cache", async () => {
      const mockNetworkResponse = new Response("console.log('downloaded');", {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
      const mockRuntimeCache = {
        put: vi.fn().mockResolvedValue(undefined),
      };
      const mockCacheStorage = {
        match: vi.fn().mockResolvedValue(null),
        open: vi.fn().mockResolvedValue(mockRuntimeCache),
      };
      const fetchFn = vi.fn().mockResolvedValue(mockNetworkResponse);

      const request = new Request("https://mandaumpix.app/src/main.js");
      const response = await fetchCacheFirstOrStaleWhileRevalidate(request, {
        cacheStorage: mockCacheStorage,
        fetchTarget: fetchFn,
      });

      expect(response).toBe(mockNetworkResponse);
      expect(mockRuntimeCache.put).toHaveBeenCalled();
    });

    it("fetchCacheFirstOrStaleWhileRevalidate deve lançar erro quando miss de cache e fetch rejeitar", async () => {
      const mockCacheStorage = {
        match: vi.fn().mockResolvedValue(null),
      };
      const fetchFn = vi.fn().mockRejectedValue(new Error("Offline asset"));

      const request = new Request("https://mandaumpix.app/src/missing.js");
      await expect(
        fetchCacheFirstOrStaleWhileRevalidate(request, {
          cacheStorage: mockCacheStorage,
          fetchTarget: fetchFn,
        }),
      ).rejects.toThrow("Offline asset");
    });
  });

  describe("handleFetchEvent", () => {
    it("deve ignorar requisições não-GET", () => {
      const mockEvent = {
        request: new Request("https://mandaumpix.app/api", { method: "POST" }),
        respondWith: vi.fn(),
      };

      handleFetchEvent(mockEvent, { fetchTarget: vi.fn() });
      expect(mockEvent.respondWith).not.toHaveBeenCalled();
    });

    it("deve ignorar requisições do próprio sw.js", () => {
      const mockEvent = {
        request: new Request("https://mandaumpix.app/sw.js"),
        respondWith: vi.fn(),
      };

      handleFetchEvent(mockEvent, { fetchTarget: vi.fn() });
      expect(mockEvent.respondWith).not.toHaveBeenCalled();
    });

    it("deve ignorar requisições com esquemas não-HTTP (ex: data:, blob:)", () => {
      const mockEvent = {
        request: {
          url: "data:image/svg+xml;utf8,<svg></svg>",
          method: "GET",
        },
        respondWith: vi.fn(),
      };

      handleFetchEvent(mockEvent, { fetchTarget: vi.fn() });
      expect(mockEvent.respondWith).not.toHaveBeenCalled();
    });

    it("deve chamar respondWith com fetchNetworkFirst para requisições de navegação", () => {
      const mockEvent = {
        request: {
          url: "https://mandaumpix.app/",
          method: "GET",
          mode: "navigate",
          headers: new Headers(),
        },
        respondWith: vi.fn(),
      };

      handleFetchEvent(mockEvent, { fetchTarget: vi.fn() });
      expect(mockEvent.respondWith).toHaveBeenCalled();
    });

    it("deve chamar respondWith com fetchCacheFirstOrStaleWhileRevalidate para ativos estáticos", () => {
      const mockEvent = {
        request: new Request("https://mandaumpix.app/src/main.js"),
        respondWith: vi.fn(),
      };

      handleFetchEvent(mockEvent, {
        fetchTarget: vi.fn().mockResolvedValue(new Response("console.log(1)")),
      });
      expect(mockEvent.respondWith).toHaveBeenCalled();
    });
  });

  describe("registerServiceWorkerListeners", () => {
    it("deve retornar imediatamente se swScope for inválido", () => {
      expect(() => registerServiceWorkerListeners(null)).not.toThrow();
      expect(() => registerServiceWorkerListeners({})).not.toThrow();
    });

    it("deve registrar os listeners install, activate, fetch e message no swScope e acionar callbacks", () => {
      const listeners = {};
      const mockSwScope = {
        addEventListener: vi.fn((event, handler) => {
          listeners[event] = handler;
        }),
        skipWaiting: vi.fn(),
        clients: { claim: vi.fn() },
        caches: {
          open: vi.fn().mockResolvedValue({ addAll: vi.fn() }),
          keys: vi.fn().mockResolvedValue([]),
        },
        fetch: vi.fn().mockResolvedValue(new Response()),
      };

      registerServiceWorkerListeners(mockSwScope);

      expect(mockSwScope.addEventListener).toHaveBeenCalledWith(
        "install",
        expect.any(Function),
      );
      expect(mockSwScope.addEventListener).toHaveBeenCalledWith(
        "activate",
        expect.any(Function),
      );
      expect(mockSwScope.addEventListener).toHaveBeenCalledWith(
        "fetch",
        expect.any(Function),
      );
      expect(mockSwScope.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );

      // Simula evento install
      const mockInstallEvent = { waitUntil: vi.fn() };
      listeners.install(mockInstallEvent);
      expect(mockInstallEvent.waitUntil).toHaveBeenCalled();

      // Simula evento activate
      const mockActivateEvent = { waitUntil: vi.fn() };
      listeners.activate(mockActivateEvent);
      expect(mockActivateEvent.waitUntil).toHaveBeenCalled();

      // Simula evento fetch
      const mockFetchEvent = {
        request: new Request("https://mandaumpix.app/api", { method: "POST" }),
        respondWith: vi.fn(),
      };
      listeners.fetch(mockFetchEvent);

      // Simula evento message com SKIP_WAITING
      listeners.message({ data: { type: "SKIP_WAITING" } });
      expect(mockSwScope.skipWaiting).toHaveBeenCalled();

      // Simula evento message sem SKIP_WAITING
      listeners.message({ data: { type: "OTHER" } });
    });
  });
});
