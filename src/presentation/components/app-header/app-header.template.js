/**
 * Template especializado para o componente <app-header>.
 * Renderiza a barra de topo da aplicação contendo identidade visual, títulos e ações de navegação/instalação.
 *
 * @param {object} [context={}]
 * @param {string} [context.logoSrc]
 * @param {string} [context.titleText]
 * @param {string} [context.subtitleText]
 * @param {boolean} [context.showInstallButton]
 * @param {string} [context.aboutHref]
 * @returns {string} HTML markup
 */
export function appHeaderTemplate({
  logoSrc = "",
  titleText = "",
  subtitleText = "",
  showInstallButton = false,
  aboutHref = "",
} = {}) {
  return `
      <div class="app-header__brand" role="button" tabindex="0">
        <img
          class="app-header__logo"
          src="${logoSrc}"
          alt="Logotipo do Manda um PIX"
          width="42"
          height="42"
        />
        <div>
          <span class="app-header__title">${titleText}</span>
          <span class="app-header__subtitle">${subtitleText}</span>
        </div>
      </div>
      <div class="app-header__actions">
        <button
          type="button"
          class="app-header__install-btn ${showInstallButton ? "" : "hidden"}"
          ${showInstallButton ? "" : "hidden"}
          aria-label="Instalar aplicativo"
        >
          <vector-icon name="download"></vector-icon>
          <span>Instalar</span>
        </button>
        <a
          href="${aboutHref}"
          class="app-header__about-link"
          aria-label="Sobre o aplicativo"
        >
          <vector-icon name="circle-info"></vector-icon>
          <span>Sobre</span>
        </a>
      </div>
    `;
}

export default appHeaderTemplate;

