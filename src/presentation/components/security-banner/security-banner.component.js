import CustomElement from "@modnes/custom-element";
import { isCanonicalOrigin } from "../../../domain/security/origin-validator.js";
import { securityBannerTemplate } from "./security-banner.template.js";
import {
  DEFAULT_SECURITY_BANNER_ARIA_LABEL,
  DEFAULT_SECURITY_BANNER_DISMISS_LABEL,
  DEFAULT_SECURITY_BANNER_LINK_LABEL,
  DEFAULT_SECURITY_BANNER_MESSAGE,
  DEFAULT_SECURITY_BANNER_OFFICIAL_URL,
  DEFAULT_SECURITY_BANNER_TITLE,
  SECURITY_BANNER_CLASSES,
  SECURITY_BANNER_EVENTS,
} from "./security-banner.constants.js";

/**
 * Web Component <security-banner>
 * Banner ostensivo e acessível (role="alert", aria-live="assertive", WCAG AAA)
 * ativado sob origens não autorizadas para proteger o usuário contra phishing,
 * cópias fraudulentas e desvio de dados (US-08.2 / INV-02 / TASK-08.2.2).
 */
export class SecurityBannerComponent extends CustomElement {
  #titleText = DEFAULT_SECURITY_BANNER_TITLE;
  #messageText = DEFAULT_SECURITY_BANNER_MESSAGE;
  #officialUrl = DEFAULT_SECURITY_BANNER_OFFICIAL_URL;
  #linkLabel = DEFAULT_SECURITY_BANNER_LINK_LABEL;
  #dismissLabel = DEFAULT_SECURITY_BANNER_DISMISS_LABEL;
  #targetOrigin = null;
  #autoCheck = true;
  #originValidator = isCanonicalOrigin;
  #isDismissed = false;
  #isUnauthorized = false;

  static observedAttributes = [
    "title-text",
    "message-text",
    "official-url",
    "link-label",
    "dismiss-label",
    "target-origin",
    "auto-check",
  ];

  constructor() {
    super();

    this.template = () => securityBannerTemplate(this);
  }

  get titleText() {
    return this.#titleText;
  }

  set titleText(value) {
    this.#titleText = value || DEFAULT_SECURITY_BANNER_TITLE;
    if (this.isConnected && !this.hidden) {
      this.render();
    }
  }

  get messageText() {
    return this.#messageText;
  }

  set messageText(value) {
    this.#messageText = value || DEFAULT_SECURITY_BANNER_MESSAGE;
    if (this.isConnected && !this.hidden) {
      this.render();
    }
  }

  get officialUrl() {
    return this.#officialUrl;
  }

  set officialUrl(value) {
    this.#officialUrl = value || DEFAULT_SECURITY_BANNER_OFFICIAL_URL;
    if (this.isConnected && !this.hidden) {
      this.render();
    }
  }

  get linkLabel() {
    return this.#linkLabel;
  }

  set linkLabel(value) {
    this.#linkLabel = value || DEFAULT_SECURITY_BANNER_LINK_LABEL;
    if (this.isConnected && !this.hidden) {
      this.render();
    }
  }

  get dismissLabel() {
    return this.#dismissLabel;
  }

  set dismissLabel(value) {
    this.#dismissLabel = value || DEFAULT_SECURITY_BANNER_DISMISS_LABEL;
    if (this.isConnected && !this.hidden) {
      this.render();
    }
  }

  get targetOrigin() {
    return this.#targetOrigin;
  }

  set targetOrigin(value) {
    this.#targetOrigin = value;
    if (this.isConnected && this.#autoCheck && !this.#isDismissed) {
      this.checkOrigin();
    }
  }

  get autoCheck() {
    return this.#autoCheck;
  }

  set autoCheck(value) {
    this.#autoCheck = String(value) !== "false";
  }

  get originValidator() {
    return this.#originValidator;
  }

  set originValidator(fn) {
    this.#originValidator = typeof fn === "function" ? fn : isCanonicalOrigin;
    if (this.isConnected && this.#autoCheck && !this.#isDismissed) {
      this.checkOrigin();
    }
  }

  get isUnauthorized() {
    return this.#isUnauthorized;
  }

  get isDismissed() {
    return this.#isDismissed;
  }

  connectedCallback() {
    if (!this.classList.contains(SECURITY_BANNER_CLASSES.BLOCK)) {
      this.classList.add(SECURITY_BANNER_CLASSES.BLOCK);
    }

    this.syncAttributes();

    if (this.#autoCheck && !this.#isDismissed) {
      this.checkOrigin();
    }

    super.connectedCallback();
  }

  init() {
    const dismissBtn = this.querySelector(
      `button[data-action="dismiss"], .${SECURITY_BANNER_CLASSES.DISMISS_BTN}`,
    );

    if (dismissBtn) {
      dismissBtn.addEventListener("click", this.handleDismissClick.bind(this));
      dismissBtn.addEventListener(
        "keydown",
        this.handleDismissKeydown.bind(this),
      );
    }
  }

