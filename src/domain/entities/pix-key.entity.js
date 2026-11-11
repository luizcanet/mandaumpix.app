export const PIX_KEY_TYPES = Object.freeze({
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "EMAIL",
  TELEFONE: "TELEFONE",
  EVP: "EVP",
});

export const DEFAULT_PIX_KEY_LABELS = Object.freeze({
  [PIX_KEY_TYPES.CPF]: "Conta CPF",
  [PIX_KEY_TYPES.CNPJ]: "Conta CNPJ",
  [PIX_KEY_TYPES.EMAIL]: "Conta E-mail",
  [PIX_KEY_TYPES.TELEFONE]: "Conta Celular",
  [PIX_KEY_TYPES.EVP]: "Conta EVP",
});

export const PIX_KEY_ERROR_CODES = Object.freeze({
  INVALID_KEY_TYPE: "INVALID_KEY_TYPE",
  INVALID_CPF: "INVALID_CPF",
  INVALID_CNPJ: "INVALID_CNPJ",
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_PHONE: "INVALID_PHONE",
  INVALID_EVP: "INVALID_EVP",
  INVALID_MERCHANT_NAME: "INVALID_MERCHANT_NAME",
  INVALID_MERCHANT_CITY: "INVALID_MERCHANT_CITY",
});

export class PixKeyValidationError extends Error {
  constructor(
    message,
    { code = "PIX_KEY_VALIDATION_ERROR", field = null } = {},
  ) {
    super(message);
    this.name = "PixKeyValidationError";
    this.code = code;
    this.field = field;
  }
}

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;
const MAX_EMAIL_LENGTH = 77;
const MAX_MERCHANT_NAME_LENGTH = 25;
const MAX_MERCHANT_CITY_LENGTH = 15;
const MAX_ACCOUNT_LABEL_LENGTH = 40;
const REPEATED_DIGITS_REGEX = /^(\d)\1+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_E164_BR_REGEX = /^\+55[1-9][1-9]9\d{8}$/;
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DIACRITICS_REGEX = /[\u0300-\u036f]/g;
const NON_ALPHANUMERIC_SPACE_REGEX = /[^A-Z0-9 ]/g;
const MULTIPLE_SPACES_REGEX = /\s+/g;

