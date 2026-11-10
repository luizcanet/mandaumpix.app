import {
  PIX_CHARGE_DISTRIBUTION_ACTIONS,
  PIX_CHARGE_DISTRIBUTION_CHANNELS,
  buildWhatsAppShareUrl,
  normalizeQrDimensions,
  normalizeQrDownloadFileName,
} from "../../application/use-cases/distribute-pix-charge.use-case.js";
import { exportQrCodePng } from "../pix/pix-qr.service.js";

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

function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const base64Data = parts[1] || "";
  const binaryString =
    typeof globalThis.atob === "function" ? globalThis.atob(base64Data) : "";
  const length = binaryString.length;
  const uint8Array = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return new Blob([uint8Array], { type: mime });
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

  async downloadQrCodePng(payload = {}) {
    if (!payload || typeof payload !== "object") {
      throw new BrowserShareAdapterError(
        "Payload para download da imagem PNG do QR Code inválido.",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
          field: "payload",
        },
      );
    }

    const chave_cobranca =
      typeof payload.chave_cobranca === "string" &&
      payload.chave_cobranca.trim()
        ? payload.chave_cobranca.trim()
        : null;

    if (!chave_cobranca && !payload.svg && !payload.dataUrl && !payload.blob) {
      throw new BrowserShareAdapterError(
        "Informe uma cobrança PIX válida (BR Code, SVG, Data URL ou Blob) para download.",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
          field: "chave_cobranca",
        },
      );
    }

    const documentObj = this.documentTarget;
    if (!documentObj || typeof documentObj.createElement !== "function") {
      throw new BrowserShareAdapterError(
        "Ambiente sem suporte a manipulação de DOM para download (document não disponível).",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.DOWNLOAD_FAILED,
          field: "document",
        },
      );
    }

    const urlFactory = this.windowTarget?.URL || globalThis.URL;
    if (!urlFactory || typeof urlFactory.createObjectURL !== "function") {
      throw new BrowserShareAdapterError(
        "API URL.createObjectURL não disponível no ambiente atual.",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.DOWNLOAD_FAILED,
          field: "createObjectURL",
        },
      );
    }

    const normalizedFileName = normalizeQrDownloadFileName(payload.fileName);
    const dimensions = normalizeQrDimensions({
      width: payload.width,
      height: payload.height,
    });

    const rasterizeFn =
      typeof this.exportQrCodePngFn === "function"
        ? this.exportQrCodePngFn
        : exportQrCodePng;

    let blob = null;

    if (payload.blob instanceof Blob) {
      blob = payload.blob;
    } else if (
      typeof rasterizeFn === "function" &&
      (chave_cobranca || payload.svg)
    ) {
      try {
        const rawResult = await rasterizeFn(chave_cobranca || payload.svg, {
          width: dimensions.width,
          height: dimensions.height,
        });

        if (rawResult instanceof Blob) {
          blob = rawResult;
        } else if (
          typeof rawResult === "string" &&
          rawResult.startsWith("data:")
        ) {
          blob = dataUrlToBlob(rawResult);
        } else if (rawResult !== null && rawResult !== undefined) {
          blob = new Blob([rawResult], { type: "image/png" });
        }
      } catch (error) {
        throw new BrowserShareAdapterError(
          error?.message ||
            "Falha ao converter ou rasterizar a imagem PNG do QR Code.",
          {
            code: BROWSER_SHARE_ADAPTER_ERROR_CODES.DOWNLOAD_FAILED,
            field: "imagem_qrcode",
            cause: error,
          },
        );
      }
    } else if (
      typeof payload.dataUrl === "string" &&
      payload.dataUrl.trim() &&
      !payload.dataUrl.startsWith("data:image/gif")
    ) {
      blob = dataUrlToBlob(payload.dataUrl.trim());
    }

    if (!blob) {
      throw new BrowserShareAdapterError(
        "Não foi possível obter ou gerar a imagem PNG do QR Code para download.",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.DOWNLOAD_FAILED,
          field: "imagem_qrcode",
        },
      );
    }

    let objectUrl = null;
    let anchor = null;

    try {
      objectUrl = urlFactory.createObjectURL(blob);
      anchor = documentObj.createElement("a");
      anchor.href = objectUrl;
      anchor.download = normalizedFileName;
      anchor.style.display = "none";

      if (documentObj.body?.appendChild) {
        documentObj.body.appendChild(anchor);
      }

      anchor.click();
    } catch (error) {
      throw new BrowserShareAdapterError(
        error?.message || "Falha ao disparar o download local do arquivo PNG.",
        {
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.DOWNLOAD_FAILED,
          field: "download",
          cause: error,
        },
      );
    } finally {
      if (anchor && documentObj.body?.removeChild) {
        try {
          documentObj.body.removeChild(anchor);
        } catch {
          // ignore cleanup error
        }
      }

      if (objectUrl && typeof urlFactory.revokeObjectURL === "function") {
        try {
          urlFactory.revokeObjectURL(objectUrl);
        } catch {
          // ignore cleanup error
        }
      }
    }

    return Object.freeze({
      action: PIX_CHARGE_DISTRIBUTION_ACTIONS.DOWNLOAD_QR,
      downloaded: true,
      fileName: normalizedFileName,
      width: dimensions.width,
      height: dimensions.height,
      chave_cobranca: chave_cobranca || null,
    });
  }

  async downloadQrImage(payload) {
    return this.downloadQrCodePng(payload);
  }
}

export function createBrowserShareAdapter(options) {
  return new BrowserShareAdapter(options);
}
