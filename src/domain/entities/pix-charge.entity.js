import { ChaveConta } from "./pix-key.entity.js";

export const DEFAULT_PIX_CHARGE_TXID = "***";
export const MAX_PIX_CHARGE_AMOUNT = 999999999.99;
export const MAX_PIX_CHARGE_TXID_LENGTH = 25;
export const MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH = 72;

export const PIX_CHARGE_ERROR_CODES = Object.freeze({
  MISSING_PIX_KEY: "MISSING_PIX_KEY",
  INVALID_PIX_KEY: "INVALID_PIX_KEY",
  INVALID_AMOUNT: "INVALID_AMOUNT",
  INVALID_TXID: "INVALID_TXID",
  INVALID_ADDITIONAL_INFO: "INVALID_ADDITIONAL_INFO",
  INVALID_BR_CODE: "INVALID_BR_CODE",
  INVALID_QR_CODE: "INVALID_QR_CODE",
  CHARGE_GENERATION_FAILED: "CHARGE_GENERATION_FAILED",
});

export class PixChargeValidationError extends Error {
  constructor(
    message,
    { code = "PIX_CHARGE_VALIDATION_ERROR", field = null } = {},
  ) {
    super(message);
    this.name = "PixChargeValidationError";
    this.code = code;
    this.field = field;
  }
}

const BRL_COMMA_AMOUNT_REGEX = /^[+-]?(?:\d{1,3}(?:\.\d{3})+|\d+),\d+$/;
const DOT_AMOUNT_REGEX = /^[+-]?\d+(?:\.\d+)?$/;
const TXID_ALPHANUMERIC_REGEX = /^[A-Za-z0-9]{1,25}$/;
const BR_CODE_ENVELOPE_REGEX = /^000201.+6304[0-9A-Fa-f]{4}$/;
const DIACRITICS_REGEX = /[\u0300-\u036f]/g;
const MULTIPLE_SPACES_REGEX = /\s+/g;

function throwInvalidAmountError(
  message = "Valor da cobrança PIX inválido (informe um valor positivo até 999.999.999,99 ou deixe em aberto).",
) {
  throw new PixChargeValidationError(message, {
    code: PIX_CHARGE_ERROR_CODES.INVALID_AMOUNT,
    field: "valor_opcional",
  });
}

function parseAmountString(rawString) {
  const withoutCurrency = rawString.replace(/^\s*R\$\s*/i, "").trim();

  if (!withoutCurrency) {
    throwInvalidAmountError();
  }

  if (withoutCurrency.includes(",")) {
    if (!BRL_COMMA_AMOUNT_REGEX.test(withoutCurrency)) {
      throwInvalidAmountError();
    }
    return Number(withoutCurrency.replace(/\./g, "").replace(",", "."));
  }

  if (!DOT_AMOUNT_REGEX.test(withoutCurrency)) {
    throwInvalidAmountError();
  }

  return Number(withoutCurrency);
}

function roundToCents(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function normalizeTransactionAmount(rawAmount) {
  if (rawAmount === undefined || rawAmount === null) {
    return {
      valor_opcional: null,
      valor_dinamico: true,
    };
  }

  if (typeof rawAmount === "string" && rawAmount.trim() === "") {
    return {
      valor_opcional: null,
      valor_dinamico: true,
    };
  }

  if (typeof rawAmount !== "number" && typeof rawAmount !== "string") {
    throwInvalidAmountError();
  }

  const numericAmount =
    typeof rawAmount === "number" ? rawAmount : parseAmountString(rawAmount);

  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throwInvalidAmountError();
  }

  if (numericAmount === 0) {
    return {
      valor_opcional: null,
      valor_dinamico: true,
    };
  }

  const roundedAmount = roundToCents(numericAmount);

  if (roundedAmount <= 0 || roundedAmount > MAX_PIX_CHARGE_AMOUNT) {
    throwInvalidAmountError();
  }

  return {
    valor_opcional: roundedAmount,
    valor_dinamico: false,
  };
}

