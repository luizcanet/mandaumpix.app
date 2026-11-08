/**
 * Constantes canônicas, seletores BEM e textos padrão do componente <pix-key-selector>.
 * Alinhado às regras de negócio RN01, RN02, à especificação de acessibilidade W3C ARIA
 * e ao protótipo da interface em docs/design/ui_prototype.html.
 */

/**
 * Indicador numérico da etapa no fluxo da aplicação ("Passo 1").
 */
export const DEFAULT_KEY_SELECTOR_STEP = "1";

/**
 * Título padrão exibido no cabeçalho da seção de chaves PIX.
 */
export const DEFAULT_KEY_SELECTOR_TITLE = "Chave para recebimento";

/**
 * Identificador semântico do título para associação acessível (aria-labelledby).
 */
export const DEFAULT_KEY_SELECTOR_TITLE_ID = "key-selector-title";

/**
 * Rótulo do botão de ação secundária para adicionar nova chave no cabeçalho.
 */
export const DEFAULT_KEY_SELECTOR_ADD_BTN_LABEL = "Nova chave";

/**
 * Rótulo acessível da lista de cartões de chave (role="radiogroup").
 */
export const DEFAULT_KEY_SELECTOR_LIST_LABEL = "Chaves PIX cadastradas";

/**
 * Título/tooltip padrão do botão de exclusão de chave.
 */
export const DEFAULT_KEY_SELECTOR_DELETE_TITLE = "Remover chave";

/**
 * Formata o rótulo acessível aria-label para o botão de exclusão de uma chave.
 *
 * @param {string} [label=""] Apelido ou rótulo amigável da conta/chave
 * @returns {string} Texto formatado para leitores de tela
 */
export function formatKeyDeleteAriaLabel(label = "") {
  const normalizedLabel = typeof label === "string" ? label.trim() : "";
  return normalizedLabel
    ? `Remover chave ${normalizedLabel}`
    : "Remover chave PIX";
}

/**
 * Nomes canônicos dos eventos customizados emitidos pelo componente.
 */
export const KEY_SELECTOR_EVENT_NAMES = Object.freeze({
  OPEN_KEY_DIALOG: "open-key-dialog",
  SELECT_KEY: "select-key",
  DELETE_KEY: "delete-key",
});

/**
 * Identificadores dos ícones vetoriais consumidos pelo componente via <vector-icon>.
 */
export const KEY_SELECTOR_ICONS = Object.freeze({
  PLUS: "plus",
  TRASH: "trash",
  KEY: "key",
});

/**
 * Mapeamento das classes BEM utilizadas na estrutura do seletor de chaves.
 */
export const KEY_SELECTOR_CLASSES = Object.freeze({
  ROOT: "key-selector",
  CARD: "card",
  SECTION_HEADER: "section-header",
  HEADER_TITLE_GROUP: "section-header__title-group",
  STEP_BADGE: "step-badge",
  TITLE: "section-header__title",
  ADD_BTN: "key-selector__add-btn",
  LIST: "key-selector__list",
  ITEM: "key-selector__card",
  ITEM_SELECTED: "key-selector__card--selected",
  CARD_LEFT: "key-selector__card-left",
  RADIO: "key-selector__radio",
  RADIO_DOT: "key-selector__radio-dot",
  META: "key-selector__meta",
  TITLE_ROW: "key-selector__title-row",
  LABEL: "key-selector__label",
  TYPE_BADGE: "key-selector__type-badge",
  VALUE: "key-selector__value",
  DELETE_BTN: "key-selector__delete-btn",
});

/**
 * Nomes dos serviços injetáveis registrados no contêiner DI via SetInjectable.
 */
export const KEY_SELECTOR_INJECTABLES = Object.freeze({
  SELECT_PIX_KEY_USE_CASE: "select-pix-key-use-case",
  DELETE_PIX_KEY_USE_CASE: "delete-pix-key-use-case",
  LIST_PIX_KEYS_USE_CASE: "list-pix-keys-use-case",
  PIX_KEY_REPOSITORY: "pix-key-repository",
});
