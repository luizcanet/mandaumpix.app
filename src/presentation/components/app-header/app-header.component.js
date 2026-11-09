import CustomElement from "@modnes/custom-element";
import { InstallPwaUseCase } from "../../../application/use-cases/install-pwa.use-case.js";

export const DEFAULT_LOGO_SRC = "./src/assets/icons/icon.svg";
export const DEFAULT_TITLE = "Manda um PIX";
export const DEFAULT_SUBTITLE = "Cobrança rápida via PIX";
export const DEFAULT_ABOUT_HREF = "/sobre";

export class AppHeaderComponent extends CustomElement {
  logoSrc = DEFAULT_LOGO_SRC;
  titleText = DEFAULT_TITLE;
  subtitleText = DEFAULT_SUBTITLE;
  aboutHref = DEFAULT_ABOUT_HREF;
  showInstallButton = false;

  #installPwaUseCase = null;
  #pwaInstallGateway = null;
  #installSubscription = null;
  #isHandlingInstall = false;

  static observedAttributes = [
    "logo-src",
    "title-text",
    "subtitle-text",
    "about-href",
    "show-install-button",
  ];

  constructor() {
    super();

    this.addInjectable("install-pwa-use-case", "installPwaUseCase");
    this.addInjectable("pwa-install-gateway", "pwaInstallGateway");

    this.template = () => `
      <div class="app-header__brand" role="button" tabindex="0">
        <img
          class="app-header__logo"
          src="${this.logoSrc}"
          alt="Logotipo do Manda um PIX"
          width="42"
          height="42"
        />
        <div>
          <span class="app-header__title">${this.titleText}</span>
          <span class="app-header__subtitle">${this.subtitleText}</span>
        </div>
      </div>
      <div class="app-header__actions">
        <button
          type="button"
          class="app-header__install-btn ${this.showInstallButton ? "" : "hidden"}"
          ${this.showInstallButton ? "" : "hidden"}
          aria-label="Instalar aplicativo"
        >
          <vector-icon name="download"></vector-icon>
          <span>Instalar</span>
        </button>
        <a
          href="${this.aboutHref}"
          class="app-header__about-link"
          aria-label="Sobre o aplicativo"
        >
          <vector-icon name="circle-info"></vector-icon>
          <span>Sobre</span>
        </a>
      </div>
    `;
  }

  get installPwaUseCase() {
    return this.#installPwaUseCase;
  }

  set installPwaUseCase(useCase) {
    this.#installPwaUseCase = useCase || null;
    if (this.isConnected && this.#installPwaUseCase) {
      this.setupInstallIntegration();
    }
  }

  get pwaInstallGateway() {
    return this.#pwaInstallGateway;
  }

  set pwaInstallGateway(gateway) {
    this.#pwaInstallGateway = gateway || null;
    if (!this.#installPwaUseCase && this.#pwaInstallGateway) {
      this.installPwaUseCase = new InstallPwaUseCase({
        pwaInstallGateway: this.#pwaInstallGateway,
      });
    }
  }

  connectedCallback() {
    if (!this.classList.contains("app-header")) {
      this.classList.add("app-header");
    }

    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "banner");
    }

    this.syncAttributes();
    super.connectedCallback();

    if (!this.#installPwaUseCase && this.#pwaInstallGateway) {
      this.installPwaUseCase = new InstallPwaUseCase({
        pwaInstallGateway: this.#pwaInstallGateway,
      });
    }

    if (this.#installPwaUseCase) {
      this.setupInstallIntegration();
    }
  }

  disconnectedCallback() {
    this.teardownInstallIntegration();
  }

  init() {
    const installBtn = this.querySelector(".app-header__install-btn");
    installBtn?.addEventListener("click", this.handleInstallClick.bind(this));
  }

  setupInstallIntegration() {
    this.teardownInstallIntegration();

    if (!this.#installPwaUseCase) {
      return;
    }

    if (typeof this.#installPwaUseCase.subscribe === "function") {
      this.#installSubscription = this.#installPwaUseCase.subscribe(
        (state = {}) => {
          if (state.shouldShowInstallButton) {
            this.showInstall();
          } else {
            this.hideInstall();
          }
        },
      );
    }

    if (typeof this.#installPwaUseCase.getInstallState === "function") {
      Promise.resolve(this.#installPwaUseCase.getInstallState())
        .then((state) => {
          if (state?.shouldShowInstallButton) {
            this.showInstall();
          } else {
            this.hideInstall();
          }
        })
        .catch(() => {
          // Degrada graciosamente em caso de erro ao obter estado
        });
    }
  }

  teardownInstallIntegration() {
    if (typeof this.#installSubscription === "function") {
      this.#installSubscription();
      this.#installSubscription = null;
    }
  }

  async handleInstallClick(event) {
    event?.preventDefault();

    if (!this.#installPwaUseCase || this.#isHandlingInstall) {
      return;
    }

    this.#isHandlingInstall = true;
    try {
      const outcome = await this.#installPwaUseCase.triggerInstall();
      if (outcome?.accepted || outcome?.isInstalled) {
        this.hideInstall();
      }
      this.dispatchEvent(
        new CustomEvent("pwa-install-outcome", {
          detail: outcome,
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      this.dispatchEvent(
        new CustomEvent("pwa-install-error", {
          detail: error,
          bubbles: true,
          composed: true,
        }),
      );
    } finally {
      this.#isHandlingInstall = false;
    }
  }

  syncAttributes() {
    if (this.hasAttribute("logo-src")) {
      this.logoSrc = this.getAttribute("logo-src") || DEFAULT_LOGO_SRC;
    }
    if (this.hasAttribute("title-text")) {
      this.titleText = this.getAttribute("title-text") || DEFAULT_TITLE;
    }
    if (this.hasAttribute("subtitle-text")) {
      this.subtitleText =
        this.getAttribute("subtitle-text") || DEFAULT_SUBTITLE;
    }
    if (this.hasAttribute("about-href")) {
      this.aboutHref = this.getAttribute("about-href") || DEFAULT_ABOUT_HREF;
    }
    if (this.hasAttribute("show-install-button")) {
      const val = this.getAttribute("show-install-button");
      this.showInstallButton = val !== null && val !== "false";
    }
  }

  attributeChangedCallback(attributeName, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    switch (attributeName) {
      case "logo-src":
        this.logoSrc = newValue || DEFAULT_LOGO_SRC;
        break;
      case "title-text":
        this.titleText = newValue || DEFAULT_TITLE;
        break;
      case "subtitle-text":
        this.subtitleText = newValue || DEFAULT_SUBTITLE;
        break;
      case "about-href":
        this.aboutHref = newValue || DEFAULT_ABOUT_HREF;
        break;
      case "show-install-button":
        this.showInstallButton = newValue !== null && newValue !== "false";
        break;
      default:
        break;
    }

    if (this.isConnected) {
      this.render();
    }
  }

  showInstall() {
    this.showInstallButton = true;
    const btn = this.querySelector(".app-header__install-btn");
    if (btn) {
      btn.classList.remove("hidden");
      btn.removeAttribute("hidden");
    } else if (this.isConnected) {
      this.render();
    }
  }

  hideInstall() {
    this.showInstallButton = false;
    const btn = this.querySelector(".app-header__install-btn");
    if (btn) {
      btn.classList.add("hidden");
      btn.setAttribute("hidden", "");
    } else if (this.isConnected) {
      this.render();
    }
  }
}

if (!customElements.get("app-header")) {
  customElements.define("app-header", AppHeaderComponent);
}

export default AppHeaderComponent;
