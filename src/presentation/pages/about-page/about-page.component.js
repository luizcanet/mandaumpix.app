import CustomElement from "@modnes/custom-element";
import Router from "@modnes/router";
import encodeQR from "qr";
import {
  ABOUT_AUTHOR,
  ABOUT_NAVIGATION,
  ABOUT_PROJECT,
  ABOUT_SHARE,
  ABOUT_SUPPORT_PIX,
} from "./about-page.constants.js";

/**
 * Gera o SVG vetorial de alto contraste para o QR Code de apoio voluntário.
 *
 * @returns {string} - Marcação SVG acessível
 */
export function generateSupportQrSvg() {
  try {
    const rawSvg = encodeQR(ABOUT_SUPPORT_PIX.brCode, "svg");
    return rawSvg.replace(
      "<svg ",
      `<svg class="charge-result__qr-svg about-page__qr-svg" role="img" aria-label="${ABOUT_SUPPORT_PIX.qrAriaLabel}" `,
    );
  } catch {
    return `<svg class="charge-result__qr-svg about-page__qr-svg" role="img" aria-label="${ABOUT_SUPPORT_PIX.qrAriaLabel}" viewBox="0 0 100 100"><rect width="100" height="100" fill="#ffffff"/></svg>`;
  }
}

/**
 * Web Component <about-page> que apresenta as informações institucionais do aplicativo,
 * autor, licença livre AGPLv3, apoio voluntário via PIX e incentivo à divulgação.
 */
export class AboutPageComponent extends CustomElement {
  logoSrc = ABOUT_NAVIGATION.logoSrc;
  titleText = ABOUT_NAVIGATION.title;
  homeHref = ABOUT_NAVIGATION.homeHref;
  versionText = ABOUT_PROJECT.versionLabel;
  isCopied = false;

  #appRouter = null;
  #distributePixChargeUseCase = null;
  #copyTimeoutId = null;

  static observedAttributes = [
    "logo-src",
    "title-text",
    "home-href",
    "version-text",
  ];

