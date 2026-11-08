/**
 * Constantes canônicas, seletores BEM, configurações de presets e textos padrão
 * do componente <pix-charge-form>.
 * Alinhado às regras de negócio RN02, RN03, RN04, à especificação de acessibilidade W3C ARIA,
 * à Clean Architecture e ao protótipo da interface em docs/design/ui_prototype.html.
 */

/**
 * Indicador numérico da etapa no fluxo da aplicação ("Passo 2").
 */
export const DEFAULT_CHARGE_FORM_STEP = "2";

/**
 * Título padrão exibido no cabeçalho do campo de valor da cobrança.
 */
export const DEFAULT_CHARGE_FORM_TITLE = "Valor da cobrança";

/**
 * Identificador semântico do elemento de rótulo para associação acessível.
 */
export const DEFAULT_CHARGE_FORM_TITLE_ID = "charge-amount-label";

/**
 * Identificador HTML do campo de entrada monetária.
 */
export const DEFAULT_CHARGE_FORM_INPUT_ID = "charge-amount";

/**
 * Rótulo da badge informativa que indica que o valor é opcional.
 */
export const DEFAULT_CHARGE_FORM_OPTIONAL_BADGE = "Opcional";

/**
 * Texto de espaço reservado (placeholder) exibido no campo monetário.
 */
export const DEFAULT_CHARGE_FORM_PLACEHOLDER = "0,00 (Valor aberto)";

/**
 * Prefixo monetário fixo exibido à esquerda do campo de entrada.
 */
export const DEFAULT_CHARGE_FORM_CURRENCY = "R$";

/**
 * Rótulo e tooltip acessível do botão de limpeza rápida de valor.
 */
export const DEFAULT_CHARGE_FORM_CLEAR_LABEL = "Limpar e manter valor aberto";

/**
 * Rótulo padrão do botão principal de submissão e geração da cobrança.
 */
export const DEFAULT_CHARGE_FORM_CTA_LABEL = "Manda um PIX";

/**
 * Tooltip e dica acessível exibida no botão principal quando desabilitado (sem chave ativa).
 */
export const DEFAULT_CHARGE_FORM_CTA_DISABLED_TITLE =
  "Selecione ou cadastre uma chave PIX para gerar a cobrança";

/**
 * Texto de status indicando modalidade de cobrança com valor aberto (pagador define).
 */
export const DEFAULT_CHARGE_FORM_STATUS_OPEN = "Valor aberto (pagador define)";

/**
 * Prefixo do texto de status quando um valor monetário fixo for informado.
 */
export const DEFAULT_CHARGE_FORM_STATUS_FIXED_PREFIX = "Valor fixo: R$ ";

/**
 * Atalhos rápidos de valores predefinidos (Presets) disponibilizados no rodapé do campo.
 */
export const CHARGE_FORM_PRESETS = Object.freeze([
  Object.freeze({
    id: "open",
    label: "Aberto",
    value: "",
    ariaLabel: "Definir valor aberto (pagador define)",
  }),
  Object.freeze({
    id: "25",
    label: "R$ 25",
    value: "25,00",
    ariaLabel: "Definir valor fixo de R$ 25,00",
  }),
  Object.freeze({
    id: "50",
    label: "R$ 50",
    value: "50,00",
    ariaLabel: "Definir valor fixo de R$ 50,00",
  }),
]);

/**
 * Nomes canônicos dos eventos customizados emitidos pelo componente.
 */
export const CHARGE_FORM_EVENT_NAMES = Object.freeze({
  CHARGE_GENERATED: "charge-generated",
  AMOUNT_CHANGED: "charge-amount-changed",
  OPEN_KEY_DIALOG: "open-key-dialog",
});

/**
 * Identificadores dos ícones vetoriais consumidos pelo componente via <vector-icon>.
 */
export const CHARGE_FORM_ICONS = Object.freeze({
  QRCODE: "qrcode",
  XMARK: "xmark",
  ALERT: "circle-exclamation",
});

/**
 * Mapeamento das classes BEM utilizadas na estrutura do formulário de cobrança.
 */
