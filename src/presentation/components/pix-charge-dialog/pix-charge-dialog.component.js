import CustomElement from "@modnes/custom-element";
import {
  CHARGE_DIALOG_CLASSES,
  CHARGE_DIALOG_EVENT_NAMES,
  CHARGE_DIALOG_ICONS,
  CHARGE_DIALOG_INJECTABLES,
  CHARGE_DIALOG_SELECTORS,
  DEFAULT_CHARGE_DIALOG_ARIA_LABEL,
  DEFAULT_CHARGE_DIALOG_CLOSE_TITLE,
  DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL,
  DEFAULT_CHARGE_DIALOG_TITLE,
  DEFAULT_CHARGE_DIALOG_TITLE_ID,
} from "./pix-charge-dialog.constants.js";

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
 * Polyfill/shim leve para HTMLDialogElement em ambientes sem suporte nativo a showModal/close (ex: jsdom).
 *
 * @param {HTMLDialogElement} dialog
 */
function ensureDialogApi(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal !== "function") {
    dialog.showModal = function () {
      this.setAttribute("open", "");
    };
  }
  if (typeof dialog.close !== "function") {
    dialog.close = function (returnValue) {
      this.removeAttribute("open");
      if (returnValue !== undefined) {
        this.returnValue = returnValue;
      }
      this.dispatchEvent(new Event("close"));
    };
  }
}

/**
 * Web Component <pix-charge-dialog>
 * Caixa de diálogo modal (<dialog>) acessível para exibição e distribuição de cobranças PIX geradas.
 *
 * Alinhado às regras de negócio RN03, RN04, RN05, história US-07.4, W3C WAI-ARIA Dialog Modal
 * e princípios de Clean Architecture.
 */
export class PixChargeDialogComponent extends CustomElement {
  #titleText = DEFAULT_CHARGE_DIALOG_TITLE;
  #closeTitle = DEFAULT_CHARGE_DIALOG_CLOSE_TITLE;
  #dismissBtnLabel = DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL;

  #charge = null;
  #distributePixChargeUseCase = null;
  #previousActiveElement = null;

  #handleGlobalChargeGenerated = null;
  #handleGlobalOpen = null;
  #handleGlobalClose = null;

  static observedAttributes = [
    "title-text",
    "close-title",
    "dismiss-btn-label",
  ];

  constructor() {
    super();

    this.addInjectable(
      CHARGE_DIALOG_INJECTABLES.DISTRIBUTE_PIX_CHARGE_USE_CASE,
      "distributePixChargeUseCase",
    );
  }

  get charge() {
    return this.#charge;
  }

  set charge(chargeData) {
    this.#charge = chargeData;
    this.#syncChargeWithChild();
  }

  get distributePixChargeUseCase() {
    return this.#distributePixChargeUseCase;
  }

  set distributePixChargeUseCase(useCase) {
    this.#distributePixChargeUseCase = useCase;
    this.#syncDistributeUseCaseWithChild();
  }

  get titleText() {
    return this.#titleText;
  }

