import {
  CHARGE_FORM_CLASSES,
  CHARGE_FORM_ICONS,
  CHARGE_FORM_PRESETS,
  DEFAULT_CHARGE_FORM_CLEAR_LABEL,
  DEFAULT_CHARGE_FORM_CURRENCY,
  DEFAULT_CHARGE_FORM_INPUT_ID,
  DEFAULT_CHARGE_FORM_OPTIONAL_BADGE,
  DEFAULT_CHARGE_FORM_PLACEHOLDER,
  DEFAULT_CHARGE_FORM_TITLE_ID,
  parseChargeAmount,
  resolveCtaTooltip,
} from "./pix-charge-form.constants.js";

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
 * Renderiza os botões de atalho/preset de valor.
 *
 * @param {string} currentAmount
 * @param {object} parsedAmount
 * @returns {string}
 */
export function pixChargePresetsTemplate(currentAmount, parsedAmount) {
  return CHARGE_FORM_PRESETS.map((preset) => {
    const isActive =
      preset.value === currentAmount ||
      (preset.value === "" && !parsedAmount.isFixed);
    const activeClass = isActive ? ` ${CHARGE_FORM_CLASSES.PRESET_ACTIVE}` : "";

    return `
          <button
            type="button"
            class="${CHARGE_FORM_CLASSES.PRESET}${activeClass}"
            data-preset="${escapeHtml(preset.id)}"
            data-value="${escapeHtml(preset.value)}"
            aria-label="${escapeHtml(preset.ariaLabel)}"
          >
            ${escapeHtml(preset.label)}
          </button>
        `;
  }).join("");
}

/**
 * Template especializado para o Web Component <pix-charge-form>.
 * Renderiza o Passo 2 (entrada de valor opcional com atalhos) e o Passo 3 (CTA principal para gerar cobrança).
 *
 * @param {object} [context={}]
 * @param {string} [context.amount]
 * @param {object|null} [context.selectedKey]
 * @param {string} [context.stepText]
 * @param {string} [context.titleText]
 * @param {string} [context.ctaText]
 * @param {string|null} [context.errorMessage]
 * @returns {string} HTML markup
 */
export function pixChargeFormTemplate(context = {}) {
  const amount = context.amount ?? "";
  const selectedKey = context.selectedKey ?? null;
  const stepText = context.stepText ?? "";
  const titleText = context.titleText ?? "";
  const ctaText = context.ctaText ?? "";
  const errorMessage = context.errorMessage ?? null;

  const parsedAmount = parseChargeAmount(amount);
  const isCtaDisabled = !selectedKey;
  const ctaTooltip = resolveCtaTooltip(!isCtaDisabled, ctaText);
  const ctaDisabledClass = isCtaDisabled
    ? ` ${CHARGE_FORM_CLASSES.CTA_DISABLED}`
    : "";
  const clearBtnHiddenClass = !amount
    ? ` ${CHARGE_FORM_CLASSES.CLEAR_BTN_HIDDEN}`
    : "";

  const presetsHtml = pixChargePresetsTemplate(amount, parsedAmount);

  const alertHtml = errorMessage
    ? `
          <div class="${CHARGE_FORM_CLASSES.ALERT}" role="alert" aria-live="assertive">
            <vector-icon class="${CHARGE_FORM_CLASSES.ALERT_ICON}" name="${CHARGE_FORM_ICONS.ALERT}"></vector-icon>
            <span class="${CHARGE_FORM_CLASSES.ALERT_TEXT}">${escapeHtml(errorMessage)}</span>
          </div>
        `
    : "";

  return `
        <div class="${CHARGE_FORM_CLASSES.CARD} ${CHARGE_FORM_CLASSES.AMOUNT_FIELD}">
          <div class="${CHARGE_FORM_CLASSES.SECTION_HEADER}">
            <div class="${CHARGE_FORM_CLASSES.HEADER_TITLE_GROUP}">
              <span class="${CHARGE_FORM_CLASSES.STEP_BADGE}">${escapeHtml(stepText)}</span>
              <label
                for="${DEFAULT_CHARGE_FORM_INPUT_ID}"
                id="${DEFAULT_CHARGE_FORM_TITLE_ID}"
                class="${CHARGE_FORM_CLASSES.TITLE}"
              >
                ${escapeHtml(titleText)}
              </label>
            </div>
            <span class="${CHARGE_FORM_CLASSES.OPTIONAL_BADGE}">
              ${escapeHtml(DEFAULT_CHARGE_FORM_OPTIONAL_BADGE)}
            </span>
          </div>

          <div class="${CHARGE_FORM_CLASSES.BOX}">
            <span class="${CHARGE_FORM_CLASSES.CURRENCY}">${escapeHtml(DEFAULT_CHARGE_FORM_CURRENCY)}</span>
            <input
              id="${DEFAULT_CHARGE_FORM_INPUT_ID}"
              type="text"
              inputmode="decimal"
              value="${escapeHtml(amount)}"
              placeholder="${escapeHtml(DEFAULT_CHARGE_FORM_PLACEHOLDER)}"
              class="${CHARGE_FORM_CLASSES.INPUT}"
            />
            <button
              type="button"
              class="${CHARGE_FORM_CLASSES.CLEAR_BTN}${clearBtnHiddenClass}"
              aria-label="${escapeHtml(DEFAULT_CHARGE_FORM_CLEAR_LABEL)}"
              title="${escapeHtml(DEFAULT_CHARGE_FORM_CLEAR_LABEL)}"
            >
              <vector-icon name="${CHARGE_FORM_ICONS.XMARK}"></vector-icon>
            </button>
          </div>

          <div class="${CHARGE_FORM_CLASSES.FOOTER}">
            <span
              class="${CHARGE_FORM_CLASSES.STATUS} ${parsedAmount.statusClass}"
              aria-live="polite"
            >
              ${escapeHtml(parsedAmount.statusText)}
            </span>

            <div class="${CHARGE_FORM_CLASSES.SHORTCUTS}">
              ${presetsHtml}
            </div>
          </div>
        </div>

        ${alertHtml}

        <button
          type="submit"
          class="${CHARGE_FORM_CLASSES.CTA}${ctaDisabledClass}"
          ${isCtaDisabled ? 'disabled aria-disabled="true"' : 'aria-disabled="false"'}
          title="${escapeHtml(ctaTooltip)}"
        >
          <vector-icon name="${CHARGE_FORM_ICONS.QRCODE}"></vector-icon>
          <span>${escapeHtml(ctaText)}</span>
        </button>
      `;
}

export default pixChargeFormTemplate;
