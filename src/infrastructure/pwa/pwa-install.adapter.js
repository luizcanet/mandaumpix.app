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

