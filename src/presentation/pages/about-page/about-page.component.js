import CustomElement from "@modnes/custom-element";
import Router from "@modnes/router";
import {
  aboutPageTemplate,
  generateSupportQrSvg,
} from "./about-page.template.js";
import {
  ABOUT_NAVIGATION,
  ABOUT_PROJECT,
  ABOUT_SECURITY,
  ABOUT_SHARE,
  ABOUT_SUPPORT_PIX,
} from "./about-page.constants.js";

export { generateSupportQrSvg };

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

    this.template = () => aboutPageTemplate(this);
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

    const reportBtn = this.querySelector('[data-action="report-fraud"]');
    reportBtn?.addEventListener(
      "click",
      this.handleReportFraudClick.bind(this),
    );
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

  handleReportFraudClick() {
    this.dispatchEvent(
      new CustomEvent("fraud-report-clicked", {
        detail: {
          mailtoUrl: ABOUT_SECURITY.reportMailtoUrl,
          subject: ABOUT_SECURITY.reportSubject,
        },
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
      feedback.textContent = isCopied
        ? ABOUT_SUPPORT_PIX.copiedFeedbackMessage
        : "";
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
          chave_cobranca: ABOUT_SUPPORT_PIX.brCode,
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
