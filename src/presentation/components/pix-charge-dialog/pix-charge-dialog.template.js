import {
  CHARGE_DIALOG_CLASSES,
  CHARGE_DIALOG_ICONS,
  DEFAULT_CHARGE_DIALOG_ARIA_LABEL,
  DEFAULT_CHARGE_DIALOG_CLOSE_TITLE,
  DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL,
  DEFAULT_CHARGE_DIALOG_TITLE,
  DEFAULT_CHARGE_DIALOG_TITLE_ID,
} from "./pix-charge-dialog.constants.js";

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
 * Renderiza o template do título do diálogo com ícone.
 *
 * @param {string} [titleText=DEFAULT_CHARGE_DIALOG_TITLE]
 * @returns {string}
 */
export function pixChargeDialogTitleTemplate(
  titleText = DEFAULT_CHARGE_DIALOG_TITLE,
) {
  return `
      <h3 id="${DEFAULT_CHARGE_DIALOG_TITLE_ID}" class="${CHARGE_DIALOG_CLASSES.TITLE}">
        <vector-icon name="${CHARGE_DIALOG_ICONS.CHECK}"></vector-icon>
        <span>${escapeHtml(titleText)}</span>
      </h3>
    `;
}

/**
 * Renderiza o botão inferior de conclusão/fechamento do diálogo.
 *
 * @param {string} [dismissBtnLabel=DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL]
 * @returns {string}
 */
export function pixChargeDialogDismissBtnTemplate(
  dismissBtnLabel = DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL,
) {
  return `
      <button
        type="button"
        class="${CHARGE_DIALOG_CLASSES.DISMISS_BTN}"
      >
        <vector-icon name="${CHARGE_DIALOG_ICONS.CHECK}"></vector-icon>
        <span>${escapeHtml(dismissBtnLabel)}</span>
      </button>
    `;
}

/**
 * Template especializado para o Web Component <pix-charge-dialog>.
 * Renderiza a caixa de diálogo modal (<dialog>) acessível para exibição e distribuição de cobranças PIX geradas.
 *
 * @param {object} [context={}]
 * @param {string} [context.titleText]
 * @param {string} [context.closeTitle]
 * @param {string} [context.dismissBtnLabel]
 * @returns {string} HTML markup
 */
export function pixChargeDialogTemplate(context = {}) {
  const titleText = context.titleText || DEFAULT_CHARGE_DIALOG_TITLE;
  const closeTitle = context.closeTitle || DEFAULT_CHARGE_DIALOG_CLOSE_TITLE;
  const dismissBtnLabel =
    context.dismissBtnLabel || DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL;

  return `
      <dialog
        class="${CHARGE_DIALOG_CLASSES.ROOT}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${DEFAULT_CHARGE_DIALOG_TITLE_ID}"
        aria-label="${escapeHtml(DEFAULT_CHARGE_DIALOG_ARIA_LABEL)}"
      >
        <div class="${CHARGE_DIALOG_CLASSES.TOP_BAR}">
          ${pixChargeDialogTitleTemplate(titleText)}
          <button
            type="button"
            class="${CHARGE_DIALOG_CLASSES.CLOSE_BTN}"
            title="${escapeHtml(closeTitle)}"
            aria-label="${escapeHtml(closeTitle)}"
          >
            <vector-icon name="${CHARGE_DIALOG_ICONS.XMARK}"></vector-icon>
          </button>
        </div>

        <div class="${CHARGE_DIALOG_CLASSES.BODY}">
          <pix-charge-result></pix-charge-result>
        </div>

        ${pixChargeDialogDismissBtnTemplate(dismissBtnLabel)}
      </dialog>
    `;
}

export default pixChargeDialogTemplate;