const CNPJ_FIRST_WEIGHTS = Object.freeze([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
const CNPJ_SECOND_WEIGHTS = Object.freeze([
  6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
]);

function extractDigits(rawValue) {
  if (typeof rawValue !== "string") {
    return "";
  }
  return rawValue.replace(/\D/g, "");
}

function calculateCpfVerifierDigit(digits, length, initialWeight) {
  let sum = 0;
  for (let index = 0; index < length; index += 1) {
    sum += Number(digits[index]) * (initialWeight - index);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function calculateCnpjVerifierDigit(digits, weights) {
  let sum = 0;
  for (let index = 0; index < weights.length; index += 1) {
    sum += Number(digits[index]) * weights[index];
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function validateAndNormalizeCpf(rawValue) {
  const digits = extractDigits(rawValue);

  if (digits.length !== CPF_LENGTH || REPEATED_DIGITS_REGEX.test(digits)) {
    throw new PixKeyValidationError("Chave CPF inválida.", {
      code: PIX_KEY_ERROR_CODES.INVALID_CPF,
      field: "valor_chave",
    });
  }

  const firstDigit = calculateCpfVerifierDigit(digits, 9, 10);
  const secondDigit = calculateCpfVerifierDigit(digits, 10, 11);

  if (firstDigit !== Number(digits[9]) || secondDigit !== Number(digits[10])) {
    throw new PixKeyValidationError(
      "Chave CPF com dígitos verificadores inválidos.",
      {
        code: PIX_KEY_ERROR_CODES.INVALID_CPF,
        field: "valor_chave",
      },
    );
  }

  return digits;
}

export function validateAndNormalizeCnpj(rawValue) {
  const digits = extractDigits(rawValue);

  if (digits.length !== CNPJ_LENGTH || REPEATED_DIGITS_REGEX.test(digits)) {
    throw new PixKeyValidationError("Chave CNPJ inválida.", {
      code: PIX_KEY_ERROR_CODES.INVALID_CNPJ,
      field: "valor_chave",
    });
  }

  const firstDigit = calculateCnpjVerifierDigit(digits, CNPJ_FIRST_WEIGHTS);
  const secondDigit = calculateCnpjVerifierDigit(digits, CNPJ_SECOND_WEIGHTS);

  if (firstDigit !== Number(digits[12]) || secondDigit !== Number(digits[13])) {
    throw new PixKeyValidationError(
      "Chave CNPJ com dígitos verificadores inválidos.",
      {
        code: PIX_KEY_ERROR_CODES.INVALID_CNPJ,
        field: "valor_chave",
      },
    );
  }

  return digits;
}

export function validateAndNormalizeEmail(rawValue) {
  const normalized =
    typeof rawValue === "string" ? rawValue.trim().toLowerCase() : "";

  if (
    !normalized ||
    normalized.length > MAX_EMAIL_LENGTH ||
    !EMAIL_REGEX.test(normalized)
  ) {
    throw new PixKeyValidationError(
      "Chave de e-mail inválida ou acima de 77 caracteres.",
      {
        code: PIX_KEY_ERROR_CODES.INVALID_EMAIL,
        field: "valor_chave",
      },
    );
  }

  return normalized;
}

export function validateAndNormalizePhone(rawValue) {
  const trimmed = typeof rawValue === "string" ? rawValue.trim() : "";
  const digits = extractDigits(trimmed);

  let normalizedCandidate = "";
  if (trimmed.startsWith("+")) {
    normalizedCandidate = `+${digits}`;
  } else if (digits.length === 11) {
    normalizedCandidate = `+55${digits}`;
  } else if (digits.length === 13 && digits.startsWith("55")) {
    normalizedCandidate = `+${digits}`;
  }

  if (!PHONE_E164_BR_REGEX.test(normalizedCandidate)) {
    throw new PixKeyValidationError(
      "Chave de telefone celular inválida (esperado padrão +55DDD9XXXXXXXX).",
      {
        code: PIX_KEY_ERROR_CODES.INVALID_PHONE,
        field: "valor_chave",
      },
    );
  }

  return normalizedCandidate;
}

export function validateAndNormalizeEvp(rawValue) {
  const normalized =
    typeof rawValue === "string" ? rawValue.trim().toLowerCase() : "";

  if (!UUID_V4_REGEX.test(normalized)) {
    throw new PixKeyValidationError(
      "Chave aleatória (EVP) inválida (esperado UUID v4).",
      {
        code: PIX_KEY_ERROR_CODES.INVALID_EVP,
        field: "valor_chave",
      },
    );
  }

  return normalized;
}

const VALIDATOR_BY_KEY_TYPE = Object.freeze({
  [PIX_KEY_TYPES.CPF]: validateAndNormalizeCpf,
  [PIX_KEY_TYPES.CNPJ]: validateAndNormalizeCnpj,
  [PIX_KEY_TYPES.EMAIL]: validateAndNormalizeEmail,
  [PIX_KEY_TYPES.TELEFONE]: validateAndNormalizePhone,
  [PIX_KEY_TYPES.EVP]: validateAndNormalizeEvp,
});

export function validateAndNormalizePixKey(tipoChave, valorChave) {
  const normalizedType =
    typeof tipoChave === "string" ? tipoChave.trim().toUpperCase() : "";
  const validator = VALIDATOR_BY_KEY_TYPE[normalizedType];

  if (!validator) {
    throw new PixKeyValidationError(
      "Tipo de chave PIX inválido (permitidos: CPF, CNPJ, EMAIL, TELEFONE, EVP).",
      {
        code: PIX_KEY_ERROR_CODES.INVALID_KEY_TYPE,
        field: "tipo_chave",
      },
    );
  }

  return {
    tipo_chave: normalizedType,
    valor_chave: validator(valorChave),
  };
}

function sanitizeEmvText(rawValue, maxLength) {
  if (typeof rawValue !== "string") {
    return "";
  }

  return rawValue
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toUpperCase()
    .replace(NON_ALPHANUMERIC_SPACE_REGEX, "")
    .replace(MULTIPLE_SPACES_REGEX, " ")
    .trim()
    .slice(0, maxLength)
    .trim();
}

export function normalizeMerchantName(rawName) {
  const normalized = sanitizeEmvText(rawName, MAX_MERCHANT_NAME_LENGTH);

  if (!normalized) {
    throw new PixKeyValidationError("Nome do recebedor inválido ou vazio.", {
      code: PIX_KEY_ERROR_CODES.INVALID_MERCHANT_NAME,
      field: "nome_recebedor",
    });
  }

  return normalized;
}

export function normalizeMerchantCity(rawCity) {
  const normalized = sanitizeEmvText(rawCity, MAX_MERCHANT_CITY_LENGTH);

  if (!normalized) {
    throw new PixKeyValidationError("Cidade do recebedor inválida ou vazia.", {
      code: PIX_KEY_ERROR_CODES.INVALID_MERCHANT_CITY,
      field: "cidade_recebedor",
    });
  }

  return normalized;
}

function normalizeAccountLabel(rawLabel, tipoChave) {
  const cleaned =
    typeof rawLabel === "string"
      ? rawLabel.replace(MULTIPLE_SPACES_REGEX, " ").trim()
      : "";

  if (!cleaned) {
    return DEFAULT_PIX_KEY_LABELS[tipoChave];
  }

  return cleaned.slice(0, MAX_ACCOUNT_LABEL_LENGTH).trim();
}

function normalizeEntityId(rawId) {
  const cleaned = typeof rawId === "string" ? rawId.trim() : "";
  return cleaned || crypto.randomUUID();
}

function normalizeCreatedAt(rawCreatedAt) {
  if (typeof rawCreatedAt === "string" && rawCreatedAt.trim()) {
    const parsedTime = Date.parse(rawCreatedAt);
    if (!Number.isNaN(parsedTime)) {
      return new Date(parsedTime).toISOString();
    }
  }
  return new Date().toISOString();
}

export class ChaveConta {
  constructor(props = {}) {
    const safeProps = props && typeof props === "object" ? props : {};

    const { tipo_chave, valor_chave } = validateAndNormalizePixKey(
      safeProps.tipo_chave,
      safeProps.valor_chave,
    );

    this.id = normalizeEntityId(safeProps.id);
    this.rotulo = normalizeAccountLabel(safeProps.rotulo, tipo_chave);
    this.tipo_chave = tipo_chave;
    this.valor_chave = valor_chave;
    this.nome_recebedor = normalizeMerchantName(safeProps.nome_recebedor);
    this.cidade_recebedor = normalizeMerchantCity(safeProps.cidade_recebedor);
    this.criado_em = normalizeCreatedAt(safeProps.criado_em);

    Object.freeze(this);
  }

  static create(props) {
    return new ChaveConta(props);
  }

  static fromJSON(json) {
    return new ChaveConta(json);
  }

  toJSON() {
    return {
      id: this.id,
      rotulo: this.rotulo,
      tipo_chave: this.tipo_chave,
      valor_chave: this.valor_chave,
      nome_recebedor: this.nome_recebedor,
      cidade_recebedor: this.cidade_recebedor,
      criado_em: this.criado_em,
    };
  }
}

export const PixKeyEntity = ChaveConta;
