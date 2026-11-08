/**
 * Constantes canônicas, seletores BEM, configurações de tipos e textos padrão
 * do componente <pix-key-dialog>.
 * Alinhado às regras de negócio RN01, RN02, à especificação de acessibilidade W3C ARIA,
 * à Clean Architecture e ao protótipo da interface em docs/design/ui_prototype.html.
 */

import { PIX_KEY_TYPES } from "../../../domain/entities/pix-key.entity.js";

/**
 * Título padrão exibido no cabeçalho do diálogo modal de cadastro de chave.
 */
export const DEFAULT_KEY_DIALOG_TITLE = "Cadastrar chave PIX";

/**
 * Identificador semântico do título para associação acessível (aria-labelledby).
 */
export const DEFAULT_KEY_DIALOG_TITLE_ID = "key-dialog-title";

/**
 * Tipo inicial de chave selecionado por padrão ao abrir o diálogo.
 */
export const DEFAULT_KEY_DIALOG_INITIAL_TYPE = PIX_KEY_TYPES.CPF;

/**
 * Rótulo padrão do botão primário para submeter e salvar a chave.
 */
export const DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL = "Salvar Chave";

/**
 * Rótulo padrão do botão secundário para cancelar e fechar o diálogo.
 */
export const DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL = "Cancelar";

/**
 * Título e tooltip acessível do botão de fechar no cabeçalho do modal.
 */
export const DEFAULT_KEY_DIALOG_CLOSE_TITLE = "Fechar janela";

/**
 * Rótulos padrão dos campos do formulário de cadastro.
 */
export const DEFAULT_KEY_DIALOG_FIELD_LABELS = Object.freeze({
  ACCOUNT_LABEL: "Apelido da conta (opcional)",
  ACCOUNT_LABEL_PLACEHOLDER: "Ex: Nubank Pessoal",
  KEY_VALUE: "Chave PIX",
  MERCHANT_NAME: "Nome do titular",
  MERCHANT_NAME_PLACEHOLDER: "Ex: Luiz Canet",
  MERCHANT_CITY: "Cidade",
  MERCHANT_CITY_PLACEHOLDER: "Ex: Brasilia",
});

/**
 * Alias para os rótulos de campos padrão do diálogo.
 */
export const KEY_DIALOG_FIELD_LABELS = DEFAULT_KEY_DIALOG_FIELD_LABELS;

/**
 * Limites máximos de caracteres suportados pelos campos de entrada (especificação EMV e domínio).
 */
export const KEY_DIALOG_MAX_LENGTHS = Object.freeze({
  ACCOUNT_LABEL: 40,
  MERCHANT_NAME: 25,
  MERCHANT_CITY: 15,
  CPF: 14,
  CNPJ: 18,
  EMAIL: 77,
  TELEFONE: 20,
  EVP: 36,
});

/**
 * Nomes canônicos dos eventos customizados emitidos pelo componente.
 */
export const KEY_DIALOG_EVENT_NAMES = Object.freeze({
  OPEN_KEY_DIALOG: "open-key-dialog",
  CLOSE_KEY_DIALOG: "close-key-dialog",
  KEY_SAVED: "key-saved",
});

/**
 * Identificadores dos ícones vetoriais consumidos pelo componente via <vector-icon>.
 */
export const KEY_DIALOG_ICONS = Object.freeze({
  CHECK: "check",
  XMARK: "xmark",
  CIRCLE_EXCLAMATION: "circle-exclamation",
  KEY: "key",
});

/**
 * Mapeamento das classes BEM utilizadas na estrutura do modal de cadastro.
 */
export const KEY_DIALOG_CLASSES = Object.freeze({
  ROOT: "key-dialog",
  BACKDROP: "key-dialog-backdrop",
  HEADER: "key-dialog__header",
  TITLE: "key-dialog__title",
  CLOSE_BTN: "key-dialog__close-btn",
  FORM: "key-dialog__form",
  TYPES: "key-dialog__types",
  TYPE_BTN: "key-dialog__type-btn",
  TYPE_BTN_ACTIVE: "key-dialog__type-btn--active",
  ALERT: "key-dialog__alert",
  ALERT_ICON: "key-dialog__alert-icon",
  ALERT_TEXT: "key-dialog__alert-text",
  FIELD: "key-dialog__field",
  ROW: "key-dialog__row",
  LABEL: "key-dialog__label",
  INPUT: "key-dialog__input",
  INPUT_ERROR: "key-dialog__input--error",
  ACTIONS: "key-dialog__actions",
  BTN_CANCEL: "key-dialog__btn-cancel",
  BTN_SAVE: "key-dialog__btn-save",
});

/**
 * Nomes dos serviços injetáveis registrados no contêiner DI via SetInjectable.
 */
export const KEY_DIALOG_INJECTABLES = Object.freeze({
  SAVE_PIX_KEY_USE_CASE: "save-pix-key-use-case",
  PIX_KEY_REPOSITORY: "pix-key-repository",
});

/**
 * Configuração canônica de apresentação, validação e ergonomia de cada tipo de chave PIX.
 */
export const KEY_DIALOG_TYPES_CONFIG = Object.freeze([
  Object.freeze({
    type: PIX_KEY_TYPES.CPF,
    label: "CPF",
    placeholder: "000.000.000-00",
    inputMode: "numeric",
    typeAttr: "text",
    maxLength: KEY_DIALOG_MAX_LENGTHS.CPF,
    fieldLabel: "Chave CPF",
  }),
  Object.freeze({
    type: PIX_KEY_TYPES.CNPJ,
    label: "CNPJ",
    placeholder: "00.000.000/0000-00",
    inputMode: "numeric",
    typeAttr: "text",
    maxLength: KEY_DIALOG_MAX_LENGTHS.CNPJ,
    fieldLabel: "Chave CNPJ",
  }),
  Object.freeze({
    type: PIX_KEY_TYPES.EMAIL,
    label: "E-mail",
    placeholder: "seu.email@exemplo.com",
    inputMode: "email",
    typeAttr: "email",
    maxLength: KEY_DIALOG_MAX_LENGTHS.EMAIL,
    fieldLabel: "Chave E-mail",
  }),
  Object.freeze({
    type: PIX_KEY_TYPES.TELEFONE,
    label: "Celular",
    placeholder: "+55 11 99999-9999",
    inputMode: "tel",
    typeAttr: "tel",
    maxLength: KEY_DIALOG_MAX_LENGTHS.TELEFONE,
    fieldLabel: "Chave Celular",
  }),
  Object.freeze({
    type: PIX_KEY_TYPES.EVP,
    label: "Aleatória",
    placeholder: "123e4567-e89b-12d3-a456-426614174000",
    inputMode: "text",
    typeAttr: "text",
    maxLength: KEY_DIALOG_MAX_LENGTHS.EVP,
    fieldLabel: "Chave Aleatória (EVP)",
  }),
]);

/**
 * Localiza a configuração de tipo de chave correspondente.
 * Retorna a configuração padrão de CPF caso o tipo não seja encontrado ou seja inválido.
 *
 * @param {string} [tipo=""] Identificador do tipo de chave PIX
 * @returns {object} Configuração imutável do tipo de chave
 */
export function getKeyTypeConfig(tipo = "") {
  const normalized = typeof tipo === "string" ? tipo.trim().toUpperCase() : "";
  const found = KEY_DIALOG_TYPES_CONFIG.find((cfg) => cfg.type === normalized);
  return (
    found ||
    KEY_DIALOG_TYPES_CONFIG.find((cfg) => cfg.type === DEFAULT_KEY_DIALOG_INITIAL_TYPE)
  );
}