  constructor() {
    super();

    this.addInjectable("app-router", "appRouter");
    this.addInjectable(
      "distribute-pix-charge-use-case",
      "distributePixChargeUseCase",
    );

    this.template = () => `
      <div class="section-header about-page__header">
        <div class="section-header__title-group about-page__title-group">
          <img
            class="about-page__logo"
            src="${this.logoSrc}"
            alt="Logotipo do Manda um PIX"
            width="32"
            height="32"
          />
          <div>
            <h2 class="section-header__title about-page__title">${this.titleText}</h2>
            <span class="about-page__version">${this.versionText}</span>
          </div>
        </div>
        <button
          type="button"
          class="amount-field__preset about-page__home-btn"
          data-action="navigate-home"
          aria-label="Voltar para a página inicial"
        >
          <vector-icon name="home"></vector-icon>
          <span>${ABOUT_NAVIGATION.homeButtonText}</span>
        </button>
      </div>

      <p class="about-page__summary">
        <strong>Manda um PIX</strong> é um aplicativo web progressivo (PWA)
        <strong>gratuito, livre e de código aberto</strong> que facilita a geração de
        cobranças via PIX sem a necessidade de ficar abrindo aplicativos de banco, com
        execução e armazenamento 100% locais no navegador.
      </p>

      <!-- CARD 1: SOBRE O AUTOR -->
      <div class="about-page__box about-page__box--author">
        <div class="about-page__box-label">${ABOUT_AUTHOR.label}</div>
        <div class="about-page__author-name">${ABOUT_AUTHOR.name}</div>
        <div class="about-page__author-links">
          <a
            href="${ABOUT_AUTHOR.emailUrl}"
            class="about-page__link"
            aria-label="E-mail do autor: ${ABOUT_AUTHOR.email}"
          >${ABOUT_AUTHOR.email}</a>
          <span class="about-page__separator" aria-hidden="true">•</span>
          <a
            href="${ABOUT_AUTHOR.githubUrl}"
            class="about-page__link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub do autor: @${ABOUT_AUTHOR.githubUser}"
          >github.com/${ABOUT_AUTHOR.githubUser}</a>
        </div>
      </div>

      <!-- CARD 2: SOBRE O PROJETO & LICENÇA -->
      <div class="about-page__box about-page__box--project">
        <div class="about-page__box-label">${ABOUT_PROJECT.label}</div>
        <p class="about-page__license-text">
          Distribuído sob a licença <strong>${ABOUT_PROJECT.licenseFull}</strong>.
        </p>
        <div class="about-page__repo-link-wrapper">
          <a
            href="${ABOUT_PROJECT.repositoryUrl}"
            class="about-page__link about-page__link--repo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Repositório do projeto no GitHub"
          >
            ${ABOUT_PROJECT.repositoryUrl}
          </a>
        </div>
      </div>

      <!-- CARD 3: APOIO VOLUNTÁRIO ("MANDA UM PIX") -->
      <div class="about-page__box about-page__box--support">
        <div class="about-page__support-title">${ABOUT_SUPPORT_PIX.title}</div>
        <p class="about-page__support-message">${ABOUT_SUPPORT_PIX.message}</p>

        <div class="charge-result__qr-stage about-page__qr-stage">
          <div class="charge-result__qr-frame">
            ${generateSupportQrSvg()}
          </div>
          <p class="charge-result__meta about-page__meta">
            Chave PIX (Valor Dinâmico): <strong>${ABOUT_SUPPORT_PIX.key}</strong>
          </p>
        </div>

        <div class="about-page__brcode-section">
          <div class="charge-result__brcode-label about-page__brcode-label">
            <span>Chave Copia e Cola (${ABOUT_SUPPORT_PIX.key})</span>
            <span class="about-page__dynamic-badge">Valor Dinâmico</span>
          </div>
          <div class="charge-result__brcode about-page__brcode" id="about-support-brcode">
            ${ABOUT_SUPPORT_PIX.brCode}
          </div>
        </div>

        <button
          type="button"
          class="charge-result__btn charge-result__btn--copy about-page__copy-btn"
          data-action="copy-support-brcode"
          aria-label="Copiar Chave Copia e Cola"
        >
          <vector-icon name="${this.isCopied ? "check" : "copy"}"></vector-icon>
          <span class="about-page__copy-btn-text">
            ${this.isCopied ? ABOUT_SUPPORT_PIX.copiedButtonText : ABOUT_SUPPORT_PIX.copyButtonText}
          </span>
        </button>
        <div class="about-page__live-region" aria-live="polite" id="about-copy-feedback">
          ${this.isCopied ? "Chave copiada com sucesso!" : ""}
        </div>
      </div>

      <!-- CARD 4: INCENTIVO À DIVULGAÇÃO -->
      <div class="about-page__box about-page__box--share">
        <div class="about-page__share-title">${ABOUT_SHARE.title}</div>
        <p class="about-page__share-message">${ABOUT_SHARE.message}</p>
        <button
          type="button"
          class="charge-result__btn charge-result__btn--share about-page__share-btn"
          data-action="share-app"
          aria-label="Compartilhar e Divulgar o Aplicativo"
        >
          <vector-icon name="share"></vector-icon>
          <span>${ABOUT_SHARE.buttonText}</span>
        </button>
      </div>
    `;
  }

  get appRouter() {
    return this.#appRouter;
  }

  set appRouter(router) {
    this.#appRouter = router || null;
  }

  get distributePixChargeUseCase() {
    return this.#distributePixChargeUseCase;
  }

  set distributePixChargeUseCase(useCase) {
    this.#distributePixChargeUseCase = useCase || null;
  }

  connectedCallback() {
    if (!this.classList.contains("about-page")) {
      this.classList.add("about-page");
    }
    if (!this.classList.contains("card")) {
      this.classList.add("card");
    }
    if (!this.hasAttribute("aria-label")) {
      this.setAttribute("aria-label", "Sobre o aplicativo");
    }

    this.syncAttributes();
    super.connectedCallback();
  }

