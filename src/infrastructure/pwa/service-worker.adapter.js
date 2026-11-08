import DataController from "@modnes/data-controller";

export const DEFAULT_SW_SCRIPT_URL = "./sw.js";
export const DEFAULT_SW_SCOPE = "./";
export const DEFAULT_SW_TYPE = "module";
export const CACHE_VERSION = "1.0.0";
export const PRECACHE_NAME = `mandaumpix-${CACHE_VERSION}-precache`;
export const RUNTIME_CACHE_NAME = `mandaumpix-${CACHE_VERSION}-runtime`;

export const SERVICE_WORKER_STATUS = Object.freeze({
  UNREGISTERED: "UNREGISTERED",
  REGISTERING: "REGISTERING",
  REGISTERED: "REGISTERED",
  UPDATING: "UPDATING",
  ERROR: "ERROR",
  UNSUPPORTED: "UNSUPPORTED",
});

export const SERVICE_WORKER_ADAPTER_ERROR_CODES = Object.freeze({
  SERVICE_WORKER_UNSUPPORTED: "SERVICE_WORKER_UNSUPPORTED",
  REGISTRATION_FAILED: "REGISTRATION_FAILED",
  UPDATE_FAILED: "UPDATE_FAILED",
  UNREGISTER_FAILED: "UNREGISTER_FAILED",
  INVALID_LISTENER: "INVALID_LISTENER",
  INVALID_ARGUMENT: "INVALID_ARGUMENT",
});

export class ServiceWorkerAdapterError extends Error {
  constructor(
    message,
    { code = "SERVICE_WORKER_ADAPTER_ERROR", field = null, cause = null } = {},
  ) {
    super(message);
    this.name = "ServiceWorkerAdapterError";
    this.code = code;
    this.field = field;
    this.cause = cause;
  }
}

export function isServiceWorkerSupported({
  navigatorTarget = globalThis.navigator,
} = {}) {
  return Boolean(navigatorTarget && "serviceWorker" in navigatorTarget);
}

export function isOnline({ navigatorTarget = globalThis.navigator } = {}) {
  if (!navigatorTarget || typeof navigatorTarget.onLine === "undefined") {
    return true;
  }
  return navigatorTarget.onLine !== false;
}

export class ServiceWorkerAdapter extends EventTarget {
  constructor({
    windowTarget = globalThis.window,
    navigatorTarget = globalThis.navigator,
    scriptUrl = DEFAULT_SW_SCRIPT_URL,
    scope = DEFAULT_SW_SCOPE,
    type = DEFAULT_SW_TYPE,
  } = {}) {
    super();
    this.windowTarget = windowTarget || null;
    this.navigatorTarget = navigatorTarget || null;
    this.scriptUrl = scriptUrl;
    this.scope = scope;
    this.type = type;
    this.registration = null;
    this.destroyed = false;

    const initialSupported = isServiceWorkerSupported({
      navigatorTarget: this.navigatorTarget,
    });
    const initialOnline = isOnline({ navigatorTarget: this.navigatorTarget });

    this.rawState = {
      isSupported: initialSupported,
      isOnline: initialOnline,
      isRegistered: false,
      hasUpdate: false,
      status: initialSupported
        ? SERVICE_WORKER_STATUS.UNREGISTERED
        : SERVICE_WORKER_STATUS.UNSUPPORTED,
      scriptUrl: this.scriptUrl,
      scope: this.scope,
      type: this.type,
    };

    this.dataController = new DataController(this);
    this.data = this.rawState;

    this.boundOnOnline = () => this.handleNetworkChange(true);
    this.boundOnOffline = () => this.handleNetworkChange(false);
    this.boundOnUpdateFound = () => this.handleUpdateFound();

    this.initializeConnectivityListeners();
  }

  initializeConnectivityListeners() {
    if (
      !this.windowTarget ||
      typeof this.windowTarget.addEventListener !== "function"
    ) {
      return;
    }

    this.windowTarget.addEventListener("online", this.boundOnOnline);
    this.windowTarget.addEventListener("offline", this.boundOnOffline);
  }

  handleNetworkChange(onlineStatus) {
    if (this.destroyed) {
      return;
    }

    this.syncState({ isOnline: onlineStatus });
  }

  handleUpdateFound() {
    if (this.destroyed || !this.registration) {
      return;
    }

    const installingWorker = this.registration.installing;
    if (!installingWorker) {
      return;
    }

    const onStateChange = () => {
      if (installingWorker.state === "installed") {
        if (this.registration.waiting) {
          this.syncState({ hasUpdate: true });
        }
      }
    };

    if (typeof installingWorker.addEventListener === "function") {
      installingWorker.addEventListener("statechange", onStateChange);
    }
  }

