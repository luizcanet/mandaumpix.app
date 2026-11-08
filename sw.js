export const CACHE_VERSION = "v1.0.1";
export const PRECACHE_NAME = `mandaumpix-${CACHE_VERSION}-precache`;
export const RUNTIME_CACHE_NAME = `mandaumpix-${CACHE_VERSION}-runtime`;

export const PRECACHE_ASSETS = Object.freeze([
  "./",
  "./index.html",
  "./manifest.json",
  "./src/main.js",
  "./src/assets/icons/icon.svg",
  "./src/assets/icons/icon-192.png",
  "./src/assets/icons/apple-touch-icon.png",
]);

export function isServiceWorkerScriptRequest(request) {
  if (!request?.url) {
    return false;
  }
  return /(?:^|\/)sw\.js(?:\?.*)?$/i.test(request.url);
}

export function isNavigationRequest(request) {
  if (!request) {
    return false;
  }
  if (request.mode === "navigate") {
    return true;
  }
  const acceptHeader = request.headers?.get("accept") || "";
  return acceptHeader.includes("text/html");
}

export function isStaticAssetRequest(request) {
  if (!request?.url) {
    return false;
  }

  const destination = request.destination;
  if (
    destination === "style" ||
    destination === "script" ||
    destination === "image" ||
    destination === "font"
  ) {
    return true;
  }

  if (request.url.includes("ga.jspm.io")) {
    return true;
  }

  return /\.(?:js|css|svg|png|json|ico|woff2?)(?:\?.*)?$/i.test(request.url);
}

export async function precacheResources(cache, assets = PRECACHE_ASSETS) {
  try {
    await cache.addAll(assets);
  } catch {
    await Promise.allSettled(
      assets.map(async (asset) => {
        try {
          await cache.add(asset);
        } catch {
          // Mantém resiliência caso algum ativo opcional falhe
        }
      }),
    );
  }
}

export function handleInstallEvent(
  event,
  {
    cacheName = PRECACHE_NAME,
    assets = PRECACHE_ASSETS,
    cacheStorage = globalThis.caches,
    swScope = globalThis,
  } = {},
) {
  if (typeof swScope?.skipWaiting === "function") {
    swScope.skipWaiting();
  }

  if (typeof event?.waitUntil === "function" && cacheStorage) {
    const installPromise = (async () => {
      const cache = await cacheStorage.open(cacheName);
      await precacheResources(cache, assets);
    })();
    event.waitUntil(installPromise);
    return installPromise;
  }
}

export function handleActivateEvent(
  event,
  {
    activeCacheNames = [PRECACHE_NAME, RUNTIME_CACHE_NAME],
    cacheStorage = globalThis.caches,
    swScope = globalThis,
  } = {},
) {
  if (typeof swScope?.clients?.claim === "function") {
    swScope.clients.claim();
  }

  if (typeof event?.waitUntil === "function" && cacheStorage) {
    const activatePromise = (async () => {
      const existingKeys = await cacheStorage.keys();
      const deletions = existingKeys
        .filter((key) => !activeCacheNames.includes(key))
        .map((key) => cacheStorage.delete(key));
      await Promise.all(deletions);
    })();
    event.waitUntil(activatePromise);
    return activatePromise;
  }
}

export async function fetchNetworkFirst(
  request,
  {
    cacheName = PRECACHE_NAME,
    fallbackUrl = "./index.html",
    cacheStorage = globalThis.caches,
    fetchTarget = globalThis.fetch,
  } = {},
) {
  try {
    const networkResponse = await fetchTarget(request);
    if (networkResponse && networkResponse.ok && cacheStorage) {
      try {
        const cache = await cacheStorage.open(cacheName);
        await cache.put(request, networkResponse.clone());
      } catch {
        // Ignora erros de escrita no cache
      }
    }
    return networkResponse;
  } catch {
    if (cacheStorage) {
      const cached =
        (await cacheStorage.match(request)) ||
        (await cacheStorage.match(fallbackUrl)) ||
        (await cacheStorage.match("./"));
      if (cached) {
        return cached;
      }
    }
    throw new Error(
      `Falha de rede e recurso não disponível em cache para ${request.url}`,
    );
  }
}

