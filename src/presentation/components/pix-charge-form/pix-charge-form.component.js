/**
 * Web Component <pix-charge-form> (Esqueleto TDD)
 * Apresenta o formulário de valor opcional (Passo 2) e o botão destacado "Manda um PIX" (Passo 3).
 */

import CustomElement from "@modnes/custom-element";
import {
  CHARGE_FORM_INJECTABLES,
  DEFAULT_CHARGE_FORM_CTA_LABEL,
  DEFAULT_CHARGE_FORM_STEP,
  DEFAULT_CHARGE_FORM_TITLE,
} from "./pix-charge-form.constants.js";

export class PixChargeFormComponent extends CustomElement {
  static observedAttributes = [
    "amount",
    "selected-key-id",
    "step-text",
    "title-text",
    "cta-text",
  ];

  constructor() {
    super();

    this.addInjectable(
      CHARGE_FORM_INJECTABLES.GENERATE_PIX_CHARGE_USE_CASE,
      "generatePixChargeUseCase",
    );
    this.addInjectable(
      CHARGE_FORM_INJECTABLES.PIX_KEY_REPOSITORY,
      "pixKeyRepository",
    );

    this.template = () => "";
  }

  get stepText() {
    return DEFAULT_CHARGE_FORM_STEP;
  }

  get titleText() {
    return DEFAULT_CHARGE_FORM_TITLE;
  }

  get ctaText() {
    return DEFAULT_CHARGE_FORM_CTA_LABEL;
  }
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("pix-charge-form")
) {
  customElements.define("pix-charge-form", PixChargeFormComponent);
}

export default PixChargeFormComponent;
