import {
  APP_ROUTES,
  initAppRouter,
  setupNavigationInterception,
  setupRouteAccessibility,
} from "../router/app-router.js";
import {
  bindServicesToRoot,
  createAppServices,
  registerInjectables,
} from "../di/container.js";

/**
 * Inicializa a aplicação Manda um PIX:
 * - Registra o Service Worker (se habilitado)
 * - Cria e registra adaptadores e casos de uso no contêiner DI
 * - Inicializa o roteador SPA no contêiner outlet
 * - Conecta a interceptação de cliques e acessibilidade de rotas
 *
 * @param {HTMLElement|null} [rootElement]
 * @param {Object} [options={}]
 * @returns {HTMLElement|null}
 */
export function bootstrapApp(
  rootElement = typeof document !== "undefined"
    ? document.querySelector("#app")
    : null,
  {
    windowTarget = typeof window !== "undefined" ? window : globalThis.window,
    navigatorTarget = typeof navigator !== "undefined"
      ? navigator
      : globalThis.navigator,
    autoRegisterServiceWorker = true,
    serviceWorkerAdapter = null,
    pwaInstallAdapter = null,
    installPwaUseCase = null,
    browserShareGateway = null,
    pixKeyRepository = null,
    generatePixChargeUseCase = null,
    distributePixChargeUseCase = null,
    savePixKeyUseCase = null,
    listPixKeysUseCase = null,
    selectPixKeyUseCase = null,
    deletePixKeyUseCase = null,
    appRouter = null,
    routes = APP_ROUTES,
  } = {},
) {
  if (!rootElement) {
    return null;
  }

  rootElement.dataset.initialized = "true";

  const services = createAppServices({
    windowTarget,
    navigatorTarget,
    overrides: {
      serviceWorkerAdapter,
      pwaInstallAdapter,
      installPwaUseCase,
      browserShareGateway,
      pixKeyRepository,
      generatePixChargeUseCase,
      distributePixChargeUseCase,
      savePixKeyUseCase,
      listPixKeysUseCase,
      selectPixKeyUseCase,
      deletePixKeyUseCase,
      appRouter,
    },
  });

  if (services.serviceWorkerAdapter && autoRegisterServiceWorker) {
    const registerWorker = () => {
      services.serviceWorkerAdapter.register().catch(() => {
        // Falha no registro é tolerada sem quebrar a inicialização da aplicação
      });
    };

    if (
      windowTarget?.document?.readyState === "complete" ||
      !windowTarget?.addEventListener
    ) {
      registerWorker();
    } else {
      windowTarget.addEventListener("load", registerWorker, { once: true });
    }
  }

  const outletElement = rootElement.querySelector("#router-outlet");
  let router = services.appRouter;
  if (!router && outletElement) {
    router = initAppRouter(outletElement, routes);
    services.appRouter = router;
  }

  const ownerDoc =
    rootElement.ownerDocument ||
    (typeof document !== "undefined" ? document : null);

  if (ownerDoc) {
    registerInjectables(ownerDoc, services);
  }

  bindServicesToRoot(rootElement, services);

  const headerElement = rootElement.querySelector("app-header");
  if (headerElement) {
    headerElement.installPwaUseCase = services.installPwaUseCase;
  }

  setupNavigationInterception(rootElement);

  setupRouteAccessibility({
    rootElement,
    outletElement,
    ownerDoc,
    windowTarget,
  });

  return rootElement;
}