  syncState(patch = {}) {
    let changed = false;

    for (const [key, value] of Object.entries(patch)) {
      if (this.rawState[key] !== value) {
        this.rawState[key] = value;
        this.data[key] = value;
        changed = true;
      }
    }

    if (changed) {
      this.dispatchEvent(
        new CustomEvent("dataUpdated", {
          detail: { state: this.getState() },
        }),
      );
    }
  }

  isSupported() {
    return Boolean(this.rawState.isSupported);
  }

  isOnline() {
    return Boolean(this.rawState.isOnline);
  }

  isRegistered() {
    return Boolean(this.rawState.isRegistered);
  }

  hasUpdate() {
    return Boolean(this.rawState.hasUpdate);
  }

  getRegistration() {
    return this.registration;
  }

  getState() {
    return Object.freeze({ ...this.rawState });
  }

  subscribe(listener) {
    if (typeof listener !== "function") {
      throw new ServiceWorkerAdapterError(
        "Listener de estado do Service Worker inválido (esperada uma função).",
        {
          code: SERVICE_WORKER_ADAPTER_ERROR_CODES.INVALID_LISTENER,
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

  async register({
    scriptUrl = this.scriptUrl,
    scope = this.scope,
    type = this.type,
  } = {}) {
    if (!this.isSupported()) {
      this.syncState({
        isSupported: false,
        isRegistered: false,
        status: SERVICE_WORKER_STATUS.UNSUPPORTED,
      });
      return {
        isSupported: false,
        isRegistered: false,
        registration: null,
      };
    }

    this.syncState({ status: SERVICE_WORKER_STATUS.REGISTERING });

    try {
      const registrationOptions = { scope };
      if (type) {
        registrationOptions.type = type;
      }
      const registration = await this.navigatorTarget.serviceWorker.register(
        scriptUrl,
        registrationOptions,
      );

      this.registration = registration;
      this.scriptUrl = scriptUrl;
      this.scope = scope;
      this.type = type;

      const hasWaiting = Boolean(registration?.waiting);

      if (registration && typeof registration.addEventListener === "function") {
        registration.addEventListener("updatefound", this.boundOnUpdateFound);
      }

      this.syncState({
        isRegistered: true,
        hasUpdate: hasWaiting,
        status: SERVICE_WORKER_STATUS.REGISTERED,
        scriptUrl,
        scope,
        type,
      });

      return {
        isSupported: true,
        isRegistered: true,
        registration,
      };
    } catch (error) {
      this.syncState({
        isRegistered: false,
        status: SERVICE_WORKER_STATUS.ERROR,
      });

      throw new ServiceWorkerAdapterError(
        `Falha ao registrar o Service Worker em '${scriptUrl}': ${error?.message || "Erro desconhecido"}.`,
        {
          code: SERVICE_WORKER_ADAPTER_ERROR_CODES.REGISTRATION_FAILED,
          field: "scriptUrl",
          cause: error,
        },
      );
    }
  }

  async update() {
    if (!this.registration || typeof this.registration.update !== "function") {
      throw new ServiceWorkerAdapterError(
        "Não há nenhum registro de Service Worker ativo para atualizar.",
        {
          code: SERVICE_WORKER_ADAPTER_ERROR_CODES.UPDATE_FAILED,
          field: "registration",
        },
      );
    }

    this.syncState({ status: SERVICE_WORKER_STATUS.UPDATING });
    await this.registration.update();
    this.syncState({ status: SERVICE_WORKER_STATUS.REGISTERED });
    return true;
  }

  async unregister() {
    if (
      !this.registration ||
      typeof this.registration.unregister !== "function"
    ) {
      return false;
    }

    const result = await this.registration.unregister();

    if (result) {
      if (typeof this.registration.removeEventListener === "function") {
        this.registration.removeEventListener(
          "updatefound",
          this.boundOnUpdateFound,
        );
      }
      this.registration = null;
      this.syncState({
        isRegistered: false,
        hasUpdate: false,
        status: SERVICE_WORKER_STATUS.UNREGISTERED,
      });
    }

    return result;
  }

  skipWaiting() {
    if (
      this.registration?.waiting &&
      typeof this.registration.waiting.postMessage === "function"
    ) {
      this.registration.waiting.postMessage({ type: "SKIP_WAITING" });
      return true;
    }
    return false;
  }

  destroy() {
    this.destroyed = true;

    if (
      this.windowTarget &&
      typeof this.windowTarget.removeEventListener === "function"
    ) {
      this.windowTarget.removeEventListener("online", this.boundOnOnline);
      this.windowTarget.removeEventListener("offline", this.boundOnOffline);
    }

    if (
      this.registration &&
      typeof this.registration.removeEventListener === "function"
    ) {
      this.registration.removeEventListener(
        "updatefound",
        this.boundOnUpdateFound,
      );
    }
  }
}

export function createServiceWorkerAdapter(options) {
  return new ServiceWorkerAdapter(options);
}
