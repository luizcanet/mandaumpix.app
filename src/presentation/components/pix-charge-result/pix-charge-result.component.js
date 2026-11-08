import CustomElement from "@modnes/custom-element";
import {
  CHARGE_RESULT_CLASSES,
  CHARGE_RESULT_EVENT_NAMES,
  CHARGE_RESULT_ICONS,
  COPY_FEEDBACK_DURATION_MS,
  DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK,
  DEFAULT_CHARGE_RESULT_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BRCODE_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BRCODE_TITLE,
  DEFAULT_CHARGE_RESULT_BTN_COPY_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BTN_DOWNLOAD_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BTN_SHARE_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_COPIED_LABEL,
  DEFAULT_CHARGE_RESULT_COPY_LABEL,
  DEFAULT_CHARGE_RESULT_DOWNLOAD_FILENAME,
  DEFAULT_CHARGE_RESULT_DOWNLOAD_LABEL,
  DEFAULT_CHARGE_RESULT_LIVE_COPIED,
  DEFAULT_CHARGE_RESULT_LIVE_COPY_FALLBACK,
  DEFAULT_CHARGE_RESULT_LIVE_DOWNLOADED,
  DEFAULT_CHARGE_RESULT_LIVE_SHARED,
  DEFAULT_CHARGE_RESULT_MODE_FIXED,
  DEFAULT_CHARGE_RESULT_MODE_OPEN,
  DEFAULT_CHARGE_RESULT_QR_ALT,
  DEFAULT_CHARGE_RESULT_READY_BADGE,
  DEFAULT_CHARGE_RESULT_SHARE_LABEL,
  DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION,
  DEFAULT_CHARGE_RESULT_WAITING_TITLE,
  DISTRIBUTE_PIX_CHARGE_INJECTABLE_TOKEN,
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
  #clickHandler = null;
  #distributePixChargeUseCase = null;
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

      const copyLabel = this.#isCopied
        ? DEFAULT_CHARGE_RESULT_COPIED_LABEL
        : DEFAULT_CHARGE_RESULT_COPY_LABEL;
      const copyIcon = this.#isCopied
        ? CHARGE_RESULT_ICONS.CHECK
        : CHARGE_RESULT_ICONS.COPY;
      const copyModifier = this.#isCopied
        ? ` ${CHARGE_RESULT_CLASSES.BTN_COPIED}`
        : "";

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
          <button
            type="button"
            class="${CHARGE_RESULT_CLASSES.BTN} ${CHARGE_RESULT_CLASSES.BTN_COPY}${copyModifier}"
            aria-label="${DEFAULT_CHARGE_RESULT_BTN_COPY_ARIA_LABEL}"
          >
            <vector-icon name="${copyIcon}"></vector-icon>
            <span>${escapeHtml(copyLabel)}</span>
          </button>

          <button
            type="button"
            class="${CHARGE_RESULT_CLASSES.BTN} ${CHARGE_RESULT_CLASSES.BTN_SHARE}"
            aria-label="${DEFAULT_CHARGE_RESULT_BTN_SHARE_ARIA_LABEL}"
          >
            <vector-icon name="${CHARGE_RESULT_ICONS.SHARE}"></vector-icon>
            <span>${escapeHtml(DEFAULT_CHARGE_RESULT_SHARE_LABEL)}</span>
          </button>

          <button
            type="button"
            class="${CHARGE_RESULT_CLASSES.BTN} ${CHARGE_RESULT_CLASSES.BTN_DOWNLOAD}"
            aria-label="${DEFAULT_CHARGE_RESULT_BTN_DOWNLOAD_ARIA_LABEL}"
          >
            <vector-icon name="${CHARGE_RESULT_ICONS.DOWNLOAD}"></vector-icon>
            <span>${escapeHtml(DEFAULT_CHARGE_RESULT_DOWNLOAD_LABEL)}</span>
          </button>

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
   * Obtém o caso de uso injetado ou atribuído para distribuição da cobrança.
   *
   * @returns {object|null}
   */
  get distributePixChargeUseCase() {
    return this.#distributePixChargeUseCase;
  }

  /**
   * Atribui o caso de uso para distribuição da cobrança.
   *
   * @param {object|null} value
   */
  set distributePixChargeUseCase(value) {
    this.#distributePixChargeUseCase = value || null;
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
