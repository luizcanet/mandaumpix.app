import {
  PIX_CHARGE_DISTRIBUTION_ACTIONS,
  PIX_CHARGE_DISTRIBUTION_CHANNELS,
  buildWhatsAppShareUrl,
} from "../../application/use-cases/distribute-pix-charge.use-case.js";

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

  canShare(payload) {
    if (
      !this.navigatorTarget ||
      typeof this.navigatorTarget.share !== "function"
    ) {
      return false;
    }

    if (typeof this.navigatorTarget.canShare === "function") {
      return Boolean(this.navigatorTarget.canShare(payload));
    }

    return true;
  }

  async share(payload) {
    if (!payload || typeof payload !== "object") {
      throw new BrowserShareAdapterError(
        "Payload para compartilhamento nativo inválido (deve ser um objeto).",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
          field: "payload",
        },
      );
    }

    if (
      !this.navigatorTarget ||
      typeof this.navigatorTarget.share !== "function"
    ) {
      throw new BrowserShareAdapterError(
        "Web Share API (navigator.share) não está disponível no ambiente atual.",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.SHARE_UNAVAILABLE,
          field: "share",
        },
      );
    }

    try {
      await this.navigatorTarget.share(payload);

      return Object.freeze({
        action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
        shared: true,
        aborted: false,
        payload,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        return Object.freeze({
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
          shared: false,
          aborted: true,
        });
      }

      throw new BrowserShareAdapterError(
        error?.message ||
          "Falha ao acionar o compartilhamento nativo do sistema.",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.SHARE_FAILED,
          field: "share",
          cause: error,
        },
      );
    }
  }

  openExternalUrl(url, target = "_blank", features = "noopener,noreferrer") {
    const normalizedUrl = normalizeRequiredString(
      url,
      "url",
      "URL externa para navegação inválida ou vazia.",
    );

    if (!this.windowTarget || typeof this.windowTarget.open !== "function") {
      throw new BrowserShareAdapterError(
        "Ambiente sem suporte a abertura de novas janelas (window.open não disponível).",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.POPUP_BLOCKED,
          field: "url",
        },
      );
    }

    let openedWindow;
    try {
      openedWindow = this.windowTarget.open(normalizedUrl, target, features);
    } catch (error) {
      throw new BrowserShareAdapterError(
        error?.message || "Falha ao abrir a URL externa no navegador.",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.POPUP_BLOCKED,
          field: "url",
          cause: error,
        },
      );
    }

    if (!openedWindow) {
      throw new BrowserShareAdapterError(
        "Abertura da URL bloqueada pelo navegador (bloqueador de pop-ups ativo).",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.POPUP_BLOCKED,
          field: "url",
        },
      );
    }

    return openedWindow;
  }

  shareViaWhatsApp({ text, url } = {}) {
    let targetUrl;

    if (typeof url === "string" && url.trim()) {
      targetUrl = url.trim();
    } else if (typeof text === "string" && text.trim()) {
      targetUrl = buildWhatsAppShareUrl(text);
    } else {
      throw new BrowserShareAdapterError(
        "Informe um texto ou URL válida para compartilhamento via WhatsApp.",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
          field: "text",
        },
      );
    }

    this.openExternalUrl(targetUrl, "_blank", "noopener,noreferrer");

    return Object.freeze({
      action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
      shared: true,
      channel: PIX_CHARGE_DISTRIBUTION_CHANNELS.WHATSAPP,
      url: targetUrl,
    });
  }
}

export function createBrowserShareAdapter(options) {
  return new BrowserShareAdapter(options);
}