export const CHARGE_FORM_CLASSES = Object.freeze({
  ROOT: "charge-form",
  CARD: "card",
  AMOUNT_FIELD: "amount-field",
  SECTION_HEADER: "section-header",
  HEADER_TITLE_GROUP: "section-header__title-group",
  STEP_BADGE: "step-badge",
  TITLE: "section-header__title",
  OPTIONAL_BADGE: "amount-field__optional-badge",
  BOX: "amount-field__box",
  CURRENCY: "amount-field__currency",
  INPUT: "amount-field__input",
  INPUT_ERROR: "amount-field__input--error",
  CLEAR_BTN: "amount-field__clear-btn",
  CLEAR_BTN_HIDDEN: "amount-field__clear-btn--hidden",
  FOOTER: "amount-field__footer",
  STATUS: "amount-field__status",
  STATUS_OPEN: "amount-field__status--open",
  STATUS_FIXED: "amount-field__status--fixed",
  SHORTCUTS: "amount-field__shortcuts",
  PRESET: "amount-field__preset",
  PRESET_ACTIVE: "amount-field__preset--active",
  ALERT: "charge-form__alert",
  ALERT_ICON: "charge-form__alert-icon",
  ALERT_TEXT: "charge-form__alert-text",
  CTA: "charge-cta",
  CTA_DISABLED: "charge-cta--disabled",
});

/**
 * Nomes dos serviços injetáveis registrados no contêiner DI via SetInjectable.
 */
export const CHARGE_FORM_INJECTABLES = Object.freeze({
  GENERATE_PIX_CHARGE_USE_CASE: "generate-pix-charge-use-case",
  PIX_KEY_REPOSITORY: "pix-key-repository",
});

/**
 * Formata o texto descritivo da pílula de status para um valor fixo.
 *
 * @param {string|number} amount Valor monetário formatado ou numérico
 * @returns {string} Texto formatado para exibição
 */
export function formatFixedAmountStatus(amount) {
  if (amount === null || amount === undefined || amount === "") {
    return DEFAULT_CHARGE_FORM_STATUS_OPEN;
  }
  const cleanAmount = String(amount)
    .replace(/^\s*R\$\s*/i, "")
    .trim();
  return cleanAmount
    ? `${DEFAULT_CHARGE_FORM_STATUS_FIXED_PREFIX}${cleanAmount}`
    : DEFAULT_CHARGE_FORM_STATUS_OPEN;
}

/**
 * Converte e valida uma string de valor monetário ou número para representação numérica e status.
 *
 * @param {*} rawValue Valor bruto inserido no campo de entrada
 * @returns {{ isFixed: boolean, numericAmount: number|null, statusText: string, statusClass: string }}
 */
export function parseChargeAmount(rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return {
      isFixed: false,
      numericAmount: null,
      statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
      statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
    };
  }

  const cleanString = String(rawValue)
    .replace(/^\s*R\$\s*/i, "")
    .trim();

  if (!cleanString) {
    return {
      isFixed: false,
      numericAmount: null,
      statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
      statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
    };
  }

  const normalized = cleanString.includes(",")
    ? cleanString.replace(/\./g, "").replace(",", ".")
    : cleanString;

  const numeric = Number(normalized);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return {
      isFixed: false,
      numericAmount: null,
      statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
      statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
    };
  }

  return {
    isFixed: true,
    numericAmount: Math.round((numeric + Number.EPSILON) * 100) / 100,
    statusText: formatFixedAmountStatus(cleanString),
    statusClass: CHARGE_FORM_CLASSES.STATUS_FIXED,
  };
}

/**
 * Retorna o título / tooltip do botão CTA considerando se há chave ativa selecionada.
 *
 * @param {boolean} hasSelectedKey Indica se há uma chave selecionada ativa
 * @param {string} [customTitle=""] Título alternativo customizado opcional
 * @returns {string} Tooltip descritivo acessível
 */
export function resolveCtaTooltip(hasSelectedKey, customTitle = "") {
  if (!hasSelectedKey) {
    return DEFAULT_CHARGE_FORM_CTA_DISABLED_TITLE;
  }
  return customTitle || DEFAULT_CHARGE_FORM_CTA_LABEL;
}
