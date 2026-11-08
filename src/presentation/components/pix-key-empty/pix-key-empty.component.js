import CustomElement from "@modnes/custom-element";
import {
  DEFAULT_EMPTY_STATE_CTA,
  DEFAULT_EMPTY_STATE_DESCRIPTION,
  DEFAULT_EMPTY_STATE_TITLE,
} from "./pix-key-empty.constants.js";

/**
 * Web Component <pix-key-empty>
 * Apresenta o estado vazio quando o usuário não possui chaves PIX cadastradas.
 */
export class PixKeyEmptyComponent extends CustomElement {
  titleText = DEFAULT_EMPTY_STATE_TITLE;
  descriptionText = DEFAULT_EMPTY_STATE_DESCRIPTION;
  ctaText = DEFAULT_EMPTY_STATE_CTA;

  static observedAttributes = ["title-text", "description-text", "cta-text"];

  constructor() {
    super();
    this.template = () => "";
  }
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("pix-key-empty")
) {
  customElements.define("pix-key-empty", PixKeyEmptyComponent);
}

export default PixKeyEmptyComponent;
