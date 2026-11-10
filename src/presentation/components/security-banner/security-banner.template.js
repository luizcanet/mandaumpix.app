import {
  DEFAULT_SECURITY_BANNER_DISMISS_LABEL,
  DEFAULT_SECURITY_BANNER_LINK_LABEL,
  DEFAULT_SECURITY_BANNER_MESSAGE,
  DEFAULT_SECURITY_BANNER_OFFICIAL_URL,
  DEFAULT_SECURITY_BANNER_TITLE,
  SECURITY_BANNER_ICONS,
} from "./security-banner.constants.js";

/**
 * Template especializado para o Web Component <security-banner>.
 * Renderiza um banner ostensivo de alerta com contraste WCAG AAA (INV-02),
 * advertindo sobre cópia não oficial e fornecendo link direto para o site legítimo.
 *
 * @param {object} [context={}]
 * @param {string} [context.titleText]
 * @param {string} [context.messageText]
 * @param {string} [context.officialUrl]
 * @param {string} [context.linkLabel]
 * @param {string} [context.dismissLabel]
 * @param {string} [context.iconName]
 * @param {string} [context.dismissIcon]
 * @returns {string} HTML markup
 */
export function securityBannerTemplate({
  titleText = DEFAULT_SECURITY_BANNER_TITLE,
  messageText = DEFAULT_SECURITY_BANNER_MESSAGE,
  officialUrl = DEFAULT_SECURITY_BANNER_OFFICIAL_URL,
  linkLabel = DEFAULT_SECURITY_BANNER_LINK_LABEL,
  dismissLabel = DEFAULT_SECURITY_BANNER_DISMISS_LABEL,
  iconName = SECURITY_BANNER_ICONS.WARNING,
  dismissIcon = SECURITY_BANNER_ICONS.DISMISS,
} = {}) {
  return `
    <div class="security-warning-banner__wrapper">
      <span class="security-warning-banner__icon" aria-hidden="true">
        <vector-icon name="${iconName}"></vector-icon>
      </span>
      <div class="security-warning-banner__content">
        <strong class="security-warning-banner__title">${titleText}</strong>
        <span class="security-warning-banner__message">${messageText}</span>
        <a
          href="${officialUrl}"
          class="security-warning-banner__link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>${linkLabel}</span>
        </a>
      </div>
      <button
        type="button"
        class="security-warning-banner__dismiss"
        data-action="dismiss"
        aria-label="${dismissLabel}"
        title="${dismissLabel}"
      >
        <vector-icon name="${dismissIcon}"></vector-icon>
      </button>
    </div>
  `.trim();
}

export default securityBannerTemplate;
