import CustomElement from "@modnes/custom-element";
import {
  CHARGE_FORM_CLASSES,
  CHARGE_FORM_EVENT_NAMES,
  CHARGE_FORM_ICONS,
  CHARGE_FORM_INJECTABLES,
  CHARGE_FORM_PRESETS,
  DEFAULT_CHARGE_FORM_CLEAR_LABEL,
  DEFAULT_CHARGE_FORM_CTA_LABEL,
  DEFAULT_CHARGE_FORM_CURRENCY,
  DEFAULT_CHARGE_FORM_INPUT_ID,
  DEFAULT_CHARGE_FORM_OPTIONAL_BADGE,
  DEFAULT_CHARGE_FORM_PLACEHOLDER,
  DEFAULT_CHARGE_FORM_STEP,
  DEFAULT_CHARGE_FORM_TITLE,
  DEFAULT_CHARGE_FORM_TITLE_ID,
  parseChargeAmount,
  resolveCtaTooltip,
} from "./pix-charge-form.constants.js";

/**
 * Escapa caracteres HTML para prevenir injeção de script.
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
 * Web Component <pix-charge-form>
 * Apresenta o formulário de valor opcional da cobrança (Passo 2) e o botão
 * principal "Manda um PIX" (Passo 3), emitindo cobranças instantaneamente.
 */
export class PixChargeFormComponent extends CustomElement {
  #amount = "";
  #selectedKey = null;
  #selectedKeyId = null;
  #stepText = DEFAULT_CHARGE_FORM_STEP;
  #titleText = DEFAULT_CHARGE_FORM_TITLE;
  #ctaText = DEFAULT_CHARGE_FORM_CTA_LABEL;
  #errorMessage = null;

  #generatePixChargeUseCase = null;
  #pixKeyRepository = null;
  #repositoryUnsubscribe = null;

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

