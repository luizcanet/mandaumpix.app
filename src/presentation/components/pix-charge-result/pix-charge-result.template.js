import {
  CHARGE_RESULT_CLASSES,
  CHARGE_RESULT_ICONS,
  DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK,
  DEFAULT_CHARGE_RESULT_BRCODE_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BRCODE_TITLE,
  DEFAULT_CHARGE_RESULT_BTN_COPY_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BTN_DOWNLOAD_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BTN_SHARE_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_COPIED_LABEL,
  DEFAULT_CHARGE_RESULT_COPY_LABEL,
  DEFAULT_CHARGE_RESULT_DOWNLOAD_LABEL,
  DEFAULT_CHARGE_RESULT_MODE_FIXED,
  DEFAULT_CHARGE_RESULT_MODE_OPEN,
  DEFAULT_CHARGE_RESULT_QR_ALT,
  DEFAULT_CHARGE_RESULT_SHARE_LABEL,
  DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION,
  DEFAULT_CHARGE_RESULT_WAITING_TITLE,
  formatAccountSummary,
  formatChargeAmountBadge,
  formatKeyMetadata,
} from "./pix-charge-result.constants.js";

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
 * Normaliza o payload visual do QR Code para exibição segura.
 *
 * @param {string|object|null} imagemQrcode
 * @returns {string}
 */
export function resolveQrContent(imagemQrcode) {
  if (!imagemQrcode) {
    return "";
  }

  if (typeof imagemQrcode === "string") {
    const trimmed = imagemQrcode.trim();
    if (trimmed.startsWith("<svg") || trimmed.includes("<svg")) {
      return trimmed;
    }
    return `<img src="${escapeHtml(trimmed)}" alt="${escapeHtml(DEFAULT_CHARGE_RESULT_QR_ALT)}" />`;
  }

  if (typeof imagemQrcode === "object") {
    if (imagemQrcode.svg && typeof imagemQrcode.svg === "string") {
      return imagemQrcode.svg.trim();
    }
    if (imagemQrcode.dataUrl && typeof imagemQrcode.dataUrl === "string") {
      return `<img src="${escapeHtml(imagemQrcode.dataUrl)}" alt="${escapeHtml(DEFAULT_CHARGE_RESULT_QR_ALT)}" />`;
    }
  }

  return "";
}

/**
 * Template especializado para o Web Component <pix-charge-result>.
 * Renderiza o palco de exibição de alto contraste do QR Code e código Copia e Cola,
 * além do estado de espera quando nenhuma cobrança foi gerada.
 *
 * @param {object} [context={}]
 * @param {object|null} [context.charge]
 * @param {boolean} [context.isCopied]
 * @returns {string} HTML markup
 */
