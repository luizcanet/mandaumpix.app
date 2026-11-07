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