export function normalizeTxid(rawTxid) {
  if (rawTxid === undefined || rawTxid === null) {
    return DEFAULT_PIX_CHARGE_TXID;
  }

  if (typeof rawTxid !== "string") {
    throw new PixChargeValidationError(
      "Identificador da transação (txid) inválido (esperado '***' ou até 25 caracteres alfanuméricos).",
      {
        code: PIX_CHARGE_ERROR_CODES.INVALID_TXID,
        field: "txid",
      },
    );
  }

  const trimmed = rawTxid.trim();

  if (!trimmed || trimmed === DEFAULT_PIX_CHARGE_TXID) {
    return DEFAULT_PIX_CHARGE_TXID;
  }

  if (!TXID_ALPHANUMERIC_REGEX.test(trimmed)) {
    throw new PixChargeValidationError(
      "Identificador da transação (txid) inválido (permitidos apenas caracteres alfanuméricos A-Z, a-z, 0-9 até 25 caracteres ou '***').",
      {
        code: PIX_CHARGE_ERROR_CODES.INVALID_TXID,
        field: "txid",
      },
    );
  }

  return trimmed;
}

export function normalizeAdditionalInfo(rawInfo) {
  if (rawInfo === undefined || rawInfo === null) {
    return null;
  }

  if (typeof rawInfo !== "string") {
    throw new PixChargeValidationError(
      "Informação adicional da cobrança inválida.",
      {
        code: PIX_CHARGE_ERROR_CODES.INVALID_ADDITIONAL_INFO,
        field: "info_adicional",
      },
    );
  }

  const normalized = rawInfo
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(MULTIPLE_SPACES_REGEX, " ")
    .trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH) {
    throw new PixChargeValidationError(
      `Informação adicional excede o limite de ${MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH} caracteres.`,
      {
        code: PIX_CHARGE_ERROR_CODES.INVALID_ADDITIONAL_INFO,
        field: "info_adicional",
      },
    );
  }

  return normalized;
}

export function resolveChaveConta(rawPixKey) {
  if (!rawPixKey || typeof rawPixKey !== "object") {
    throw new PixChargeValidationError(
      "Selecione uma chave PIX válida para gerar a cobrança.",
      {
        code: PIX_CHARGE_ERROR_CODES.MISSING_PIX_KEY,
        field: "chave_conta",
      },
    );
  }

  if (rawPixKey instanceof ChaveConta) {
    return rawPixKey;
  }

  try {
    return ChaveConta.fromJSON(rawPixKey);
  } catch (error) {
    throw new PixChargeValidationError(error.message, {
      code: PIX_CHARGE_ERROR_CODES.INVALID_PIX_KEY,
      field: "chave_conta",
    });
  }
}

function normalizeBrCode(rawBrCode) {
  const cleaned = typeof rawBrCode === "string" ? rawBrCode.trim() : "";

  if (!cleaned || !BR_CODE_ENVELOPE_REGEX.test(cleaned)) {
    throw new PixChargeValidationError(
      "Código PIX Copia e Cola (BR Code) ausente ou inválido.",
      {
        code: PIX_CHARGE_ERROR_CODES.INVALID_BR_CODE,
        field: "chave_cobranca",
      },
    );
  }

  return cleaned;
}