  set titleText(val) {
    this.#titleText = val || DEFAULT_CHARGE_DIALOG_TITLE;
    this.#updateTextContent(
      CHARGE_DIALOG_SELECTORS.TITLE,
      this.#getTitleTemplate(),
      true,
    );
  }

  get closeTitle() {
    return this.#closeTitle;
  }

  set closeTitle(val) {
    this.#closeTitle = val || DEFAULT_CHARGE_DIALOG_CLOSE_TITLE;
    const closeBtn = this.querySelector(CHARGE_DIALOG_SELECTORS.CLOSE_BTN);
    if (closeBtn) {
      closeBtn.setAttribute("title", this.#closeTitle);
      closeBtn.setAttribute("aria-label", this.#closeTitle);
    }
  }

  get dismissBtnLabel() {
    return this.#dismissBtnLabel;
  }

  set dismissBtnLabel(val) {
    this.#dismissBtnLabel = val || DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL;
    this.#updateTextContent(
      CHARGE_DIALOG_SELECTORS.DISMISS_BTN,
      this.#getDismissBtnTemplate(),
      true,
    );
  }

  get open() {
    const dialog = this.querySelector("dialog");
    return dialog ? dialog.hasAttribute("open") : false;
  }

  set open(isOpen) {
    if (isOpen) {
      this.openModal(this.#charge);
    } else {
      this.closeModal();
    }
  }

  connectedCallback() {
    this.render();
    this.#setupEventListeners();
  }

  disconnectedCallback() {
    this.#teardownEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "title-text":
        this.titleText = newValue;
        break;
      case "close-title":
        this.closeTitle = newValue;
        break;
      case "dismiss-btn-label":
        this.dismissBtnLabel = newValue;
        break;
    }
  }

  /**
   * Abre a caixa de diálogo modal via showModal().
   *
   * @param {object|null} chargeData Dados da cobrança PIX gerada
   */
  openModal(chargeData = null) {
    if (chargeData) {
      this.#charge = chargeData;
    }

    const dialog = this.querySelector("dialog");
    if (dialog) {
      ensureDialogApi(dialog);

      if (!dialog.hasAttribute("open")) {
        // Salva elemento com foco antes de abrir o modal
        this.#previousActiveElement =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

        dialog.showModal();
        this.#syncChargeWithChild();
        this.#syncDistributeUseCaseWithChild();

        // Foca o botão de fechamento acessível
        const closeBtn = dialog.querySelector(
          CHARGE_DIALOG_SELECTORS.CLOSE_BTN,
        );
        if (closeBtn && typeof closeBtn.focus === "function") {
          closeBtn.focus();
        }

        this.dispatchEvent(
          new CustomEvent(CHARGE_DIALOG_EVENT_NAMES.CHARGE_DIALOG_OPENED, {
            bubbles: true,
            composed: true,
            detail: { cobrancaPix: this.#charge },
          }),
        );
      }
    }
  }

  /**
   * Fecha a caixa de diálogo modal via dialog.close() e restaura o foco anterior.
   */
  closeModal() {
    const dialog = this.querySelector("dialog");
    if (dialog) {
      ensureDialogApi(dialog);
      if (dialog.hasAttribute("open")) {
        dialog.close();
      }
    }

    // Restaura foco anterior
    if (
      this.#previousActiveElement &&
      typeof this.#previousActiveElement.focus === "function" &&
      document.contains(this.#previousActiveElement)
    ) {
      this.#previousActiveElement.focus();
      this.#previousActiveElement = null;
    }

    this.dispatchEvent(
      new CustomEvent(CHARGE_DIALOG_EVENT_NAMES.CHARGE_DIALOG_CLOSED, {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    this.innerHTML = `
      <dialog
        class="${CHARGE_DIALOG_CLASSES.ROOT}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${DEFAULT_CHARGE_DIALOG_TITLE_ID}"
        aria-label="${escapeHtml(DEFAULT_CHARGE_DIALOG_ARIA_LABEL)}"
      >
        <div class="${CHARGE_DIALOG_CLASSES.TOP_BAR}">
          ${this.#getTitleTemplate()}
          <button
            type="button"
            class="${CHARGE_DIALOG_CLASSES.CLOSE_BTN}"
            title="${escapeHtml(this.#closeTitle)}"
            aria-label="${escapeHtml(this.#closeTitle)}"
          >
            <vector-icon name="${CHARGE_DIALOG_ICONS.XMARK}"></vector-icon>
          </button>
        </div>

        <div class="${CHARGE_DIALOG_CLASSES.BODY}">
          <pix-charge-result></pix-charge-result>
        </div>

        ${this.#getDismissBtnTemplate()}
      </dialog>
    `;

    this.#syncChargeWithChild();
    this.#syncDistributeUseCaseWithChild();
    this.#setupDialogDomListeners();
  }

  #getTitleTemplate() {
    return `
      <h3 id="${DEFAULT_CHARGE_DIALOG_TITLE_ID}" class="${CHARGE_DIALOG_CLASSES.TITLE}">
        <vector-icon name="${CHARGE_DIALOG_ICONS.CHECK}"></vector-icon>
        <span>${escapeHtml(this.#titleText)}</span>
      </h3>
    `;
  }

  #getDismissBtnTemplate() {
    return `
      <button
        type="button"
        class="${CHARGE_DIALOG_CLASSES.DISMISS_BTN}"
      >
        <vector-icon name="${CHARGE_DIALOG_ICONS.CHECK}"></vector-icon>
        <span>${escapeHtml(this.#dismissBtnLabel)}</span>
      </button>
    `;
  }

  #updateTextContent(selector, html, isInner = false) {
    const el = this.querySelector(selector);
    if (el) {
      if (isInner) {
        el.outerHTML = html;
        this.#setupDialogDomListeners();
      } else {
        el.innerHTML = html;
      }
    }
  }

  #syncChargeWithChild() {
    const chargeResult = this.querySelector(
      CHARGE_DIALOG_SELECTORS.CHARGE_RESULT,
    );
    if (chargeResult && this.#charge) {
      chargeResult.charge = this.#charge;
    }
  }

  #syncDistributeUseCaseWithChild() {
    const chargeResult = this.querySelector(
      CHARGE_DIALOG_SELECTORS.CHARGE_RESULT,
    );
    if (chargeResult && this.#distributePixChargeUseCase) {
      chargeResult.distributePixChargeUseCase =
        this.#distributePixChargeUseCase;
    }
  }

  #setupDialogDomListeners() {
    const dialog = this.querySelector("dialog");
    if (!dialog) return;

    // Fechamento no botão de fechar (X)
    const closeBtn = dialog.querySelector(CHARGE_DIALOG_SELECTORS.CLOSE_BTN);
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        this.closeModal();
      };
    }

    // Fechamento no botão de conclusão inferior
    const dismissBtn = dialog.querySelector(
      CHARGE_DIALOG_SELECTORS.DISMISS_BTN,
    );
    if (dismissBtn) {
      dismissBtn.onclick = (e) => {
        e.stopPropagation();
        this.closeModal();
      };
    }

    // Fechamento no evento cancel nativo (Esc)
    dialog.oncancel = (e) => {
      e.preventDefault();
      this.closeModal();
    };

    // Fechamento no clique do backdrop externo
    dialog.onclick = (e) => {
      const rect = dialog.getBoundingClientRect();
      const isOutside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;

      if (isOutside) {
        this.closeModal();
      }
    };

    // Focus Trap acessível (WCAG 2.2 AA)
    dialog.onkeydown = (e) => {
      if (e.key === "Tab") {
        this.#handleFocusTrap(e);
      }
    };
  }

  /**
   * Mantém a navegação por teclado (Tab / Shift+Tab) confinada aos elementos interativos do diálogo.
   *
   * @param {KeyboardEvent} e
   */
  #handleFocusTrap(e) {
    const dialog = this.querySelector("dialog");
    if (!dialog) return;

    const focusableSelectors =
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(
      dialog.querySelectorAll(focusableSelectors),
    ).filter((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab: se o foco estiver no primeiro elemento, move para o último
      if (
        document.activeElement === firstElement ||
        !dialog.contains(document.activeElement)
      ) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: se o foco estiver no último elemento, move para o primeiro
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  #setupEventListeners() {
    this.#handleGlobalChargeGenerated = (e) => {
      if (e?.detail?.cobrancaPix) {
        this.openModal(e.detail.cobrancaPix);
      }
    };

    this.#handleGlobalOpen = (e) => {
      const charge = e?.detail?.cobrancaPix || this.#charge;
      this.openModal(charge);
    };

    this.#handleGlobalClose = () => {
      this.closeModal();
    };

    window.addEventListener(
      CHARGE_DIALOG_EVENT_NAMES.CHARGE_GENERATED,
      this.#handleGlobalChargeGenerated,
    );
    window.addEventListener(
      CHARGE_DIALOG_EVENT_NAMES.OPEN_CHARGE_DIALOG,
      this.#handleGlobalOpen,
    );
    window.addEventListener(
      CHARGE_DIALOG_EVENT_NAMES.CLOSE_CHARGE_DIALOG,
      this.#handleGlobalClose,
    );
  }

  #teardownEventListeners() {
    if (this.#handleGlobalChargeGenerated) {
      window.removeEventListener(
        CHARGE_DIALOG_EVENT_NAMES.CHARGE_GENERATED,
        this.#handleGlobalChargeGenerated,
      );
      this.#handleGlobalChargeGenerated = null;
    }
    if (this.#handleGlobalOpen) {
      window.removeEventListener(
        CHARGE_DIALOG_EVENT_NAMES.OPEN_CHARGE_DIALOG,
        this.#handleGlobalOpen,
      );
      this.#handleGlobalOpen = null;
    }
    if (this.#handleGlobalClose) {
      window.removeEventListener(
        CHARGE_DIALOG_EVENT_NAMES.CLOSE_CHARGE_DIALOG,
        this.#handleGlobalClose,
      );
      this.#handleGlobalClose = null;
    }
  }
}

// Auto-registro customElements W3C
if (!customElements.get("pix-charge-dialog")) {
  customElements.define("pix-charge-dialog", PixChargeDialogComponent);
}

export default PixChargeDialogComponent;
