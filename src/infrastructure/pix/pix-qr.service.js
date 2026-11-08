import { createStaticPix, hasError, isStaticPix, parsePix } from "pix-utils";
import encodeQR from "qr";
import { svgToPng } from "qr/dom.js";

/**
 * Gera os dados de cobrança PIX (BR Code e representações do QR Code).
 *
 * @param {Object} options
 * @param {string} options.pixKey - Chave PIX destinatária
 * @param {string} [options.merchantName="Manda um PIX"] - Nome do recebedor
 * @param {string} [options.merchantCity="Brasilia"] - Cidade do recebedor
 * @param {number} [options.transactionAmount=0] - Valor em reais da transação
 * @param {string} [options.txid="***"] - Identificador da transação
 * @param {string} [options.infoAdicional] - Informações adicionais
 * @param {Object} [options.qrOptions={}] - Opções customizadas para a biblioteca QR
 * @returns {{ pixObject: Object, brCode: string, qrSvg: string, qrDataUrl: string, qrGifBytes: Uint8Array }}
 */
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
    const errorMsg =
      (typeof pixObject.message === "string" && pixObject.message) ||
      (typeof pixObject.error === "string" && pixObject.error) ||
      "Falha ao gerar cobrança PIX.";
    throw new Error(errorMsg);
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

/**
 * Decodifica e valida uma string de BR Code (PIX Copia e Cola).
 *
 * @param {string} brCode - String do BR Code
 * @returns {{ parsed: Object, isStatic: boolean }}
 */
export function parsePixCharge(brCode) {
  const parsed = parsePix(brCode);
  if (hasError(parsed)) {
    const errorMsg =
      typeof parsed.error === "string" ? parsed.error : "Código PIX inválido.";
    throw new Error(errorMsg);
  }

  return {
    parsed,
    isStatic: isStaticPix(parsed),
  };
}

/**
 * Exporta a representação em imagem PNG a partir do código BR Code.
 *
 * @param {string} brCode - String do BR Code
 * @param {Object} [options={}]
 * @param {number} [options.width=512] - Largura da imagem em pixels
 * @param {number} [options.height=512] - Altura da imagem em pixels
 * @param {Object} [options.qrOptions={}] - Opções de geração do QR
 * @returns {Promise<Blob|string>}
 */
export async function exportQrCodePng(
  brCode,
  { width = 512, height = 512, qrOptions = {}, svgToPngFn = svgToPng } = {},
) {
  const svgMarkup = encodeQR(brCode, "svg", qrOptions);
  return svgToPngFn(svgMarkup, width, height);
}