  disconnectedCallback() {
    if (this.#copyTimeoutId) {
      clearTimeout(this.#copyTimeoutId);
      this.#copyTimeoutId = null;
    }
  }

  init() {
    const homeBtn = this.querySelector('[data-action="navigate-home"]');
    homeBtn?.addEventListener("click", this.handleHomeClick.bind(this));

    const copyBtn = this.querySelector('[data-action="copy-support-brcode"]');
    copyBtn?.addEventListener("click", this.handleCopyClick.bind(this));

    const shareBtn = this.querySelector('[data-action="share-app"]');
    shareBtn?.addEventListener("click", this.handleShareClick.bind(this));
  }

  syncAttributes() {
    if (this.hasAttribute("logo-src")) {
      this.logoSrc = this.getAttribute("logo-src") || ABOUT_NAVIGATION.logoSrc;
    }
    if (this.hasAttribute("title-text")) {
      this.titleText =
        this.getAttribute("title-text") || ABOUT_NAVIGATION.title;
    }
    if (this.hasAttribute("home-href")) {
      this.homeHref =
        this.getAttribute("home-href") || ABOUT_NAVIGATION.homeHref;
    }
    if (this.hasAttribute("version-text")) {
      this.versionText =
        this.getAttribute("version-text") || ABOUT_PROJECT.versionLabel;
    }
  }

  attributeChangedCallback(attributeName, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    switch (attributeName) {
      case "logo-src":
        this.logoSrc = newValue || ABOUT_NAVIGATION.logoSrc;
        break;
      case "title-text":
        this.titleText = newValue || ABOUT_NAVIGATION.title;
        break;
      case "home-href":
        this.homeHref = newValue || ABOUT_NAVIGATION.homeHref;
        break;
      case "version-text":
        this.versionText = newValue || ABOUT_PROJECT.versionLabel;
        break;
      default:
        break;
    }

    if (this.isConnected) {
      this.render();
    }
  }

  handleHomeClick(event) {
    event?.preventDefault();

    if (this.#appRouter && typeof this.#appRouter.goTo === "function") {
      this.#appRouter.goTo(this.homeHref);
    } else if (typeof Router.goTo === "function") {
      Router.goTo(this.homeHref);
    } else if (typeof window !== "undefined" && window.location) {
      window.location.href = this.homeHref;
    }

    this.dispatchEvent(
      new CustomEvent("navigate-home", {
        detail: { path: this.homeHref },
        bubbles: true,
        composed: true,
      }),
    );
  }

  async handleCopyClick(event) {
    event?.preventDefault();

    const brCode = ABOUT_SUPPORT_PIX.brCode;

    try {
      if (
        this.#distributePixChargeUseCase &&
        typeof this.#distributePixChargeUseCase.copyChargeCode === "function"
      ) {
        await this.#distributePixChargeUseCase.copyChargeCode(brCode);
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(brCode);
      }

      this.isCopied = true;
      this.updateCopyUi(true);

      if (this.#copyTimeoutId) {
        clearTimeout(this.#copyTimeoutId);
      }
      this.#copyTimeoutId = setTimeout(() => {
        this.isCopied = false;
        this.updateCopyUi(false);
        this.#copyTimeoutId = null;
      }, 2500);

      this.dispatchEvent(
        new CustomEvent("support-brcode-copied", {
          detail: { brCode },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      this.dispatchEvent(
        new CustomEvent("support-brcode-copy-error", {
          detail: error,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  updateCopyUi(isCopied) {
    const copyBtn = this.querySelector('[data-action="copy-support-brcode"]');
    const icon = copyBtn?.querySelector("vector-icon");
    const label = copyBtn?.querySelector(".about-page__copy-btn-text");
    const feedback = this.querySelector("#about-copy-feedback");

    if (icon) {
      icon.setAttribute("name", isCopied ? "check" : "copy");
    }
    if (label) {
      label.textContent = isCopied
        ? ABOUT_SUPPORT_PIX.copiedButtonText
        : ABOUT_SUPPORT_PIX.copyButtonText;
    }
    if (feedback) {
      feedback.textContent = isCopied ? "Chave copiada com sucesso!" : "";
    }
  }

  async handleShareClick(event) {
    event?.preventDefault();

    const shareData = {
      title: ABOUT_SHARE.shareTitle,
      text: ABOUT_SHARE.shareText,
      url: ABOUT_SHARE.shareUrl,
    };

    let channel = "WEB_SHARE";

    try {
      if (
        this.#distributePixChargeUseCase &&
        typeof this.#distributePixChargeUseCase.shareCharge === "function"
      ) {
        const result = await this.#distributePixChargeUseCase.shareCharge({
          cobranca: { chave_cobranca: ABOUT_SUPPORT_PIX.brCode },
          title: shareData.title,
          text: `${shareData.text} ${shareData.url}`,
        });
        channel = result?.channel || "WEB_SHARE";
      } else if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
      } else {
        channel = "WHATSAPP";
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
          `${shareData.text} ${shareData.url}`,
        )}`;
        if (typeof window !== "undefined" && window.open) {
          window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        }
      }

      this.dispatchEvent(
        new CustomEvent("app-shared", {
          detail: { channel, ...shareData },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      this.dispatchEvent(
        new CustomEvent("app-share-error", {
          detail: error,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}

if (!customElements.get("about-page")) {
  customElements.define("about-page", AboutPageComponent);
}

export default AboutPageComponent;

