import CustomElement from "@modnes/custom-element";
import {
  CHARGE_RESULT_CLASSES,
  DEFAULT_CHARGE_RESULT_ARIA_LABEL,
} from "./pix-charge-result.constants.js";

/**
 * Web Component <pix-charge-result>
 * Palco de exibição do QR Code de alto contraste e do código PIX Copia e Cola.
 *
 * Implementação inicial (TDD Stub para TASK-06.2.3).
 */
export class PixChargeResultComponent extends CustomElement {
  #charge = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.classList.add(CHARGE_RESULT_CLASSES.ROOT, CHARGE_RESULT_CLASSES.CARD);
    this.setAttribute("aria-label", DEFAULT_CHARGE_RESULT_ARIA_LABEL);
  }

  get charge() {
    return this.#charge;
  }

  set charge(value) {
    this.#charge = value;
  }

  setCharge(charge) {
    this.#charge = charge;
  }

  clearCharge() {
    this.#charge = null;
  }
}

if (!customElements.get("pix-charge-result")) {
  customElements.define("pix-charge-result", PixChargeResultComponent);
}

export default PixChargeResultComponent;