export async function fetchCacheFirstOrStaleWhileRevalidate(
  request,
  {
    runtimeCacheName = RUNTIME_CACHE_NAME,
    cacheStorage = globalThis.caches,
    fetchTarget = globalThis.fetch,
  } = {},
) {
  let cachedResponse = null;
  if (cacheStorage) {
    try {
      cachedResponse = await cacheStorage.match(request);
    } catch {
      cachedResponse = null;
    }
  }

  const networkFetchPromise = (async () => {
    try {
      const networkResponse = await fetchTarget(request);
      if (
        networkResponse &&
        (networkResponse.ok || networkResponse.type === "opaque") &&
        cacheStorage
      ) {
        try {
          const cache = await cacheStorage.open(runtimeCacheName);
          await cache.put(request, networkResponse.clone());
        } catch {
          // Ignora falhas de escrita
        }
      }
      return networkResponse;
    } catch (error) {
      if (!cachedResponse) {
        throw error;
      }
      return cachedResponse;
    }
  })();

  if (cachedResponse) {
    networkFetchPromise.catch(() => null);
    return cachedResponse;
  }

  return networkFetchPromise;
}

export function handleFetchEvent(
  event,
  {
    precacheName = PRECACHE_NAME,
    runtimeCacheName = RUNTIME_CACHE_NAME,
    cacheStorage = globalThis.caches,
    fetchTarget = globalThis.fetch,
  } = {},
) {
  const request = event?.request;
  if (!request || request.method !== "GET") {
    return;
  }

  if (isServiceWorkerScriptRequest(request)) {
    return;
  }

  if (!request.url.startsWith("http")) {
    return;
  }

  if (isNavigationRequest(request)) {
    if (typeof event.respondWith === "function") {
      event.respondWith(
        fetchNetworkFirst(request, {
          cacheName: precacheName,
          cacheStorage,
          fetchTarget,
        }),
      );
    }
    return;
  }

  if (isStaticAssetRequest(request)) {
    if (typeof event.respondWith === "function") {
      event.respondWith(
        fetchCacheFirstOrStaleWhileRevalidate(request, {
          runtimeCacheName,
          cacheStorage,
          fetchTarget,
        }),
      );
    }
  }
}

export function registerServiceWorkerListeners(
  swScope = globalThis,
  {
    cacheStorage = swScope?.caches || globalThis.caches,
    fetchTarget = swScope?.fetch || globalThis.fetch,
  } = {},
) {
  if (!swScope || typeof swScope.addEventListener !== "function") {
    return;
  }

  swScope.addEventListener("install", (event) => {
    handleInstallEvent(event, {
      cacheName: PRECACHE_NAME,
      assets: PRECACHE_ASSETS,
      cacheStorage,
      swScope,
    });
  });

  swScope.addEventListener("activate", (event) => {
    handleActivateEvent(event, {
      activeCacheNames: [PRECACHE_NAME, RUNTIME_CACHE_NAME],
      cacheStorage,
      swScope,
    });
  });

  swScope.addEventListener("fetch", (event) => {
    handleFetchEvent(event, {
      precacheName: PRECACHE_NAME,
      runtimeCacheName: RUNTIME_CACHE_NAME,
      cacheStorage,
      fetchTarget,
    });
  });

  swScope.addEventListener("message", (event) => {
    if (event?.data?.type === "SKIP_WAITING") {
      if (typeof swScope.skipWaiting === "function") {
        swScope.skipWaiting();
      }
    }
  });
}

if (
  typeof self !== "undefined" &&
  typeof self.addEventListener === "function" &&
  typeof importScripts === "function"
) {
  registerServiceWorkerListeners(self);
}
