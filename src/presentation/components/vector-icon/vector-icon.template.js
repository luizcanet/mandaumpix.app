/**
 * Template especializado para o Web Component <vector-icon>.
 * Renderiza o elemento SVG contendo a tag <use> referenciando o symbol correspondente no sprite sheet.
 *
 * @param {object} [context={}]
 * @param {string} [context.name]
 * @param {string} [context.spritePath]
 * @returns {string} HTML markup
 */
export function vectorIconTemplate({ name = "", spritePath = "" } = {}) {
  const iconName = name || "";
  const href = iconName ? `${spritePath}#${iconName}` : "";

  return `
        <svg class="icon" focusable="false">
          <use href="${href}" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${href}"></use>
        </svg>
      `;
}

export default vectorIconTemplate;

