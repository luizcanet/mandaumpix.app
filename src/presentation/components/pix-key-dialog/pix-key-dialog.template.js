import {
  DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL,
  DEFAULT_KEY_DIALOG_CLOSE_TITLE,
  DEFAULT_KEY_DIALOG_FIELD_LABELS,
  DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL,
  DEFAULT_KEY_DIALOG_TITLE,
  DEFAULT_KEY_DIALOG_TITLE_ID,
  KEY_DIALOG_CLASSES,
  KEY_DIALOG_ICONS,
  KEY_DIALOG_MAX_LENGTHS,
  KEY_DIALOG_TYPES_CONFIG,
  getKeyTypeConfig,
} from "./pix-key-dialog.constants.js";

/**
 * Escapa caracteres HTML para mitigar riscos de injeção de script (XSS).
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
 * Renderiza o grupo de botões seletores do tipo de chave PIX.
 *
 * @param {string} selectedKeyType
 * @returns {string}
 */
export function pixKeyDialogTypesTemplate(selectedKeyType) {
  return KEY_DIALOG_TYPES_CONFIG.map((cfg) => {
    const isActive = cfg.type === selectedKeyType;
    const activeClass = isActive
      ? ` ${KEY_DIALOG_CLASSES.TYPE_BTN_ACTIVE}`
      : "";
    return `
        <button
          type="button"
          class="${KEY_DIALOG_CLASSES.TYPE_BTN}${activeClass}"
          data-type="${cfg.type}"
          aria-pressed="${isActive ? "true" : "false"}"
        >
          ${escapeHtml(cfg.label)}
        </button>
      `;
  }).join("");
}

/**
 * Template especializado para o Web Component <pix-key-dialog>.
 * Renderiza o modal acessível (<dialog>) para inclusão/cadastro de novas chaves PIX.
 *
 * @param {object} [context={}]
 * @param {string} [context.selectedKeyType="CPF"]
 * @param {string} [context.titleText]
 * @param {string} [context.closeTitle]
 * @param {string} [context.saveBtnLabel]
 * @param {string} [context.cancelBtnLabel]
 * @param {string} [context.keyValue]
 * @param {string} [context.accountLabel]
 * @param {string} [context.merchantName]
 * @param {string} [context.merchantCity]
 * @param {string|null} [context.errorMessage]
 * @param {string|null} [context.errorField]
 * @returns {string} HTML markup
 */