    this.template = () => {
      const parsedAmount = parseChargeAmount(this.#amount);
      const isCtaDisabled = !this.#selectedKey;
      const ctaTooltip = resolveCtaTooltip(!isCtaDisabled, this.#ctaText);
      const ctaDisabledClass = isCtaDisabled
        ? ` ${CHARGE_FORM_CLASSES.CTA_DISABLED}`
        : "";
      const clearBtnHiddenClass = !this.#amount
        ? ` ${CHARGE_FORM_CLASSES.CLEAR_BTN_HIDDEN}`
        : "";

      const presetsHtml = CHARGE_FORM_PRESETS.map((preset) => {
        const isActive =
          preset.value === this.#amount ||
          (preset.value === "" && !parsedAmount.isFixed);
        const activeClass = isActive
          ? ` ${CHARGE_FORM_CLASSES.PRESET_ACTIVE}`
          : "";

        return `
          <button
            type="button"
            class="${CHARGE_FORM_CLASSES.PRESET}${activeClass}"
            data-preset="${escapeHtml(preset.id)}"
            data-value="${escapeHtml(preset.value)}"
            aria-label="${escapeHtml(preset.ariaLabel)}"
          >
            ${escapeHtml(preset.label)}
          </button>
        `;
      }).join("");

      const alertHtml = this.#errorMessage
        ? `
          <div class="${CHARGE_FORM_CLASSES.ALERT}" role="alert" aria-live="assertive">
            <vector-icon class="${CHARGE_FORM_CLASSES.ALERT_ICON}" name="${CHARGE_FORM_ICONS.ALERT}"></vector-icon>
            <span class="${CHARGE_FORM_CLASSES.ALERT_TEXT}">${escapeHtml(this.#errorMessage)}</span>
          </div>
        `
        : "";

      return `
        <div class="${CHARGE_FORM_CLASSES.CARD} ${CHARGE_FORM_CLASSES.AMOUNT_FIELD}">
          <div class="${CHARGE_FORM_CLASSES.SECTION_HEADER}">
            <div class="${CHARGE_FORM_CLASSES.HEADER_TITLE_GROUP}">
              <span class="${CHARGE_FORM_CLASSES.STEP_BADGE}">${escapeHtml(this.#stepText)}</span>
              <label
                for="${DEFAULT_CHARGE_FORM_INPUT_ID}"
                id="${DEFAULT_CHARGE_FORM_TITLE_ID}"
                class="${CHARGE_FORM_CLASSES.TITLE}"
              >
                ${escapeHtml(this.#titleText)}
              </label>
            </div>
            <span class="${CHARGE_FORM_CLASSES.OPTIONAL_BADGE}">
              ${escapeHtml(DEFAULT_CHARGE_FORM_OPTIONAL_BADGE)}
            </span>
          </div>

          <div class="${CHARGE_FORM_CLASSES.BOX}">
            <span class="${CHARGE_FORM_CLASSES.CURRENCY}">${escapeHtml(DEFAULT_CHARGE_FORM_CURRENCY)}</span>
            <input
              id="${DEFAULT_CHARGE_FORM_INPUT_ID}"
              type="text"
              inputmode="decimal"
              value="${escapeHtml(this.#amount)}"
              placeholder="${escapeHtml(DEFAULT_CHARGE_FORM_PLACEHOLDER)}"
              class="${CHARGE_FORM_CLASSES.INPUT}"
            />
            <button
              type="button"
              class="${CHARGE_FORM_CLASSES.CLEAR_BTN}${clearBtnHiddenClass}"
              aria-label="${escapeHtml(DEFAULT_CHARGE_FORM_CLEAR_LABEL)}"
              title="${escapeHtml(DEFAULT_CHARGE_FORM_CLEAR_LABEL)}"
            >
              <vector-icon name="${CHARGE_FORM_ICONS.XMARK}"></vector-icon>
            </button>
          </div>

          <div class="${CHARGE_FORM_CLASSES.FOOTER}">
            <span
              class="${CHARGE_FORM_CLASSES.STATUS} ${parsedAmount.statusClass}"
              aria-live="polite"
            >
              ${escapeHtml(parsedAmount.statusText)}
            </span>

            <div class="${CHARGE_FORM_CLASSES.SHORTCUTS}">
              ${presetsHtml}
            </div>
          </div>
        </div>

        ${alertHtml}

        <button
          type="submit"
          class="${CHARGE_FORM_CLASSES.CTA}${ctaDisabledClass}"
          ${isCtaDisabled ? 'disabled aria-disabled="true"' : 'aria-disabled="false"'}
          title="${escapeHtml(ctaTooltip)}"
        >
          <vector-icon name="${CHARGE_FORM_ICONS.QRCODE}"></vector-icon>
          <span>${escapeHtml(this.#ctaText)}</span>
        </button>
      `;
    };
  }

  get amount() {
    return this.#amount;
  }

  set amount(value) {
    const normalized =
      value !== null && value !== undefined ? String(value) : "";
    if (this.#amount === normalized) {
      return;
    }
    this.#amount = normalized;
    this.#errorMessage = null;

    if (this.isConnected) {
      const input = this.querySelector(`input.${CHARGE_FORM_CLASSES.INPUT}`);
      if (input && input.value !== normalized) {
        input.value = normalized;
      }
      this.#updateStatusPill();
      this.#updateClearButton();
    }

    this.#dispatchAmountChanged();
  }

  get selectedKey() {
    return this.#selectedKey;
  }

  set selectedKey(key) {
    this.#selectedKey = key || null;
    this.#selectedKeyId = key?.id || null;
    this.#errorMessage = null;

    if (this.isConnected) {
      this.#updateCtaState();
    }
  }

  get selectedKeyId() {
    return this.#selectedKeyId;
  }

  set selectedKeyId(id) {
    this.#selectedKeyId = id || null;
    if (this.isConnected && this.#selectedKeyId) {
      this.syncSelectedKey(this.#selectedKeyId);
    }
  }

  get disabled() {
    return !this.#selectedKey;
  }

  get stepText() {
    return this.#stepText;
  }

  set stepText(value) {
    this.#stepText = value || DEFAULT_CHARGE_FORM_STEP;
    if (this.isConnected) {
      this.render();
    }
  }

  get titleText() {
    return this.#titleText;
  }

  set titleText(value) {
    this.#titleText = value || DEFAULT_CHARGE_FORM_TITLE;
    if (this.isConnected) {
      this.render();
    }
  }

  get ctaText() {
    return this.#ctaText;
  }

  set ctaText(value) {
    this.#ctaText = value || DEFAULT_CHARGE_FORM_CTA_LABEL;
    if (this.isConnected) {
      this.render();
    }
  }

  get errorMessage() {
    return this.#errorMessage;
  }

  set errorMessage(message) {
    this.#errorMessage = message || null;
    if (this.isConnected) {
      this.render();
    }
  }

  get generatePixChargeUseCase() {
    return this.#generatePixChargeUseCase;
  }

  set generatePixChargeUseCase(useCase) {
    this.#generatePixChargeUseCase = useCase || null;
  }

  get pixKeyRepository() {
    return this.#pixKeyRepository;
  }

  set pixKeyRepository(repository) {
    this.#teardownRepositorySubscription();
    this.#pixKeyRepository = repository || null;
    if (this.isConnected && this.#pixKeyRepository) {
      this.#setupRepositorySubscription();
    }
  }

  connectedCallback() {
    if (!this.classList.contains(CHARGE_FORM_CLASSES.ROOT)) {
      this.classList.add(CHARGE_FORM_CLASSES.ROOT);
    }
    if (!this.hasAttribute("aria-label")) {
      this.setAttribute("aria-label", "Gerador de cobrança PIX");
    }

    this.syncAttributes();
    super.connectedCallback();

    if (this.#pixKeyRepository) {
      this.#setupRepositorySubscription();
    }
  }

  disconnectedCallback() {
    this.#teardownRepositorySubscription();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    switch (name) {
      case "amount":
        this.amount = newValue;
        break;
      case "selected-key-id":
        this.selectedKeyId = newValue;
        break;
      case "step-text":
        this.stepText = newValue;
        break;
      case "title-text":
        this.titleText = newValue;
        break;
      case "cta-text":
        this.ctaText = newValue;
        break;
      default:
        break;
    }
  }

  syncAttributes() {
    if (this.hasAttribute("amount")) {
      this.#amount = this.getAttribute("amount") || "";
    }
    if (this.hasAttribute("selected-key-id")) {
      this.#selectedKeyId = this.getAttribute("selected-key-id");
    }
    if (this.hasAttribute("step-text")) {
      this.#stepText =
        this.getAttribute("step-text") || DEFAULT_CHARGE_FORM_STEP;
    }
    if (this.hasAttribute("title-text")) {
      this.#titleText =
        this.getAttribute("title-text") || DEFAULT_CHARGE_FORM_TITLE;
    }
    if (this.hasAttribute("cta-text")) {
      this.#ctaText =
        this.getAttribute("cta-text") || DEFAULT_CHARGE_FORM_CTA_LABEL;
    }
  }

  init() {
    const input = this.querySelector(`input.${CHARGE_FORM_CLASSES.INPUT}`);
    if (input) {
      input.addEventListener("input", (event) => {
        this.#amount = event.target.value;
        this.#errorMessage = null;
        this.#updateStatusPill();
        this.#updateClearButton();
        this.#dispatchAmountChanged();
      });

      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.submitCharge();
        }
      });
    }

    const clearBtn = this.querySelector(
      `button.${CHARGE_FORM_CLASSES.CLEAR_BTN}`,
    );
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.clearAmount();
      });
    }

    const presetButtons = this.querySelectorAll(
      `button.${CHARGE_FORM_CLASSES.PRESET}`,
    );
    presetButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.value ?? "";
        this.setPreset(val);
      });
    });

    const ctaBtn = this.querySelector(`button.${CHARGE_FORM_CLASSES.CTA}`);
    if (ctaBtn) {
      ctaBtn.addEventListener("click", (event) => {
        event.preventDefault();
        this.submitCharge();
      });
    }
  }

  setPreset(presetVal) {
    this.amount = presetVal;
    const input = this.querySelector(`input.${CHARGE_FORM_CLASSES.INPUT}`);
    if (input) {
      input.focus();
    }
  }

  clearAmount() {
    this.amount = "";
    const input = this.querySelector(`input.${CHARGE_FORM_CLASSES.INPUT}`);
    if (input) {
      input.focus();
    }
  }

  async syncSelectedKey(keyId) {
    if (!this.#pixKeyRepository || !keyId) {
      return;
    }

    try {
      if (typeof this.#pixKeyRepository.findById === "function") {
        const key = await this.#pixKeyRepository.findById(keyId);
        if (key) {
          this.selectedKey = key;
          return;
        }
      }

      if (typeof this.#pixKeyRepository.getSelectedKey === "function") {
        const key = await this.#pixKeyRepository.getSelectedKey();
        if (key) {
          this.selectedKey = key;
        }
      }
    } catch {
      // Fallback silencioso para não quebrar ciclo de renderização
    }
  }

  async submitCharge() {
    if (!this.#selectedKey) {
      return null;
    }

    const parsed = parseChargeAmount(this.#amount);
    const useCase = this.#generatePixChargeUseCase;

    if (!useCase || typeof useCase.execute !== "function") {
      return null;
    }

    try {
      this.#errorMessage = null;

      const cobrancaPix = await useCase.execute({
        chave_conta: this.#selectedKey,
        valor_opcional: parsed.numericAmount,
      });

      const event = new CustomEvent(CHARGE_FORM_EVENT_NAMES.CHARGE_GENERATED, {
        bubbles: true,
        composed: true,
        detail: {
          cobrancaPix,
          chaveConta: this.#selectedKey,
          amount: parsed.numericAmount,
          rawAmount: this.#amount,
        },
      });

      this.dispatchEvent(event);
      return cobrancaPix;
    } catch (error) {
      this.#errorMessage = error?.message || "Erro ao gerar cobrança PIX.";
      this.render();
      return null;
    }
  }

  #updateStatusPill() {
    const statusEl = this.querySelector(`.${CHARGE_FORM_CLASSES.STATUS}`);
    if (!statusEl) return;

    const parsed = parseChargeAmount(this.#amount);
    statusEl.textContent = parsed.statusText;
    statusEl.className = `${CHARGE_FORM_CLASSES.STATUS} ${parsed.statusClass}`;
  }

  #updateClearButton() {
    const clearBtn = this.querySelector(
      `button.${CHARGE_FORM_CLASSES.CLEAR_BTN}`,
    );
    if (!clearBtn) return;

    if (this.#amount) {
      clearBtn.classList.remove(CHARGE_FORM_CLASSES.CLEAR_BTN_HIDDEN);
    } else {
      clearBtn.classList.add(CHARGE_FORM_CLASSES.CLEAR_BTN_HIDDEN);
    }
  }

  #updateCtaState() {
    const ctaBtn = this.querySelector(`button.${CHARGE_FORM_CLASSES.CTA}`);
    if (!ctaBtn) return;

    const isCtaDisabled = !this.#selectedKey;
    const ctaTooltip = resolveCtaTooltip(!isCtaDisabled, this.#ctaText);

    if (isCtaDisabled) {
      ctaBtn.setAttribute("disabled", "");
      ctaBtn.setAttribute("aria-disabled", "true");
      ctaBtn.classList.add(CHARGE_FORM_CLASSES.CTA_DISABLED);
    } else {
      ctaBtn.removeAttribute("disabled");
      ctaBtn.setAttribute("aria-disabled", "false");
      ctaBtn.classList.remove(CHARGE_FORM_CLASSES.CTA_DISABLED);
    }

    ctaBtn.setAttribute("title", ctaTooltip);
  }

  #dispatchAmountChanged() {
    const parsed = parseChargeAmount(this.#amount);
    this.dispatchEvent(
      new CustomEvent(CHARGE_FORM_EVENT_NAMES.AMOUNT_CHANGED, {
        bubbles: true,
        composed: true,
        detail: {
          rawAmount: this.#amount,
          amount: parsed.numericAmount,
          isFixed: parsed.isFixed,
        },
      }),
    );
  }

  #setupRepositorySubscription() {
    if (
      this.#pixKeyRepository &&
      typeof this.#pixKeyRepository.subscribe === "function" &&
      !this.#repositoryUnsubscribe
    ) {
      this.#repositoryUnsubscribe = this.#pixKeyRepository.subscribe(
        (state) => {
          if (state && state.selectedKey !== undefined) {
            this.selectedKey = state.selectedKey;
          }
        },
      );
    }
  }

  #teardownRepositorySubscription() {
    if (typeof this.#repositoryUnsubscribe === "function") {
      this.#repositoryUnsubscribe();
      this.#repositoryUnsubscribe = null;
    }
  }
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("pix-charge-form")
) {
  customElements.define("pix-charge-form", PixChargeFormComponent);
}

export default PixChargeFormComponent;