function normalizeQrCodeImage(rawQrCode, fallbackQrFields = {}) {
  const candidate =
    rawQrCode !== undefined
      ? rawQrCode
      : fallbackQrFields.qrSvg !== undefined ||
          fallbackQrFields.qrDataUrl !== undefined
        ? {
            svg: fallbackQrFields.qrSvg,
            dataUrl: fallbackQrFields.qrDataUrl,
            gifBytes: fallbackQrFields.qrGifBytes,
          }
        : null;

  if (!candidate || typeof candidate !== "object") {
    throw new PixChargeValidationError(
      "Representação gráfica do QR Code ausente ou inválida.",
      {
        code: PIX_CHARGE_ERROR_CODES.INVALID_QR_CODE,
        field: "imagem_qrcode",
      },
    );
  }

  const svg = typeof candidate.svg === "string" ? candidate.svg.trim() : "";
  const dataUrl =
    typeof candidate.dataUrl === "string" ? candidate.dataUrl.trim() : "";
  const gifBytes = candidate.gifBytes === undefined ? null : candidate.gifBytes;

  if (
    !svg ||
    !svg.includes("<svg") ||
    !dataUrl ||
    !dataUrl.startsWith("data:image/") ||
    (gifBytes !== null && !(gifBytes instanceof Uint8Array))
  ) {
    throw new PixChargeValidationError(
      "Representação gráfica do QR Code ausente ou inválida.",
      {
        code: PIX_CHARGE_ERROR_CODES.INVALID_QR_CODE,
        field: "imagem_qrcode",
      },
    );
  }

  return Object.freeze({
    svg,
    dataUrl,
    gifBytes,
  });
}

function normalizeGeneratedAt(rawGeneratedAt) {
  if (typeof rawGeneratedAt === "string" && rawGeneratedAt.trim()) {
    const parsedTime = Date.parse(rawGeneratedAt);
    if (!Number.isNaN(parsedTime)) {
      return new Date(parsedTime).toISOString();
    }
  }
  return new Date().toISOString();
}

export class CobrancaPix {
  constructor(props = {}) {
    const safeProps = props && typeof props === "object" ? props : {};

    const chaveConta = resolveChaveConta(
      safeProps.chave_conta !== undefined
        ? safeProps.chave_conta
        : safeProps.chaveConta,
    );

    const rawAmount =
      safeProps.valor_opcional !== undefined
        ? safeProps.valor_opcional
        : safeProps.transactionAmount;

    const { valor_opcional, valor_dinamico } =
      normalizeTransactionAmount(rawAmount);

    const rawInfo =
      safeProps.info_adicional !== undefined
        ? safeProps.info_adicional
        : safeProps.infoAdicional;

    const rawBrCode =
      safeProps.chave_cobranca !== undefined
        ? safeProps.chave_cobranca
        : safeProps.brCode;

    const rawQrCode =
      safeProps.imagem_qrcode !== undefined
        ? safeProps.imagem_qrcode
        : safeProps.imagemQrCode;

    this.id_chave_conta = chaveConta.id;
    this.chave_conta = chaveConta;
    this.valor_opcional = valor_opcional;
    this.valor_dinamico = valor_dinamico;
    this.txid = normalizeTxid(safeProps.txid);
    this.info_adicional = normalizeAdditionalInfo(rawInfo);
    this.chave_cobranca = normalizeBrCode(rawBrCode);
    this.imagem_qrcode = normalizeQrCodeImage(rawQrCode, safeProps);
    this.gerado_em = normalizeGeneratedAt(safeProps.gerado_em);

    Object.freeze(this);
  }

  static create(props) {
    return new CobrancaPix(props);
  }

  static fromJSON(json) {
    return new CobrancaPix(json);
  }

  toJSON() {
    return {
      id_chave_conta: this.id_chave_conta,
      chave_conta: this.chave_conta.toJSON(),
      valor_opcional: this.valor_opcional,
      valor_dinamico: this.valor_dinamico,
      txid: this.txid,
      info_adicional: this.info_adicional,
      chave_cobranca: this.chave_cobranca,
      imagem_qrcode: {
        svg: this.imagem_qrcode.svg,
        dataUrl: this.imagem_qrcode.dataUrl,
        gifBytes: this.imagem_qrcode.gifBytes,
      },
      gerado_em: this.gerado_em,
    };
  }
}

export const PixChargeEntity = CobrancaPix;