export function pixKeyDialogTemplate(context = {}) {
  const selectedKeyType = context.selectedKeyType || "CPF";
  const titleText = context.titleText || DEFAULT_KEY_DIALOG_TITLE;
  const closeTitle = context.closeTitle || DEFAULT_KEY_DIALOG_CLOSE_TITLE;
  const saveBtnLabel =
    context.saveBtnLabel || DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL;
  const cancelBtnLabel =
    context.cancelBtnLabel || DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL;
  const keyValue = context.keyValue || "";
  const accountLabel = context.accountLabel || "";
  const merchantName = context.merchantName || "";
  const merchantCity = context.merchantCity || "";
  const errorMessage = context.errorMessage || null;
  const errorField = context.errorField || null;

  const activeTypeConfig = getKeyTypeConfig(selectedKeyType);
  const typesHtml = pixKeyDialogTypesTemplate(selectedKeyType);

  const alertHtml = errorMessage
    ? `
        <div class="${KEY_DIALOG_CLASSES.ALERT}" role="alert" aria-live="assertive">
          <vector-icon name="${KEY_DIALOG_ICONS.CIRCLE_EXCLAMATION}" class="${KEY_DIALOG_CLASSES.ALERT_ICON}"></vector-icon>
          <span class="${KEY_DIALOG_CLASSES.ALERT_TEXT}">${escapeHtml(errorMessage)}</span>
        </div>
      `
    : "";

  const keyInputErrorClass =
    errorField === "valor_chave" ? ` ${KEY_DIALOG_CLASSES.INPUT_ERROR}` : "";
  const nameInputErrorClass =
    errorField === "nome_recebedor" ? ` ${KEY_DIALOG_CLASSES.INPUT_ERROR}` : "";
  const cityInputErrorClass =
    errorField === "cidade_recebedor"
      ? ` ${KEY_DIALOG_CLASSES.INPUT_ERROR}`
      : "";

  return `
      <dialog class="${KEY_DIALOG_CLASSES.ROOT}" aria-labelledby="${DEFAULT_KEY_DIALOG_TITLE_ID}" role="dialog">
        <header class="${KEY_DIALOG_CLASSES.HEADER}">
          <h2 id="${DEFAULT_KEY_DIALOG_TITLE_ID}" class="${KEY_DIALOG_CLASSES.TITLE}">
            ${escapeHtml(titleText)}
          </h2>
          <button
            type="button"
            class="${KEY_DIALOG_CLASSES.CLOSE_BTN}"
            title="${escapeHtml(closeTitle)}"
            aria-label="${escapeHtml(closeTitle)}"
          >
            <vector-icon name="${KEY_DIALOG_ICONS.XMARK}"></vector-icon>
          </button>
        </header>

        <form method="dialog" class="${KEY_DIALOG_CLASSES.FORM}">
          <div class="${KEY_DIALOG_CLASSES.TYPES}" role="group" aria-label="Tipo de chave PIX">
            ${typesHtml}
          </div>

          ${alertHtml}

          <div class="${KEY_DIALOG_CLASSES.FIELD}">
            <label for="key-dialog-input-key" class="${KEY_DIALOG_CLASSES.LABEL}">
              ${escapeHtml(activeTypeConfig.fieldLabel || DEFAULT_KEY_DIALOG_FIELD_LABELS.KEY_VALUE)}
            </label>
            <input
              id="key-dialog-input-key"
              name="valor_chave"
              type="${activeTypeConfig.typeAttr || "text"}"
              inputmode="${activeTypeConfig.inputMode || "text"}"
              placeholder="${escapeHtml(activeTypeConfig.placeholder)}"
              maxlength="${activeTypeConfig.maxLength || 77}"
              value="${escapeHtml(keyValue)}"
              class="${KEY_DIALOG_CLASSES.INPUT}${keyInputErrorClass}"
              required
            />
          </div>

          <div class="${KEY_DIALOG_CLASSES.FIELD}">
            <label for="key-dialog-input-label" class="${KEY_DIALOG_CLASSES.LABEL}">
              ${escapeHtml(DEFAULT_KEY_DIALOG_FIELD_LABELS.ACCOUNT_LABEL)}
            </label>
            <input
              id="key-dialog-input-label"
              name="rotulo"
              type="text"
              placeholder="${escapeHtml(DEFAULT_KEY_DIALOG_FIELD_LABELS.ACCOUNT_LABEL_PLACEHOLDER)}"
              maxlength="${KEY_DIALOG_MAX_LENGTHS.ACCOUNT_LABEL}"
              value="${escapeHtml(accountLabel)}"
              class="${KEY_DIALOG_CLASSES.INPUT}"
            />
          </div>

          <div class="${KEY_DIALOG_CLASSES.ROW}">
            <div class="${KEY_DIALOG_CLASSES.FIELD}">
              <label for="key-dialog-input-holder" class="${KEY_DIALOG_CLASSES.LABEL}">
                ${escapeHtml(DEFAULT_KEY_DIALOG_FIELD_LABELS.MERCHANT_NAME)}
              </label>
              <input
                id="key-dialog-input-holder"
                name="nome_recebedor"
                type="text"
                placeholder="${escapeHtml(DEFAULT_KEY_DIALOG_FIELD_LABELS.MERCHANT_NAME_PLACEHOLDER)}"
                maxlength="${KEY_DIALOG_MAX_LENGTHS.MERCHANT_NAME}"
                value="${escapeHtml(merchantName)}"
                class="${KEY_DIALOG_CLASSES.INPUT}${nameInputErrorClass}"
                required
              />
            </div>
            <div class="${KEY_DIALOG_CLASSES.FIELD}">
              <label for="key-dialog-input-city" class="${KEY_DIALOG_CLASSES.LABEL}">
                ${escapeHtml(DEFAULT_KEY_DIALOG_FIELD_LABELS.MERCHANT_CITY)}
              </label>
              <input
                id="key-dialog-input-city"
                name="cidade_recebedor"
                type="text"
                placeholder="${escapeHtml(DEFAULT_KEY_DIALOG_FIELD_LABELS.MERCHANT_CITY_PLACEHOLDER)}"
                maxlength="${KEY_DIALOG_MAX_LENGTHS.MERCHANT_CITY}"
                value="${escapeHtml(merchantCity)}"
                class="${KEY_DIALOG_CLASSES.INPUT}${cityInputErrorClass}"
                required
              />
            </div>
          </div>

          <div class="${KEY_DIALOG_CLASSES.ACTIONS}">
            <button type="button" class="${KEY_DIALOG_CLASSES.BTN_CANCEL}">
              ${escapeHtml(cancelBtnLabel)}
            </button>
            <button type="submit" class="${KEY_DIALOG_CLASSES.BTN_SAVE}">
              <vector-icon name="${KEY_DIALOG_ICONS.CHECK}"></vector-icon>
              <span>${escapeHtml(saveBtnLabel)}</span>
            </button>
          </div>
        </form>
      </dialog>
    `;
}

export default pixKeyDialogTemplate;