export function pixChargeResultTemplate(context = {}) {
  const charge = context.charge ?? null;
  const isCopied = Boolean(context.isCopied);

  if (!charge) {
    return `
          <div class="${CHARGE_RESULT_CLASSES.WAITING}">
            <vector-icon
              class="${CHARGE_RESULT_CLASSES.WAITING_ICON}"
              name="${CHARGE_RESULT_ICONS.QRCODE}"
            ></vector-icon>
            <h3 class="${CHARGE_RESULT_CLASSES.WAITING_TITLE}">
              ${escapeHtml(DEFAULT_CHARGE_RESULT_WAITING_TITLE)}
            </h3>
            <p class="${CHARGE_RESULT_CLASSES.WAITING_DESC}">
              ${escapeHtml(DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION)}
            </p>
          </div>
        `;
  }

  const accountText = formatAccountSummary(charge.chave_conta);
  const badgeInfo = formatChargeAmountBadge(
    charge.valor_opcional,
    charge.valor_dinamico,
  );
  const modeText = charge.valor_dinamico
    ? DEFAULT_CHARGE_RESULT_MODE_OPEN
    : DEFAULT_CHARGE_RESULT_MODE_FIXED;
  const metaText = formatKeyMetadata(charge.chave_conta);
  const brCode = charge.chave_cobranca || "";
  const qrContent = resolveQrContent(charge.imagem_qrcode);

  const copyLabel = isCopied
    ? DEFAULT_CHARGE_RESULT_COPIED_LABEL
    : DEFAULT_CHARGE_RESULT_COPY_LABEL;
  const copyIcon = isCopied
    ? CHARGE_RESULT_ICONS.CHECK
    : CHARGE_RESULT_ICONS.COPY;
  const copyModifier = isCopied ? ` ${CHARGE_RESULT_CLASSES.BTN_COPIED}` : "";

  return `
        <div class="${CHARGE_RESULT_CLASSES.HEADER}">
          <div class="${CHARGE_RESULT_CLASSES.HEADER_INFO}">
            <h3 class="${CHARGE_RESULT_CLASSES.ACCOUNT}">
              ${escapeHtml(accountText || DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK)}
            </h3>
          </div>
          <span class="${badgeInfo.className}">
            ${escapeHtml(badgeInfo.text)}
          </span>
        </div>

        <div class="${CHARGE_RESULT_CLASSES.QR_STAGE}">
          <div class="${CHARGE_RESULT_CLASSES.QR_FRAME}">
            <div class="${CHARGE_RESULT_CLASSES.QR_SVG}">
              ${qrContent}
            </div>
          </div>
          <p class="${CHARGE_RESULT_CLASSES.META}">${escapeHtml(metaText)}</p>
        </div>

        <div class="${CHARGE_RESULT_CLASSES.BRCODE_WRAPPER}">
          <div class="${CHARGE_RESULT_CLASSES.BRCODE_LABEL}">
            <span class="${CHARGE_RESULT_CLASSES.BRCODE_TITLE}">
              ${DEFAULT_CHARGE_RESULT_BRCODE_TITLE}
            </span>
            <span class="${CHARGE_RESULT_CLASSES.BRCODE_MODE}">
              ${escapeHtml(modeText)}
            </span>
          </div>
          <div
            class="${CHARGE_RESULT_CLASSES.BRCODE}"
            tabindex="0"
            role="region"
            aria-label="${DEFAULT_CHARGE_RESULT_BRCODE_ARIA_LABEL}"
          >${escapeHtml(brCode)}</div>
        </div>

        <div class="${CHARGE_RESULT_CLASSES.ACTIONS}">
          <button
            type="button"
            class="${CHARGE_RESULT_CLASSES.BTN} ${CHARGE_RESULT_CLASSES.BTN_COPY}${copyModifier}"
            aria-label="${DEFAULT_CHARGE_RESULT_BTN_COPY_ARIA_LABEL}"
          >
            <vector-icon name="${copyIcon}"></vector-icon>
            <span>${escapeHtml(copyLabel)}</span>
          </button>

          <button
            type="button"
            class="${CHARGE_RESULT_CLASSES.BTN} ${CHARGE_RESULT_CLASSES.BTN_SHARE}"
            aria-label="${DEFAULT_CHARGE_RESULT_BTN_SHARE_ARIA_LABEL}"
          >
            <vector-icon name="${CHARGE_RESULT_ICONS.SHARE}"></vector-icon>
            <span>${escapeHtml(DEFAULT_CHARGE_RESULT_SHARE_LABEL)}</span>
          </button>

          <button
            type="button"
            class="${CHARGE_RESULT_CLASSES.BTN} ${CHARGE_RESULT_CLASSES.BTN_DOWNLOAD}"
            aria-label="${DEFAULT_CHARGE_RESULT_BTN_DOWNLOAD_ARIA_LABEL}"
          >
            <vector-icon name="${CHARGE_RESULT_ICONS.DOWNLOAD}"></vector-icon>
            <span>${escapeHtml(DEFAULT_CHARGE_RESULT_DOWNLOAD_LABEL)}</span>
          </button>

          <slot name="actions"></slot>
        </div>
      `;
}

export default pixChargeResultTemplate;
