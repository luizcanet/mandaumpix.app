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

  let dialogElement = rootElement.querySelector("pix-key-dialog");
  if (!dialogElement) {
    dialogElement = document.createElement("pix-key-dialog");
    rootElement.appendChild(dialogElement);
  }
  if (dialogElement) {
    dialogElement.savePixKeyUseCase = services.savePixKeyUseCase;
    dialogElement.pixKeyRepository = services.pixKeyRepository;
  }

  setupNavigationInterception(rootElement);

  setupRouteAccessibility({
    rootElement,
    outletElement,
    ownerDoc,
    windowTarget,
  });

  const ensureChargePagePopulated = () => {
    const chargePage = outletElement?.querySelector(".charge-page");
    if (chargePage) {
      populateChargePage(chargePage, services);
    }
  };

  ensureChargePagePopulated();

  if (windowTarget?.addEventListener) {
    windowTarget.addEventListener("pathChanged", ensureChargePagePopulated);
    windowTarget.addEventListener("popstate", ensureChargePagePopulated);
  }

  return rootElement;
}

/**
 * Popula a página principal de cobrança (.charge-page) com as colunas de formulário
 * e resultado, integrando o chaveamento reativo entre <pix-key-empty> e <pix-key-selector>.
 *
 * @param {HTMLElement} chargePageElement - Elemento container da página de cobrança
 * @param {Object} [services={}] - Serviços injetados da aplicação
 */
export function populateChargePage(chargePageElement, services = {}) {
  if (!chargePageElement) {
    return;
  }

  let emptyElement = chargePageElement.querySelector("pix-key-empty");
  let selectorElement = chargePageElement.querySelector("pix-key-selector");
  let formElement = chargePageElement.querySelector("pix-charge-form");
  let resultElement = chargePageElement.querySelector("pix-charge-result");

  if (!formElement || !resultElement) {
    chargePageElement.replaceChildren();

    const formColumn = document.createElement("div");
    formColumn.className = "charge-page__column charge-page__column--form";

    emptyElement = document.createElement("pix-key-empty");
    selectorElement = document.createElement("pix-key-selector");
    selectorElement.className = "hidden";
    selectorElement.setAttribute("hidden", "");
    formElement = document.createElement("pix-charge-form");

    formColumn.appendChild(emptyElement);
    formColumn.appendChild(selectorElement);
    formColumn.appendChild(formElement);

    const resultColumn = document.createElement("div");
    resultColumn.className = "charge-page__column charge-page__column--result";

    resultElement = document.createElement("pix-charge-result");
    resultColumn.appendChild(resultElement);

    chargePageElement.appendChild(formColumn);
    chargePageElement.appendChild(resultColumn);
  }

  if (formElement) {
    if (services.generatePixChargeUseCase) {
      formElement.generatePixChargeUseCase = services.generatePixChargeUseCase;
    }
    if (services.pixKeyRepository) {
      formElement.pixKeyRepository = services.pixKeyRepository;
    }
  }

  if (selectorElement) {
    if (services.selectPixKeyUseCase) {
      selectorElement.selectPixKeyUseCase = services.selectPixKeyUseCase;
    }
    if (services.deletePixKeyUseCase) {
      selectorElement.deletePixKeyUseCase = services.deletePixKeyUseCase;
    }
    if (services.listPixKeysUseCase) {
      selectorElement.listPixKeysUseCase = services.listPixKeysUseCase;
    }
    if (services.pixKeyRepository) {
      selectorElement.pixKeyRepository = services.pixKeyRepository;
    }
  }

  if (resultElement && services.distributePixChargeUseCase) {
    resultElement.distributePixChargeUseCase =
      services.distributePixChargeUseCase;
  }

  const syncVisibility = (items = []) => {
    const hasKeys = Array.isArray(items) && items.length > 0;
    if (emptyElement) {
      emptyElement.classList.toggle("hidden", hasKeys);
      if (hasKeys) {
        emptyElement.setAttribute("hidden", "");
      } else {
        emptyElement.removeAttribute("hidden");
      }
    }
    if (selectorElement) {
      selectorElement.classList.toggle("hidden", !hasKeys);
      if (!hasKeys) {
        selectorElement.setAttribute("hidden", "");
      } else {
        selectorElement.removeAttribute("hidden");
      }
    }
  };

  if (services.pixKeyRepository) {
    if (typeof services.pixKeyRepository.subscribe === "function") {
      services.pixKeyRepository.subscribe((state = {}) => {
        syncVisibility(state.items);
      });
    }
    if (typeof services.pixKeyRepository.getState === "function") {
      const currentState = services.pixKeyRepository.getState();
      syncVisibility(currentState?.items);
    }
    if (services.listPixKeysUseCase) {
      services.listPixKeysUseCase
        .execute()
        .then((result) => {
          syncVisibility(result?.items);
        })
        .catch(() => {});
    }
  }
}
