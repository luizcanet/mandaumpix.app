import CustomElement from "@modnes/custom-element";
import { pixKeyEmptyTemplate } from "./pix-key-empty.template.js";
import {
  DEFAULT_EMPTY_STATE_ARIA_LABEL,
  DEFAULT_EMPTY_STATE_CTA,
  DEFAULT_EMPTY_STATE_DESCRIPTION,
  DEFAULT_EMPTY_STATE_TITLE,
  KEY_EMPTY_EVENT_NAMES,
} from "./pix-key-empty.constants.js";

/**
 * Web Component <pix-key-empty>
 * Apresenta a interface de estado vazio acolhedora quando o usuário ainda não
 * possui chaves PIX cadastradas no dispositivo, instruindo sobre armazenamento
 * 100% local e oferecendo ação primária (CTA) para adicionar a primeira chave.
 */
export class PixKeyEmptyComponent extends CustomElement {
  #titleText = DEFAULT_EMPTY_STATE_TITLE;
  #descriptionText = DEFAULT_EMPTY_STATE_DESCRIPTION;
  #ctaText = DEFAULT_EMPTY_STATE_CTA;

  static observedAttributes = ["title-text", "description-text", "cta-text"];

  constructor() {
    super();

    this.template = () => pixKeyEmptyTemplate(this);
  }

  get titleText() {
    return this.#titleText;
  }

  set titleText(value) {
    this.#titleText = value || DEFAULT_EMPTY_STATE_TITLE;
    if (this.isConnected) {
      this.render();
    }
  }

  get descriptionText() {
    return this.#descriptionText;
  }

  set descriptionText(value) {
    this.#descriptionText = value || DEFAULT_EMPTY_STATE_DESCRIPTION;
    if (this.isConnected) {
      this.render();
    }
  }

  get ctaText() {
    return this.#ctaText;
  }

  set ctaText(value) {
    this.#ctaText = value || DEFAULT_EMPTY_STATE_CTA;
    if (this.isConnected) {
      this.render();
    }
  }

  connectedCallback() {
    if (!this.classList.contains("key-empty-state")) {
      this.classList.add("key-empty-state");
    }
    if (!this.classList.contains("card")) {
      this.classList.add("card");
    }
    if (!this.hasAttribute("aria-label")) {
      this.setAttribute("aria-label", DEFAULT_EMPTY_STATE_ARIA_LABEL);
    }
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "region");
    }

    this.syncAttributes();
    super.connectedCallback();
  }

  init() {
    const ctaBtn = this.querySelector('button[data-action="open-key-dialog"]');
    if (ctaBtn) {
      ctaBtn.addEventListener("click", this.handleCtaClick.bind(this));
      ctaBtn.addEventListener("keydown", this.handleCtaKeydown.bind(this));
    }
  }

  syncAttributes() {
    if (this.hasAttribute("title-text")) {
      this.#titleText =
        this.getAttribute("title-text") || DEFAULT_EMPTY_STATE_TITLE;
    }
    if (this.hasAttribute("description-text")) {
      this.#descriptionText =
        this.getAttribute("description-text") ||
        DEFAULT_EMPTY_STATE_DESCRIPTION;
    }
    if (this.hasAttribute("cta-text")) {
      this.#ctaText = this.getAttribute("cta-text") || DEFAULT_EMPTY_STATE_CTA;
    }
  }

  attributeChangedCallback(attributeName, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    switch (attributeName) {
      case "title-text":
        this.titleText = newValue || DEFAULT_EMPTY_STATE_TITLE;
        break;
      case "description-text":
        this.descriptionText = newValue || DEFAULT_EMPTY_STATE_DESCRIPTION;
        break;
      case "cta-text":
        this.ctaText = newValue || DEFAULT_EMPTY_STATE_CTA;
        break;
      default:
        break;
    }
  }

  handleCtaClick(event) {
    event?.preventDefault();
    this.openKeyDialog();
  }

  handleCtaKeydown(event) {
    if (event?.key === "Enter" || event?.key === " ") {
      event.preventDefault();
      this.openKeyDialog();
    }
  }

  openKeyDialog() {
    const event = new CustomEvent(KEY_EMPTY_EVENT_NAMES.OPEN_KEY_DIALOG, {
      bubbles: true,
      composed: true,
      detail: { source: "pix-key-empty" },
    });
    this.dispatchEvent(event);
    return event;
  }
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("pix-key-empty")
) {
  customElements.define("pix-key-empty", PixKeyEmptyComponent);
}

export default PixKeyEmptyComponent;
