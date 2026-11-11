import {
  DEFAULT_KEY_SELECTOR_TITLE_ID,
  KEY_SELECTOR_CLASSES,
  KEY_SELECTOR_ICONS,
  formatKeyDeleteAriaLabel,
} from "./pix-key-selector.constants.js";

/**
 * Escapa caracteres HTML para prevenir injeção de script (XSS).
 *
 * @param {*} value
 * @returns {string}
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Renderiza um card individual de chave PIX dentro do grupo de seleção.
 *
 * @param {object} item - Chave PIX
 * @param {object} options
 * @param {string|null} [options.selectedKeyId]
 * @param {string} [options.deleteTitle]
 * @returns {string}
 */
export function pixKeyCardTemplate(
  item,
  { selectedKeyId = null, deleteTitle = "" } = {},
) {
  const isSelected = item.id === selectedKeyId;
  const selectedClass = isSelected
    ? ` ${KEY_SELECTOR_CLASSES.ITEM_SELECTED}`
    : "";
  const tabIndex = isSelected ? "0" : "-1";
  const ariaChecked = isSelected ? "true" : "false";
  const escapedLabel = escapeHtml(item.rotulo);
  const escapedType = escapeHtml(item.tipo_chave);
  const escapedValue = escapeHtml(item.valor_chave);
  const deleteAriaLabel = escapeHtml(formatKeyDeleteAriaLabel(item.rotulo));
  const escapedDeleteTitle = escapeHtml(deleteTitle);

  return `
            <div
              role="radio"
              aria-checked="${ariaChecked}"
              tabindex="${tabIndex}"
              data-key-id="${item.id}"
              class="${KEY_SELECTOR_CLASSES.ITEM}${selectedClass}"
            >
              <div class="${KEY_SELECTOR_CLASSES.CARD_LEFT}">
                <span class="${KEY_SELECTOR_CLASSES.RADIO}">
                  ${isSelected ? `<span class="${KEY_SELECTOR_CLASSES.RADIO_DOT}"></span>` : ""}
                </span>
                <div class="${KEY_SELECTOR_CLASSES.META}">
                  <div class="${KEY_SELECTOR_CLASSES.TITLE_ROW}">
                    <span class="${KEY_SELECTOR_CLASSES.LABEL}">${escapedLabel}</span>
                    <span class="${KEY_SELECTOR_CLASSES.TYPE_BADGE}">${escapedType}</span>
                  </div>
                  <div class="${KEY_SELECTOR_CLASSES.VALUE}">${escapedValue}</div>
                </div>
              </div>
              <button
                type="button"
                class="${KEY_SELECTOR_CLASSES.DELETE_BTN}"
                title="${escapedDeleteTitle}"
                aria-label="${deleteAriaLabel}"
                data-action="delete"
                data-key-id="${item.id}"
              >
                <vector-icon name="${KEY_SELECTOR_ICONS.TRASH}"></vector-icon>
              </button>
            </div>
          `;
}

/**
 * Template especializado para o Web Component <pix-key-selector>.
 * Renderiza o Passo 1 da aplicação: cabeçalho com indicador de passo, botão para abrir
 * modal de cadastro e a lista com rádios acessíveis das chaves cadastradas.
 *
 * @param {object} [context={}]
 * @param {Array<object>} [context.keys]
 * @param {string|null} [context.selectedKeyId]
 * @param {string} [context.stepText]
 * @param {string} [context.titleText]
 * @param {string} [context.addBtnLabel]
 * @param {string} [context.listLabel]
 * @param {string} [context.deleteTitle]
 * @returns {string} HTML markup
 */
export function pixKeySelectorTemplate(context = {}) {
  const keys = context.keys || [];
  const selectedKeyId = context.selectedKeyId ?? null;
  const stepText = context.stepText ?? "";
  const titleText = context.titleText ?? "";
  const addBtnLabel = context.addBtnLabel ?? "";
  const listLabel = context.listLabel ?? "";
  const deleteTitle = context.deleteTitle ?? "";

  const cardsHtml = keys
    .map((item) => pixKeyCardTemplate(item, { selectedKeyId, deleteTitle }))
    .join("");

  return `
        <div class="${KEY_SELECTOR_CLASSES.SECTION_HEADER}">
          <div class="${KEY_SELECTOR_CLASSES.HEADER_TITLE_GROUP}">
            <span class="${KEY_SELECTOR_CLASSES.STEP_BADGE}">${escapeHtml(stepText)}</span>
            <h2 id="${DEFAULT_KEY_SELECTOR_TITLE_ID}" class="${KEY_SELECTOR_CLASSES.TITLE}">
              ${escapeHtml(titleText)}
            </h2>
          </div>
          <button
            type="button"
            class="${KEY_SELECTOR_CLASSES.ADD_BTN}"
            data-action="open-key-dialog"
          >
            <vector-icon name="${KEY_SELECTOR_ICONS.PLUS}"></vector-icon>
            <span>${escapeHtml(addBtnLabel)}</span>
          </button>
        </div>

        <div
          class="${KEY_SELECTOR_CLASSES.LIST}"
          role="radiogroup"
          aria-labelledby="${DEFAULT_KEY_SELECTOR_TITLE_ID}"
          aria-label="${escapeHtml(listLabel)}"
        >
          ${cardsHtml}
        </div>
      `;
}

export default pixKeySelectorTemplate;