  syncAttributes() {
    if (this.hasAttribute("title-text")) {
      this.#titleText =
        this.getAttribute("title-text") || DEFAULT_SECURITY_BANNER_TITLE;
    }
    if (this.hasAttribute("message-text")) {
      this.#messageText =
        this.getAttribute("message-text") || DEFAULT_SECURITY_BANNER_MESSAGE;
    }
    if (this.hasAttribute("official-url")) {
      this.#officialUrl =
        this.getAttribute("official-url") ||
        DEFAULT_SECURITY_BANNER_OFFICIAL_URL;
    }
    if (this.hasAttribute("link-label")) {
      this.#linkLabel =
        this.getAttribute("link-label") || DEFAULT_SECURITY_BANNER_LINK_LABEL;
    }
    if (this.hasAttribute("dismiss-label")) {
      this.#dismissLabel =
        this.getAttribute("dismiss-label") ||
        DEFAULT_SECURITY_BANNER_DISMISS_LABEL;
    }
    if (this.hasAttribute("target-origin")) {
      this.#targetOrigin = this.getAttribute("target-origin");
    }
    if (this.hasAttribute("auto-check")) {
      this.#autoCheck = this.getAttribute("auto-check") !== "false";
    }
  }

  attributeChangedCallback(attributeName, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    switch (attributeName) {
      case "title-text":
        this.titleText = newValue;
        break;
      case "message-text":
        this.messageText = newValue;
        break;
      case "official-url":
        this.officialUrl = newValue;
        break;
      case "link-label":
        this.linkLabel = newValue;
        break;
      case "dismiss-label":
        this.dismissLabel = newValue;
        break;
      case "target-origin":
        this.targetOrigin = newValue;
        break;
      case "auto-check":
        this.autoCheck = newValue !== "false";
        break;
      default:
        break;
    }
  }

  /**
   * Verifica a legitimidade da origem e atualiza o estado de visibilidade do banner.
   *
   * @param {string} [originToInspect] - Origem a inspecionar. Se omitida, usa targetOrigin ou window.location.
   * @returns {boolean} True se a origem for canônica/autorizada, false se for clone/phishing.
   */
  checkOrigin(originToInspect = this.#targetOrigin) {
    const validator = this.#originValidator || isCanonicalOrigin;
    const isCanonical =
      originToInspect !== null && typeof originToInspect !== "undefined"
        ? validator(originToInspect)
        : validator();

    this.#isUnauthorized = !isCanonical;

    if (this.#isUnauthorized && !this.#isDismissed) {
      this.show();
    } else {
      this.hide();
    }

    const event = new CustomEvent(SECURITY_BANNER_EVENTS.ORIGIN_CHECKED, {
      bubbles: true,
      composed: true,
      detail: {
        origin: originToInspect,
        isCanonical,
        isUnauthorized: this.#isUnauthorized,
      },
    });
    this.dispatchEvent(event);

    return isCanonical;
  }

  /**
   * Exibe ostensivamente o banner de perigo com semântica acessível.
   */
  show() {
    this.removeAttribute("hidden");
    this.classList.remove(SECURITY_BANNER_CLASSES.MODIFIER_HIDDEN);
    this.classList.add(SECURITY_BANNER_CLASSES.MODIFIER_VISIBLE);

    this.setAttribute("role", "alert");
    this.setAttribute("aria-live", "assertive");
    this.setAttribute("aria-atomic", "true");
    this.setAttribute("aria-label", DEFAULT_SECURITY_BANNER_ARIA_LABEL);

    this.render();
  }

  /**
   * Oculta o banner de forma acessível.
   */
  hide() {
    this.setAttribute("hidden", "");
    this.classList.add(SECURITY_BANNER_CLASSES.MODIFIER_HIDDEN);
    this.classList.remove(SECURITY_BANNER_CLASSES.MODIFIER_VISIBLE);
  }

  /**
   * Descarta o banner por ação explícita do usuário.
   */
  dismiss() {
    this.#isDismissed = true;
    this.hide();

    const event = new CustomEvent(SECURITY_BANNER_EVENTS.DISMISS, {
      bubbles: true,
      composed: true,
      detail: {
        source: "security-banner",
        targetOrigin: this.#targetOrigin,
      },
    });
    this.dispatchEvent(event);
    return event;
  }

  handleDismissClick(event) {
    event?.preventDefault();
    this.dismiss();
  }

  handleDismissKeydown(event) {
    if (event?.key === "Enter" || event?.key === " ") {
      event.preventDefault();
      this.dismiss();
    }
  }
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("security-banner")
) {
  customElements.define("security-banner", SecurityBannerComponent);
}

export const PixSecurityBannerComponent = SecurityBannerComponent;
export default SecurityBannerComponent;
