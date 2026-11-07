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
