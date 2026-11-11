import { KEY_EMPTY_ICONS } from "./pix-key-empty.constants.js";

/**
 * Template especializado para o Web Component <pix-key-empty>.
 * Renderiza o estado vazio quando o usuário não possui chaves cadastradas,
 * com ícone, títulos explicativos e botão de ação primária (CTA).
 *
 * @param {object} [context={}]
 * @param {string} [context.titleText]
 * @param {string} [context.descriptionText]
 * @param {string} [context.ctaText]
 * @returns {string} HTML markup
 */
export function pixKeyEmptyTemplate({
  titleText = "",
  descriptionText = "",
  ctaText = "",
} = {}) {
  return `
      <div class="key-empty-state__icon">
        <vector-icon name="${KEY_EMPTY_ICONS.KEY}"></vector-icon>
      </div>
      <div>
        <h2 class="key-empty-state__title">${titleText}</h2>
        <p class="key-empty-state__description">${descriptionText}</p>
      </div>
      <button
        type="button"
        class="charge-cta key-empty-state__cta"
        data-action="open-key-dialog"
        aria-label="${ctaText}"
      >
        <vector-icon name="${KEY_EMPTY_ICONS.PLUS}"></vector-icon>
        <span>${ctaText}</span>
      </button>
    `;
}

export default pixKeyEmptyTemplate;
