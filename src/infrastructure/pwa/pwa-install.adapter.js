import DataController from "@modnes/data-controller";

export const STANDALONE_MEDIA_QUERY = "(display-mode: standalone)";

export const PWA_INSTALL_ADAPTER_ERROR_CODES = Object.freeze({
  PWA_ALREADY_INSTALLED: "PWA_ALREADY_INSTALLED",
  INSTALL_PROMPT_UNAVAILABLE: "INSTALL_PROMPT_UNAVAILABLE",
  INSTALL_PROMPT_EXECUTION_FAILED: "INSTALL_PROMPT_EXECUTION_FAILED",
  INVALID_INSTALL_LISTENER: "INVALID_INSTALL_LISTENER",
});

export class PwaInstallAdapterError extends Error {
  constructor(
    message,
    { code = "PWA_INSTALL_ADAPTER_ERROR", field = null, cause = null } = {},
  ) {
    super(message);
    this.name = "PwaInstallAdapterError";
    this.code = code;
    this.field = field;
    this.cause = cause;
  }
}

export function detectStandaloneMode({
  windowTarget = globalThis.window,
  navigatorTarget = globalThis.navigator,
} = {}) {
  const isNavigatorStandalone = Boolean(navigatorTarget?.standalone);

  let isMediaStandalone = false;
  if (Boolean(windowTarget) && typeof windowTarget.matchMedia === "function") {
    try {
      const mediaQueryResult = windowTarget.matchMedia(STANDALONE_MEDIA_QUERY);
      isMediaStandalone = Boolean(mediaQueryResult?.matches);
    } catch {
      isMediaStandalone = false;
    }
  }

  return isNavigatorStandalone || isMediaStandalone;
}

export class PwaInstallAdapter extends EventTarget {
  constructor({
    windowTarget = globalThis.window,
    navigatorTarget = globalThis.navigator,
  } = {}) {
    super();
    this.windowTarget = windowTarget || null;
    this.navigatorTarget = navigatorTarget || null;
    this.mediaQueryList = null;
    this.deferredPrompt = null;
    this.installedFlag = false;
    this.destroyed = false;

    const initialInstalled = detectStandaloneMode({
      windowTarget: this.windowTarget,
      navigatorTarget: this.navigatorTarget,
    });

    this.rawState = {
      isInstalled: initialInstalled,
      canInstall: false,
      shouldShowInstallButton: false,
    };
    this.dataController = new DataController(this);
    this.data = this.rawState;

    this.boundOnBeforeInstallPrompt = (event) =>
      this.handleBeforeInstallPrompt(event);
    this.boundOnAppInstalled = () => this.handleAppInstalled();
    this.boundOnMediaQueryChange = (event) =>
      this.handleMediaQueryChange(event);

    this.initialize();
  }

  initialize() {
    if (!this.windowTarget) {
      return;
    }

    if (this.windowTarget.__pwaInstalled) {
      this.installedFlag = true;
    }

    if (this.windowTarget.__deferredPrompt && !this.isInstalled()) {
      this.deferredPrompt = this.windowTarget.__deferredPrompt;
      this.windowTarget.__deferredPrompt = null;
      this.syncState();
    }

    if (typeof this.windowTarget.addEventListener === "function") {
      this.windowTarget.addEventListener(
        "beforeinstallprompt",
        this.boundOnBeforeInstallPrompt,
      );
      this.windowTarget.addEventListener(
        "appinstalled",
        this.boundOnAppInstalled,
      );
    }

    if (typeof this.windowTarget.matchMedia === "function") {
      try {
        this.mediaQueryList = this.windowTarget.matchMedia(
          STANDALONE_MEDIA_QUERY,
        );
        if (this.mediaQueryList) {
          if (typeof this.mediaQueryList.addEventListener === "function") {
            this.mediaQueryList.addEventListener(
              "change",
              this.boundOnMediaQueryChange,
            );
          } else if (typeof this.mediaQueryList.addListener === "function") {
            this.mediaQueryList.addListener(this.boundOnMediaQueryChange);
          }
        }
      } catch {
        this.mediaQueryList = null;
      }
    }
  }

  syncState() {
    const isInstalled = this.isInstalled();
    const canInstall = this.canInstall();
    const shouldShowInstallButton = !isInstalled && canInstall;

    if (this.rawState.isInstalled !== isInstalled) {
      this.data.isInstalled = isInstalled;
    }
    if (this.rawState.canInstall !== canInstall) {
      this.data.canInstall = canInstall;
    }
    if (this.rawState.shouldShowInstallButton !== shouldShowInstallButton) {
      this.data.shouldShowInstallButton = shouldShowInstallButton;
    }
  }

  handleBeforeInstallPrompt(event) {
    if (this.destroyed) {
      return;
    }

    if (typeof event?.preventDefault === "function") {
      event.preventDefault();
    }

    this.deferredPrompt = event;
    this.syncState();
  }

