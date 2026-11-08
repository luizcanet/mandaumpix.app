import Router from "@modnes/router";

/**
 * Tabela de rotas canônicas da aplicação.
 */
export const APP_ROUTES = Object.freeze([
  {
    path: "/",
    tagName: "div",
    classes: ["charge-page", "charge-page--split"],
  },
  {
    path: "/sobre",
    tagName: "about-page",
    classes: ["about-page"],
  },
  {
    path: "/*",
    tagName: "div",
    classes: ["charge-page", "charge-page--split"],
  },
]);

/**
 * Mapeamento de títulos acessíveis para cada rota.
 */
export const ROUTE_TITLES = Object.freeze({
  "/": "Manda um PIX — Cobrança rápida",
  "/sobre": "Sobre o aplicativo — Manda um PIX",
  default: "Manda um PIX — Cobrança rápida",
});

/**
 * Resolve o título da página baseado no pathname atual.
 *
 * @param {string} [pathname="/"] - Caminho da rota atual
 * @returns {string} - Título acessível da rota
 */
export function resolveRouteTitle(pathname = "/") {
  if (pathname === "/sobre") {
    return ROUTE_TITLES["/sobre"];
  }
  return ROUTE_TITLES["/"] || ROUTE_TITLES.default;
}

/**
 * Inicializa a instância do Router no contêiner outlet fornecido.
 *
 * @param {HTMLElement} outletElement - Elemento que atuará como outlet
 * @param {Array<Object>} [routes=APP_ROUTES] - Definições de rota
 * @returns {Router|null}
 */
export function initAppRouter(outletElement, routes = APP_ROUTES) {
  if (!outletElement) {
    return null;
  }
  if (!outletElement.hasAttribute("tabindex")) {
    outletElement.setAttribute("tabindex", "-1");
  }
  outletElement.replaceChildren();
  return new Router(outletElement, routes);
}

/**
 * Configura interceptação de cliques em links internos e acionamento de marca
 * para navegar através do roteador SPA sem recarregar a página.
 *
 * @param {HTMLElement} rootElement - Elemento raiz da aplicação
 * @returns {(() => void)|null} Função de cleanup
 */
export function setupNavigationInterception(rootElement) {
  if (!rootElement) {
    return null;
  }

  const handleNavigationClick = (event) => {
    const brandElement = event.target?.closest?.(".app-header__brand");
    if (brandElement && rootElement.contains(brandElement)) {
      event.preventDefault();
      Router.goTo("/");
      return;
    }

    const anchor = event.target?.closest?.("a[href]");
    if (!anchor || !rootElement.contains(anchor)) {
      return;
    }

    if (
      anchor.target === "_blank" ||
      anchor.hasAttribute("download") ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const href = anchor.getAttribute("href");
    if (!href) {
      return;
    }

    if (href.startsWith("/") && !href.startsWith("//")) {
      event.preventDefault();
      Router.goTo(href);
    }
  };

  const handleBrandKeydown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      const brandElement = event.target?.closest?.(".app-header__brand");
      if (brandElement && rootElement.contains(brandElement)) {
        event.preventDefault();
        Router.goTo("/");
      }
    }
  };

  if (rootElement.__navigationClickHandler) {
    rootElement.removeEventListener(
      "click",
      rootElement.__navigationClickHandler,
    );
  }
  if (rootElement.__navigationKeydownHandler) {
    rootElement.removeEventListener(
      "keydown",
      rootElement.__navigationKeydownHandler,
    );
  }

  rootElement.__navigationClickHandler = handleNavigationClick;
  rootElement.__navigationKeydownHandler = handleBrandKeydown;
  rootElement.addEventListener("click", handleNavigationClick);
  rootElement.addEventListener("keydown", handleBrandKeydown);

  return () => {
    rootElement.removeEventListener("click", handleNavigationClick);
    rootElement.removeEventListener("keydown", handleBrandKeydown);
  };
}

/**
 * Configura sincronização de acessibilidade ao transicionar de rotas
 * (atualização de document.title e foco programático no outlet).
 *
 * @param {Object} options
 * @param {HTMLElement} [options.rootElement] - Elemento raiz
 * @param {HTMLElement} [options.outletElement] - Outlet de rotas
 * @param {Document} [options.ownerDoc] - Documento da aplicação
 * @param {Window} [options.windowTarget] - Objeto window
 * @returns {(() => void)|null} Função de cleanup
 */
export function setupRouteAccessibility({
  rootElement,
  outletElement,
  ownerDoc,
  windowTarget,
}) {
  const syncRouteAccessibility = () => {
    const targetDoc =
      ownerDoc ||
      windowTarget?.document ||
      (typeof document !== "undefined" ? document : null);
    const currentPath =
      windowTarget?.location?.pathname ||
      (typeof location !== "undefined" ? location.pathname : "/");

    const title = resolveRouteTitle(currentPath);
    if (targetDoc && title) {
      targetDoc.title = title;
    }

    if (outletElement && typeof outletElement.focus === "function") {
      outletElement.focus();
    }
  };

  syncRouteAccessibility();

  if (windowTarget?.addEventListener) {
    if (rootElement?.__routeAccessibilityHandler) {
      windowTarget.removeEventListener(
        "pathChanged",
        rootElement.__routeAccessibilityHandler,
      );
      windowTarget.removeEventListener(
        "popstate",
        rootElement.__routeAccessibilityHandler,
      );
    }
    if (rootElement) {
      rootElement.__routeAccessibilityHandler = syncRouteAccessibility;
    }
    windowTarget.addEventListener("pathChanged", syncRouteAccessibility);
    windowTarget.addEventListener("popstate", syncRouteAccessibility);

    return () => {
      windowTarget.removeEventListener("pathChanged", syncRouteAccessibility);
      windowTarget.removeEventListener("popstate", syncRouteAccessibility);
    };
  }

  return null;
}
