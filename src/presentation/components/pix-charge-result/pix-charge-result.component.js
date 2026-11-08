import CustomElement from "@modnes/custom-element";
import {
  CHARGE_RESULT_CLASSES,
  CHARGE_RESULT_EVENT_NAMES,
  CHARGE_RESULT_ICONS,
  DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK,
  DEFAULT_CHARGE_RESULT_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BRCODE_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BRCODE_TITLE,
  DEFAULT_CHARGE_RESULT_MODE_FIXED,
  DEFAULT_CHARGE_RESULT_MODE_OPEN,
  DEFAULT_CHARGE_RESULT_QR_ALT,
  DEFAULT_CHARGE_RESULT_READY_BADGE,
  DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION,
  DEFAULT_CHARGE_RESULT_WAITING_TITLE,
  formatAccountSummary,
  formatChargeAmountBadge,
  formatKeyMetadata,
} from "./pix-charge-result.constants.js";

/**
 * Escapa caracteres HTML para mitigar riscos de injeção de script (XSS).
 *
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Resolve o conteúdo gráfico do QR Code a partir de SVG ou dataUrl.
 *
 * @param {object|string|null|undefined} imagemQrcode Objeto ou string representando o QR Code
 * @returns {string} Markup HTML/SVG para inserção segura no palco
 */
function resolveQrContent(imagemQrcode) {
  if (!imagemQrcode) {
    return "";
  }

  if (typeof imagemQrcode === "string") {
    const trimmed = imagemQrcode.trim();
    if (trimmed.startsWith("<svg") || trimmed.includes("<svg")) {
      return trimmed;
    }
    return `<img src="${escapeHtml(trimmed)}" alt="${escapeHtml(DEFAULT_CHARGE_RESULT_QR_ALT)}" />`;
  }

  if (typeof imagemQrcode === "object") {
    if (imagemQrcode.svg && typeof imagemQrcode.svg === "string") {
      return imagemQrcode.svg.trim();
    }
    if (imagemQrcode.dataUrl && typeof imagemQrcode.dataUrl === "string") {
      return `<img src="${escapeHtml(imagemQrcode.dataUrl)}" alt="${escapeHtml(DEFAULT_CHARGE_RESULT_QR_ALT)}" />`;
    }
  }

  return "";
}

/**
 * Web Component <pix-charge-result>
 * Palco de exibição de alto contraste do QR Code e código PIX Copia e Cola.
 *
 * Alinhado às regras de negócio RN03, RN04, W3C ARIA, Clean Architecture e BEM.
 */
export class PixChargeResultComponent extends CustomElement {
  #charge = null;
  #liveMessage = "";
  #liveRegionElement = null;
  #windowListener = null;