  handleAppInstalled() {
    if (this.destroyed) {
      return;
    }

    this.installedFlag = true;
    this.deferredPrompt = null;
    this.syncState();
  }

  handleMediaQueryChange(event) {
    if (this.destroyed) {
      return;
    }

    if (event?.matches) {
      this.installedFlag = true;
      this.deferredPrompt = null;
      this.syncState();
    }
  }

  isInstalled() {
    if (this.installedFlag || this.rawState?.isInstalled) {
      return true;
    }

    return detectStandaloneMode({
      windowTarget: this.windowTarget,
      navigatorTarget: this.navigatorTarget,
    });
  }

  canInstall() {
    if (this.isInstalled()) {
      return false;
    }

    return Boolean(this.deferredPrompt);
  }

  getState() {
    const isInstalled = this.isInstalled();
    const canInstall = this.canInstall();
    const shouldShowInstallButton = !isInstalled && canInstall;

    return Object.freeze({
      isInstalled,
      canInstall,
      shouldShowInstallButton,
    });
  }

  subscribe(listener) {
    if (typeof listener !== "function") {
      throw new PwaInstallAdapterError(
        "Listener de estado de instalação inválido (esperada uma função).",
        {
          code: PWA_INSTALL_ADAPTER_ERROR_CODES.INVALID_INSTALL_LISTENER,
          field: "listener",
        },
      );
    }

    const handler = (event) => {
      listener(this.getState(), event?.detail);
    };

    this.addEventListener("dataUpdated", handler);

    return () => {
      this.removeEventListener("dataUpdated", handler);
    };
  }

  async promptInstall() {
    if (this.isInstalled()) {
      throw new PwaInstallAdapterError(
        "O aplicativo já está instalado neste dispositivo.",
        {
          code: PWA_INSTALL_ADAPTER_ERROR_CODES.PWA_ALREADY_INSTALLED,
          field: "isInstalled",
        },
      );
    }

    if (!this.canInstall() || !this.deferredPrompt) {
      throw new PwaInstallAdapterError(
        "O prompt nativo de instalação não está disponível no momento.",
        {
          code: PWA_INSTALL_ADAPTER_ERROR_CODES.INSTALL_PROMPT_UNAVAILABLE,
          field: "canInstall",
        },
      );
    }

    const currentPrompt = this.deferredPrompt;
    this.deferredPrompt = null;

    let rawOutcome = "dismissed";
    try {
      const promptResult = await currentPrompt.prompt();
      if (
        currentPrompt.userChoice &&
        typeof currentPrompt.userChoice.then === "function"
      ) {
        const choice = await currentPrompt.userChoice;
        rawOutcome = choice?.outcome || promptResult?.outcome || "dismissed";
      } else if (promptResult?.outcome) {
        rawOutcome = promptResult.outcome;
      } else if (typeof promptResult === "string") {
        rawOutcome = promptResult;
      }
    } catch (error) {
      throw new PwaInstallAdapterError(
        error?.message ||
          "Não foi possível acionar o prompt nativo de instalação.",
        {
          code: PWA_INSTALL_ADAPTER_ERROR_CODES.INSTALL_PROMPT_EXECUTION_FAILED,
          field: "deferredPrompt",
          cause: error,
        },
      );
    }

    const outcome =
      String(rawOutcome).trim().toLowerCase() === "accepted"
        ? "accepted"
        : "dismissed";
    const accepted = outcome === "accepted";

    if (accepted) {
      this.installedFlag = true;
    }

    this.syncState();

    const currentState = this.getState();

    return Object.freeze({
      outcome,
      accepted,
      isInstalled: currentState.isInstalled,
      canInstall: currentState.canInstall,
      shouldShowInstallButton: currentState.shouldShowInstallButton,
    });
  }

  async triggerInstall() {
    return this.promptInstall();
  }

  destroy() {
    this.destroyed = true;
    this.deferredPrompt = null;
    this.installedFlag = false;
    if (this.windowTarget) {
      this.windowTarget.__deferredPrompt = null;
      this.windowTarget.__pwaInstalled = false;
    }

    if (
      this.windowTarget &&
      typeof this.windowTarget.removeEventListener === "function"
    ) {
      this.windowTarget.removeEventListener(
        "beforeinstallprompt",
        this.boundOnBeforeInstallPrompt,
      );
      this.windowTarget.removeEventListener(
        "appinstalled",
        this.boundOnAppInstalled,
      );
    }

    if (this.mediaQueryList) {
      if (typeof this.mediaQueryList.removeEventListener === "function") {
        this.mediaQueryList.removeEventListener(
          "change",
          this.boundOnMediaQueryChange,
        );
      } else if (typeof this.mediaQueryList.removeListener === "function") {
        this.mediaQueryList.removeListener(this.boundOnMediaQueryChange);
      }
    }
  }
}

export function createPwaInstallAdapter(options) {
  return new PwaInstallAdapter(options);
}
