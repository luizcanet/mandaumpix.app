import { PIX_CHARGE_DISTRIBUTION_ACTIONS } from "../../application/use-cases/distribute-pix-charge.use-case.js";

export const BROWSER_SHARE_ADAPTER_ERROR_CODES = Object.freeze({
  CLIPBOARD_UNAVAILABLE: "CLIPBOARD_UNAVAILABLE",
  CLIPBOARD_WRITE_FAILED: "CLIPBOARD_WRITE_FAILED",
  SHARE_UNAVAILABLE: "SHARE_UNAVAILABLE",
  SHARE_FAILED: "SHARE_FAILED",
  SHARE_ABORTED: "SHARE_ABORTED",
  POPUP_BLOCKED: "POPUP_BLOCKED",
  DOWNLOAD_FAILED: "DOWNLOAD_FAILED",
  INVALID_PAYLOAD: "INVALID_PAYLOAD",
});

export class BrowserShareAdapterError extends Error {
  constructor(
    message,
    { code = "BROWSER_SHARE_ADAPTER_ERROR", field = null, cause = null } = {},
  ) {
    super(message);
    this.name = "BrowserShareAdapterError";
    this.code = code;
    this.field = field;
    this.cause = cause;
  }
}

function normalizeRequiredString(value, fieldName, errorMessage) {
  if (typeof value !== "string" || !value.trim()) {
    throw new BrowserShareAdapterError(errorMessage, {
      code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
      field: fieldName,
    });
  }

  return value.trim();
}

export class BrowserShareAdapter {
  constructor({
    windowTarget = typeof window !== "undefined" ? window : null,
    navigatorTarget = typeof navigator !== "undefined" ? navigator : null,
    documentTarget = typeof document !== "undefined" ? document : null,
    exportQrCodePngFn = null,
  } = {}) {
    this.windowTarget = windowTarget;
    this.navigatorTarget = navigatorTarget;
    this.documentTarget = documentTarget;
    this.exportQrCodePngFn = exportQrCodePngFn;
  }

  async copyText(text) {
    const normalizedText = normalizeRequiredString(
      text,
      "text",
      "Texto para cópia na área de transferência inválido ou vazio.",
    );

    const clipboard = this.navigatorTarget?.clipboard;
    if (!clipboard || typeof clipboard.writeText !== "function") {
      throw new BrowserShareAdapterError(
        "API Clipboard (navigator.clipboard.writeText) não está disponível no ambiente atual.",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.CLIPBOARD_UNAVAILABLE,
          field: "clipboard",
        },
      );
    }

    try {
      await clipboard.writeText(normalizedText);
    } catch (error) {
      throw new BrowserShareAdapterError(
        error?.message ||
          "Falha ao gravar texto na área de transferência do dispositivo.",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.CLIPBOARD_WRITE_FAILED,
          field: "text",
          cause: error,
        },
      );
    }

    return Object.freeze({
      action: PIX_CHARGE_DISTRIBUTION_ACTIONS.COPY,
      copied: true,
      text: normalizedText,
    });
  }

  async copyChargeCode(text) {
    return this.copyText(text);
  }
}

export function createBrowserShareAdapter(options) {
  return new BrowserShareAdapter(options);
}

