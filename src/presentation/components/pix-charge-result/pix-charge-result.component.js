import CustomElement from "@modnes/custom-element";
import { pixChargeResultTemplate } from "./pix-charge-result.template.js";
import {
  CHARGE_RESULT_CLASSES,
  CHARGE_RESULT_EVENT_NAMES,
  CHARGE_RESULT_ICONS,
  COPY_FEEDBACK_DURATION_MS,
  DEFAULT_CHARGE_RESULT_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_COPIED_LABEL,
  DEFAULT_CHARGE_RESULT_COPY_LABEL,
  DEFAULT_CHARGE_RESULT_DOWNLOAD_FILENAME,
  DEFAULT_CHARGE_RESULT_LIVE_COPIED,
  DEFAULT_CHARGE_RESULT_LIVE_COPY_FALLBACK,
  DEFAULT_CHARGE_RESULT_LIVE_DOWNLOADED,
  DEFAULT_CHARGE_RESULT_LIVE_SHARED,
  DISTRIBUTE_PIX_CHARGE_INJECTABLE_TOKEN,
  formatChargeAmountBadge,
} from "./pix-charge-result.constants.js";

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
  #clickHandler = null;
  #distributePixChargeUseCase = undefined;
  #isCopied = false;
  #copyTimeoutId = null;

  constructor() {
    super();

    this.addInjectable(
      DISTRIBUTE_PIX_CHARGE_INJECTABLE_TOKEN,
      "distributePixChargeUseCase",
    );

    this.#liveRegionElement = document.createElement("div");
    this.#liveRegionElement.className = CHARGE_RESULT_CLASSES.LIVE_REGION;
    this.#liveRegionElement.setAttribute("aria-live", "polite");
    this.#liveRegionElement.setAttribute("aria-atomic", "true");

    this.template = () =>
      pixChargeResultTemplate({
        charge: this.#charge,
        isCopied: this.#isCopied,
      });
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

    this.#clickHandler = (event) => {
      const copyBtn = event.target.closest?.(
        `.${CHARGE_RESULT_CLASSES.BTN_COPY}`,
      );
      if (copyBtn) {
        event.preventDefault();
        this.copyChargeCode();
        return;
      }

      const shareBtn = event.target.closest?.(
        `.${CHARGE_RESULT_CLASSES.BTN_SHARE}`,
      );
      if (shareBtn) {
        event.preventDefault();
        this.shareCharge();
        return;
      }

      const downloadBtn = event.target.closest?.(
        `.${CHARGE_RESULT_CLASSES.BTN_DOWNLOAD}`,
      );
      if (downloadBtn) {
        event.preventDefault();
        this.downloadQrImage();
        return;
      }
    };
    this.addEventListener("click", this.#clickHandler);

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
    if (this.#clickHandler) {
      this.removeEventListener("click", this.#clickHandler);
      this.#clickHandler = null;
    }
    if (this.#copyTimeoutId) {
      clearTimeout(this.#copyTimeoutId);
      this.#copyTimeoutId = null;
    }
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
   * Resolve uma dependência fornecida por um ancestral via evento 'request-provider'.
   *
   * @param {string} name Identificador do serviço/caso de uso injetável
   * @returns {*}
   */
  useInjectable(name) {
    let resolved = null;
    this.dispatchEvent(
      new CustomEvent("request-provider", {
        bubbles: true,
        composed: true,
        detail: {
          name,
          inject: (value) => {
            resolved = value;
          },
        },
      }),
    );
    return resolved;
  }

  /**
   * Obtém o caso de uso injetado ou atribuído para distribuição da cobrança.
   *
   * @returns {object|null}
   */
  get distributePixChargeUseCase() {
    if (this.#distributePixChargeUseCase !== undefined) {
      return this.#distributePixChargeUseCase;
    }
    const resolved = this.useInjectable(DISTRIBUTE_PIX_CHARGE_INJECTABLE_TOKEN);
    if (resolved) {
      return resolved;
    }
    return null;
  }

  /**
   * Atribui o caso de uso para distribuição da cobrança.
   *
   * @param {object|null} value
   */
  set distributePixChargeUseCase(value) {
    this.#distributePixChargeUseCase = value;
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
    if (this.#copyTimeoutId) {
      clearTimeout(this.#copyTimeoutId);
      this.#copyTimeoutId = null;
    }
    this.#isCopied = false;
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
    if (this.#copyTimeoutId) {
      clearTimeout(this.#copyTimeoutId);
      this.#copyTimeoutId = null;
    }
    this.#isCopied = false;
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

  /**
   * Copia o código PIX Copia e Cola para a área de transferência,
   * exibindo feedback visual temporário e anunciando em aria-live.
   *
   * @returns {Promise<boolean|null>}
   */
  async copyChargeCode() {
    if (!this.#charge || !this.#charge.chave_cobranca) {
      return null;
    }

    const useCase = this.#distributePixChargeUseCase;
    let copiedSuccessfully = false;

    if (useCase && typeof useCase.execute === "function") {
      try {
        await useCase.execute({
          action: "COPY",
          cobranca: this.#charge,
        });
        copiedSuccessfully = true;
      } catch {
        copiedSuccessfully = false;
      }
    } else if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText
    ) {
      try {
        await navigator.clipboard.writeText(this.#charge.chave_cobranca);
        copiedSuccessfully = true;
      } catch {
        copiedSuccessfully = false;
      }
    }

    if (copiedSuccessfully) {
      this.#setCopiedState(true);
      this.#updateLiveMessage(DEFAULT_CHARGE_RESULT_LIVE_COPIED);
      this.dispatchEvent(
        new CustomEvent(CHARGE_RESULT_EVENT_NAMES.CHARGE_COPIED, {
          detail: {
            cobranca: this.#charge,
            chave_cobranca: this.#charge.chave_cobranca,
          },
          bubbles: true,
          composed: true,
        }),
      );
      return true;
    }

    this.#selectBrCodeText();
    this.#updateLiveMessage(DEFAULT_CHARGE_RESULT_LIVE_COPY_FALLBACK);
    return false;
  }

  #setCopiedState(isCopied) {
    if (this.#copyTimeoutId) {
      clearTimeout(this.#copyTimeoutId);
      this.#copyTimeoutId = null;
    }

    this.#isCopied = Boolean(isCopied);

    const copyBtn = this.querySelector(`.${CHARGE_RESULT_CLASSES.BTN_COPY}`);
    if (copyBtn) {
      if (this.#isCopied) {
        copyBtn.classList.add(CHARGE_RESULT_CLASSES.BTN_COPIED);
        const icon = copyBtn.querySelector("vector-icon");
        if (icon) {
          icon.setAttribute("name", CHARGE_RESULT_ICONS.CHECK);
        }
        const label = copyBtn.querySelector("span");
        if (label) {
          label.textContent = DEFAULT_CHARGE_RESULT_COPIED_LABEL;
        }
      } else {
        copyBtn.classList.remove(CHARGE_RESULT_CLASSES.BTN_COPIED);
        const icon = copyBtn.querySelector("vector-icon");
        if (icon) {
          icon.setAttribute("name", CHARGE_RESULT_ICONS.COPY);
        }
        const label = copyBtn.querySelector("span");
        if (label) {
          label.textContent = DEFAULT_CHARGE_RESULT_COPY_LABEL;
        }
      }
    }

    if (this.#isCopied) {
      this.#copyTimeoutId = setTimeout(() => {
        this.#setCopiedState(false);
      }, COPY_FEEDBACK_DURATION_MS);
    }
  }

  #selectBrCodeText() {
    const brCodeElement = this.querySelector(
      `.${CHARGE_RESULT_CLASSES.BRCODE}`,
    );
    if (!brCodeElement) {
      return;
    }
    try {
      brCodeElement.focus();
      const selection = window.getSelection?.();
      if (selection && document.createRange) {
        const range = document.createRange();
        range.selectNodeContents(brCodeElement);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch {
      // Ignora falhas em ambientes simulados
    }
  }

  /**
   * Compartilha a cobrança PIX via Web Share API ou abre o WhatsApp com o texto pré-formatado.
   *
   * @returns {Promise<object|null>}
   */
  async shareCharge() {
    if (!this.#charge || !this.#charge.chave_cobranca) {
      return null;
    }

    const useCase = this.#distributePixChargeUseCase;
    let result = null;

    if (useCase && typeof useCase.execute === "function") {
      try {
        result = await useCase.execute({
          action: "SHARE",
          cobranca: this.#charge,
        });
      } catch {
        // Fallback silencioso
      }
    } else if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: "Manda um PIX",
          text: this.#charge.chave_cobranca,
        });
        result = { action: "SHARE", channel: "WEB_SHARE" };
      } catch {
        // Fallback
      }
    } else if (
      typeof window !== "undefined" &&
      typeof window.open === "function"
    ) {
      const url = `https://wa.me/?text=${encodeURIComponent(this.#charge.chave_cobranca)}`;
      window.open(url, "_blank");
      result = { action: "SHARE", channel: "WHATSAPP", whatsappUrl: url };
    }

    this.#updateLiveMessage(DEFAULT_CHARGE_RESULT_LIVE_SHARED);
    this.dispatchEvent(
      new CustomEvent(CHARGE_RESULT_EVENT_NAMES.CHARGE_SHARED, {
        detail: {
          cobranca: this.#charge,
          channel: result?.channel || "WHATSAPP",
          result,
        },
        bubbles: true,
        composed: true,
      }),
    );
    return result;
  }

  /**
   * Baixa localmente a imagem PNG do QR Code da cobrança PIX em alta resolução.
   *
   * @returns {Promise<object|null>}
   */
  async downloadQrImage() {
    if (!this.#charge) {
      return null;
    }

    const useCase = this.#distributePixChargeUseCase;
    let result = null;

    if (useCase && typeof useCase.execute === "function") {
      try {
        result = await useCase.execute({
          action: "DOWNLOAD_QR",
          cobranca: this.#charge,
          fileName: DEFAULT_CHARGE_RESULT_DOWNLOAD_FILENAME,
        });
      } catch {
        // Fallback
      }
    }

    this.#updateLiveMessage(DEFAULT_CHARGE_RESULT_LIVE_DOWNLOADED);
    this.dispatchEvent(
      new CustomEvent(CHARGE_RESULT_EVENT_NAMES.CHARGE_DOWNLOADED, {
        detail: {
          cobranca: this.#charge,
          fileName: DEFAULT_CHARGE_RESULT_DOWNLOAD_FILENAME,
          result,
        },
        bubbles: true,
        composed: true,
      }),
    );
    return result;
  }

  #syncEmptyModifier() {
    if (!this.#charge) {
      this.classList.add(CHARGE_RESULT_CLASSES.EMPTY);
    } else {
      this.classList.remove(CHARGE_RESULT_CLASSES.EMPTY);
    }
  }

  #updateLiveMessage(customMessage = null) {
    if (customMessage) {
      this.#liveMessage = customMessage;
      if (this.#liveRegionElement) {
        this.#liveRegionElement.textContent = this.#liveMessage;
      }
      return;
    }

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