  constructor() {
    super();

    this.#liveRegionElement = document.createElement("div");
    this.#liveRegionElement.className = CHARGE_RESULT_CLASSES.LIVE_REGION;
    this.#liveRegionElement.setAttribute("aria-live", "polite");
    this.#liveRegionElement.setAttribute("aria-atomic", "true");

    this.template = () => {
      if (!this.#charge) {
        return `
          <div class="${CHARGE_RESULT_CLASSES.WAITING}">
            <vector-icon
              class="${CHARGE_RESULT_CLASSES.WAITING_ICON}"
              name="${CHARGE_RESULT_ICONS.QRCODE}"
            ></vector-icon>
            <h3 class="${CHARGE_RESULT_CLASSES.WAITING_TITLE}">
              ${escapeHtml(DEFAULT_CHARGE_RESULT_WAITING_TITLE)}
            </h3>
            <p class="${CHARGE_RESULT_CLASSES.WAITING_DESC}">
              ${escapeHtml(DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION)}
            </p>
          </div>
        `;
      }

      const accountText = formatAccountSummary(this.#charge.chave_conta);
      const badgeInfo = formatChargeAmountBadge(
        this.#charge.valor_opcional,
        this.#charge.valor_dinamico,
      );
      const modeText = this.#charge.valor_dinamico
        ? DEFAULT_CHARGE_RESULT_MODE_OPEN
        : DEFAULT_CHARGE_RESULT_MODE_FIXED;
      const metaText = formatKeyMetadata(this.#charge.chave_conta);
      const brCode = this.#charge.chave_cobranca || "";
      const qrContent = resolveQrContent(this.#charge.imagem_qrcode);

      return `
        <div class="${CHARGE_RESULT_CLASSES.HEADER}">
          <div class="${CHARGE_RESULT_CLASSES.HEADER_INFO}">
            <span class="${CHARGE_RESULT_CLASSES.BADGE_READY}">
              <vector-icon name="${CHARGE_RESULT_ICONS.CHECK}"></vector-icon>
              ${DEFAULT_CHARGE_RESULT_READY_BADGE}
            </span>
            <h3 class="${CHARGE_RESULT_CLASSES.ACCOUNT}">
              ${escapeHtml(accountText || DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK)}
            </h3>
          </div>
          <span class="${badgeInfo.className}">
            ${escapeHtml(badgeInfo.text)}
          </span>
        </div>

        <div class="${CHARGE_RESULT_CLASSES.QR_STAGE}">
          <div class="${CHARGE_RESULT_CLASSES.QR_FRAME}">
            <div class="${CHARGE_RESULT_CLASSES.QR_SVG}">
              ${qrContent}
            </div>
          </div>
          <p class="${CHARGE_RESULT_CLASSES.META}">${escapeHtml(metaText)}</p>
        </div>

        <div class="${CHARGE_RESULT_CLASSES.BRCODE_WRAPPER}">
          <div class="${CHARGE_RESULT_CLASSES.BRCODE_LABEL}">
            <span class="${CHARGE_RESULT_CLASSES.BRCODE_TITLE}">
              ${DEFAULT_CHARGE_RESULT_BRCODE_TITLE}
            </span>
            <span class="${CHARGE_RESULT_CLASSES.BRCODE_MODE}">
              ${escapeHtml(modeText)}
            </span>
          </div>
          <div
            class="${CHARGE_RESULT_CLASSES.BRCODE}"
            tabindex="0"
            role="region"
            aria-label="${DEFAULT_CHARGE_RESULT_BRCODE_ARIA_LABEL}"
          >${escapeHtml(brCode)}</div>
        </div>

        <div class="${CHARGE_RESULT_CLASSES.ACTIONS}">
          <slot name="actions"></slot>
        </div>
      `;
    };
  }

  connectedCallback() {
    if (!this.classList.contains(CHARGE_RESULT_CLASSES.ROOT)) {
      this.classList.add(CHARGE_RESULT_CLASSES.ROOT);
    }
    if (!this.classList.contains(CHARGE_RESULT_CLASSES.CARD)) {
      this.classList.add(CHARGE_RESULT_CLASSES.CARD);
    }
    if (!this.hasAttribute("aria-label")) {
      this.setAttribute("aria-label", DEFAULT_CHARGE_RESULT_ARIA_LABEL);
    }
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "region");
    }

    this.#syncEmptyModifier();

    this.#windowListener = (event) => {
      const incoming = event.detail?.cobrancaPix || event.detail?.charge;
      if (incoming) {
        this.setCharge(incoming);
      }
    };
    window.addEventListener("charge-generated", this.#windowListener);

    super.connectedCallback();
  }

  disconnectedCallback() {
    if (this.#windowListener) {
      window.removeEventListener("charge-generated", this.#windowListener);
      this.#windowListener = null;
    }
    super.disconnectedCallback?.();
  }

  render() {
    super.render();
    if (this.#liveRegionElement && !this.contains(this.#liveRegionElement)) {
      this.appendChild(this.#liveRegionElement);
    }
  }

  /**
   * Obtém a cobrança ativa associada ao componente.
   *
   * @returns {object|null}
   */
  get charge() {
    return this.#charge;
  }

  /**
   * Define e renderiza reativamente uma nova cobrança PIX.
   *
   * @param {object|null} value Instância de CobrancaPix ou payload compatível
   */
  set charge(value) {
    this.setCharge(value);
  }

  /**
   * Define uma nova cobrança, atualiza a interface e dispara o evento charge-changed.
   *
   * @param {object|null} charge
   */
  setCharge(charge) {
    this.#charge = charge || null;
    this.#updateLiveMessage();
    this.#syncEmptyModifier();

    if (this.isConnected) {
      this.render();
    }

    this.dispatchEvent(
      new CustomEvent(CHARGE_RESULT_EVENT_NAMES.CHARGE_CHANGED, {
        detail: { charge: this.#charge },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Limpa a cobrança ativa, retorna ao estado de espera e dispara o evento charge-cleared.
   */
  clearCharge() {
    this.#charge = null;
    this.#liveMessage = "";
    if (this.#liveRegionElement) {
      this.#liveRegionElement.textContent = "";
    }
    this.#syncEmptyModifier();

    if (this.isConnected) {
      this.render();
    }

    this.dispatchEvent(
      new CustomEvent(CHARGE_RESULT_EVENT_NAMES.CHARGE_CLEARED, {
        detail: {},
        bubbles: true,
        composed: true,
      }),
    );
  }

  #syncEmptyModifier() {
    if (!this.#charge) {
      this.classList.add(CHARGE_RESULT_CLASSES.EMPTY);
    } else {
      this.classList.remove(CHARGE_RESULT_CLASSES.EMPTY);
    }
  }

  #updateLiveMessage() {
    if (!this.#charge) {
      this.#liveMessage = "";
      if (this.#liveRegionElement) {
        this.#liveRegionElement.textContent = "";
      }
      return;
    }

    const badgeInfo = formatChargeAmountBadge(
      this.#charge.valor_opcional,
      this.#charge.valor_dinamico,
    );

    if (badgeInfo.isOpen) {
      this.#liveMessage =
        "Cobrança PIX pronta para pagamento com Valor Aberto.";
    } else {
      this.#liveMessage = `Cobrança PIX pronta para pagamento no valor de ${badgeInfo.text}.`;
    }

    if (this.#liveRegionElement) {
      this.#liveRegionElement.textContent = this.#liveMessage;
    }
  }
}

if (!customElements.get("pix-charge-result")) {
  customElements.define("pix-charge-result", PixChargeResultComponent);
}

export default PixChargeResultComponent;
