import { createStaticPix, hasError, isStaticPix, parsePix } from "pix-utils";
import encodeQR from "qr";
import { gifToPng, svgToPng } from "qr/dom.js";

export const APP_METADATA = Object.freeze({
  name: "Manda um PIX",
  packageName: "mandaumpix.app",
  version: "1.0.0",
  license: "AGPL-3.0-only",
});

export function generatePixCharge({
  pixKey,
  merchantName = "Manda um PIX",
  merchantCity = "Brasilia",
  transactionAmount = 0,
  txid = "***",
  infoAdicional,
  qrOptions = {},
}) {
  const normalizedAmount =
    typeof transactionAmount === "number" && transactionAmount > 0
      ? transactionAmount
      : 0;

  const pixObject = createStaticPix({
    pixKey,
    merchantName,
    merchantCity,
    transactionAmount: normalizedAmount,
    txid,
    ...(infoAdicional ? { infoAdicional } : {}),
  });

  if (hasError(pixObject)) {
    throw new Error(pixObject.error || "Falha ao gerar cobrança PIX.");
  }

  const brCode = pixObject.toBRCode();
  const qrSvg = encodeQR(brCode, "svg", qrOptions);
  const qrDataUrl = encodeQR(brCode, "data-url", qrOptions);
  const qrGifBytes = encodeQR(brCode, "gif", qrOptions);

  return {
    pixObject,
    brCode,
    qrSvg,
    qrDataUrl,
    qrGifBytes,
  };
}

export function parsePixCharge(brCode) {
  const parsed = parsePix(brCode);
  if (hasError(parsed)) {
    throw new Error(parsed.error || "Código PIX inválido.");
  }

  return {
    parsed,
    isStatic: isStaticPix(parsed),
  };
}

export async function exportQrCodePng(
  brCode,
  { width = 512, height = 512, qrOptions = {} } = {},
) {
  const svgMarkup = encodeQR(brCode, "svg", qrOptions);
  return svgToPng(svgMarkup, width, height);
}

export function bootstrapApp(rootElement = document.querySelector("#app")) {
  if (!rootElement) {
    return null;
  }

  rootElement.dataset.initialized = "true";
  return rootElement;
}

if (typeof document !== "undefined") {
  bootstrapApp();
}

export {
  createStaticPix,
  encodeQR,
  gifToPng,
  hasError,
  isStaticPix,
  parsePix,
  svgToPng,
};
