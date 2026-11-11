import CustomElement from "@modnes/custom-element";
import { pixKeyDialogTemplate } from "./pix-key-dialog.template.js";
import {
  DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL,
  DEFAULT_KEY_DIALOG_CLOSE_TITLE,
  DEFAULT_KEY_DIALOG_INITIAL_TYPE,
  DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL,
  DEFAULT_KEY_DIALOG_TITLE,
  KEY_DIALOG_CLASSES,
  KEY_DIALOG_EVENT_NAMES,
  KEY_DIALOG_INJECTABLES,
  getKeyTypeConfig,
} from "./pix-key-dialog.constants.js";
import { ChaveConta } from "../../../domain/entities/pix-key.entity.js";

/**
 * Polyfill/shim leve para HTMLDialogElement em ambientes sem suporte nativo (ex: jsdom).
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
 * Web Component <pix-key-dialog>
 * Modal <dialog> acessível para cadastro de nova chave PIX sem mudança de contexto.
 */
export class PixKeyDialogComponent extends CustomElement {
  #titleText = DEFAULT_KEY_DIALOG_TITLE;
  #saveBtnLabel = DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL;
  #cancelBtnLabel = DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL;
  #closeTitle = DEFAULT_KEY_DIALOG_CLOSE_TITLE;

  #selectedKeyType = DEFAULT_KEY_DIALOG_INITIAL_TYPE;
  #keyValue = "";
  #accountLabel = "";
  #merchantName = "";
  #merchantCity = "";
  #errorMessage = null;
  #errorField = null;

  #savePixKeyUseCase = null;
  #pixKeyRepository = null;

  static observedAttributes = [
    "title-text",
    "save-btn-label",
    "cancel-btn-label",
    "close-title",
  ];

  constructor() {
    super();

    this.addInjectable(
      KEY_DIALOG_INJECTABLES.SAVE_PIX_KEY_USE_CASE,
      "savePixKeyUseCase",
    );
    this.addInjectable(
      KEY_DIALOG_INJECTABLES.PIX_KEY_REPOSITORY,
      "pixKeyRepository",
    );

    this.template = () =>
      pixKeyDialogTemplate({
        selectedKeyType: this.#selectedKeyType,
        titleText: this.#titleText,
        closeTitle: this.#closeTitle,
        saveBtnLabel: this.#saveBtnLabel,
        cancelBtnLabel: this.#cancelBtnLabel,
        keyValue: this.#keyValue,
        accountLabel: this.#accountLabel,
        merchantName: this.#merchantName,
        merchantCity: this.#merchantCity,
        errorMessage: this.#errorMessage,
        errorField: this.#errorField,
      });
  }

  get savePixKeyUseCase() {
    return this.#savePixKeyUseCase;
  }

  set savePixKeyUseCase(useCase) {
    this.#savePixKeyUseCase = useCase;
  }

  get pixKeyRepository() {
    return this.#pixKeyRepository;
  }

  set pixKeyRepository(repo) {
    this.#pixKeyRepository = repo;
  }

  get selectedKeyType() {
    return this.#selectedKeyType;
  }

  set selectedKeyType(type) {
    const config = getKeyTypeConfig(type);
    if (this.#selectedKeyType !== config.type) {
      this.#selectedKeyType = config.type;
      this.#errorMessage = null;
      this.#errorField = null;
      this.render();
    }
  }

  get titleText() {
    return this.#titleText;
  }

  set titleText(val) {
    this.#titleText = val || DEFAULT_KEY_DIALOG_TITLE;
    this.render();
  }

  get saveBtnLabel() {
    return this.#saveBtnLabel;
  }

  set saveBtnLabel(val) {
    this.#saveBtnLabel = val || DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL;
    this.render();
  }

  get cancelBtnLabel() {
    return this.#cancelBtnLabel;
  }

  set cancelBtnLabel(val) {
    this.#cancelBtnLabel = val || DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL;
    this.render();
  }

  get closeTitle() {
    return this.#closeTitle;
  }

  set closeTitle(val) {
    this.#closeTitle = val || DEFAULT_KEY_DIALOG_CLOSE_TITLE;
    this.render();
  }

  get open() {
    const dialog = this.querySelector("dialog");
    return dialog ? dialog.hasAttribute("open") : false;
  }

  set open(isOpen) {
    if (isOpen) {
      this.openModal();
    } else {
      this.closeModal();
    }
  }

  get errorMessage() {
    return this.#errorMessage;
  }

  connectedCallback() {
    this.render();
    this.#setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "title-text":
        this.#titleText = newValue || DEFAULT_KEY_DIALOG_TITLE;
        break;
      case "save-btn-label":
        this.#saveBtnLabel = newValue || DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL;
        break;
      case "cancel-btn-label":
        this.#cancelBtnLabel = newValue || DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL;
        break;
      case "close-title":
        this.#closeTitle = newValue || DEFAULT_KEY_DIALOG_CLOSE_TITLE;
        break;
    }

    if (this.isConnected) {
      this.render();
    }
  }

  openModal() {
    const dialog = this.querySelector("dialog");
    if (dialog) {
      ensureDialogApi(dialog);
      if (!dialog.hasAttribute("open")) {
        dialog.showModal();
      }
      const keyInput = dialog.querySelector(`.${KEY_DIALOG_CLASSES.INPUT}`);
      if (keyInput && typeof keyInput.focus === "function") {
        keyInput.focus();
      }
    }
  }

  closeModal() {
    const dialog = this.querySelector("dialog");
    if (dialog) {
      ensureDialogApi(dialog);
      if (dialog.hasAttribute("open")) {
        dialog.close();
      }
    }
    this.dispatchEvent(
      new CustomEvent(KEY_DIALOG_EVENT_NAMES.CLOSE_KEY_DIALOG, {
        bubbles: true,
        composed: true,
      }),
    );
  }

  resetForm() {
    this.#selectedKeyType = DEFAULT_KEY_DIALOG_INITIAL_TYPE;
    this.#keyValue = "";
    this.#accountLabel = "";
    this.#merchantName = "";
    this.#merchantCity = "";
    this.#errorMessage = null;
    this.#errorField = null;
    this.render();
  }

  #setupEventListeners() {
    // Intercepta evento global "open-key-dialog" emitido por outros componentes
    this._handleExternalOpen = () => this.openModal();
    document.addEventListener(
      KEY_DIALOG_EVENT_NAMES.OPEN_KEY_DIALOG,
      this._handleExternalOpen,
    );
  }

  disconnectedCallback() {
    if (this._handleExternalOpen) {
      document.removeEventListener(
        KEY_DIALOG_EVENT_NAMES.OPEN_KEY_DIALOG,
        this._handleExternalOpen,
      );
    }
  }

  async handleFormSubmit(event) {
    if (event) {
      event.preventDefault();
    }

    const form = this.querySelector(`.${KEY_DIALOG_CLASSES.FORM}`);
    if (!form) return;

    const keyInput = form.querySelector(`input[name="valor_chave"]`);
    const labelInput = form.querySelector(`input[name="rotulo"]`);
    const nameInput = form.querySelector(`input[name="nome_recebedor"]`);
    const cityInput = form.querySelector(`input[name="cidade_recebedor"]`);

    this.#keyValue = keyInput ? keyInput.value.trim() : "";
    this.#accountLabel = labelInput ? labelInput.value.trim() : "";
    this.#merchantName = nameInput ? nameInput.value.trim() : "";
    this.#merchantCity = cityInput ? cityInput.value.trim() : "";

    try {
      this.#errorMessage = null;
      this.#errorField = null;

      // Monta objeto chave candidato para validação
      const candidateData = {
        tipo_chave: this.#selectedKeyType,
        valor_chave: this.#keyValue,
        rotulo: this.#accountLabel,
        nome_recebedor: this.#merchantName,
        cidade_recebedor: this.#merchantCity,
      };

      let result;
      if (
        this.#savePixKeyUseCase &&
        typeof this.#savePixKeyUseCase.execute === "function"
      ) {
        result = await this.#savePixKeyUseCase.execute({
          chave_conta: candidateData,
          selectAsActive: true,
        });
      } else {
        // Fallback autônomo (validação local com a entidade ChaveConta)
        const chaveConta = ChaveConta.create(candidateData);
        result = {
          chaveConta,
          chave_conta: chaveConta,
          selectedKeyId: chaveConta.id,
          isSelected: true,
        };
      }

      // Sucesso: despacha evento, reseta formulário e fecha o modal
      this.dispatchEvent(
        new CustomEvent(KEY_DIALOG_EVENT_NAMES.KEY_SAVED, {
          bubbles: true,
          composed: true,
          detail: result,
        }),
      );

      this.closeModal();
      this.resetForm();
    } catch (error) {
      this.#errorMessage = error.message || "Erro ao salvar chave PIX.";
      this.#errorField = error.field || "valor_chave";
      this.render();
    }
  }

  render() {
    const wasOpen = this.open;

    this.innerHTML = this.template();

    const dialog = this.querySelector("dialog");
    ensureDialogApi(dialog);
    if (wasOpen && dialog && !dialog.hasAttribute("open")) {
      dialog.showModal();
    }

    this.#bindDomEvents();
  }

  #bindDomEvents() {
    const dialog = this.querySelector("dialog");
    if (!dialog) return;

    // Fechar pelo botão X
    const closeBtn = dialog.querySelector(`.${KEY_DIALOG_CLASSES.CLOSE_BTN}`);
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }

    // Fechar pelo botão Cancelar
    const cancelBtn = dialog.querySelector(`.${KEY_DIALOG_CLASSES.BTN_CANCEL}`);
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.closeModal());
    }

    // Tecla Escape nativa / cancel
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      this.closeModal();
    });

    // Fechar ao clicar no backdrop (fora da caixa do modal)
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const isInDialog =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!isInDialog) {
          this.closeModal();
        }
      }
    });

    // Pílulas de tipo
    const typeButtons = dialog.querySelectorAll(
      `.${KEY_DIALOG_CLASSES.TYPE_BTN}`,
    );
    typeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.getAttribute("data-type");
        if (type) {
          this.selectedKeyType = type;
        }
      });
    });

    // Formulário Submit e limpeza reativa de erros ao digitar
    const form = dialog.querySelector(`.${KEY_DIALOG_CLASSES.FORM}`);
    if (form) {
      form.addEventListener("input", () => {
        if (this.#errorMessage) {
          this.#errorMessage = null;
          this.#errorField = null;
          const alert = dialog.querySelector(`.${KEY_DIALOG_CLASSES.ALERT}`);
          if (alert) alert.remove();
          const errorInputs = dialog.querySelectorAll(
            `.${KEY_DIALOG_CLASSES.INPUT_ERROR}`,
          );
          errorInputs.forEach((el) =>
            el.classList.remove(KEY_DIALOG_CLASSES.INPUT_ERROR),
          );
        }
      });

      form.addEventListener("submit", (e) => this.handleFormSubmit(e));
    }
  }
}

if (!customElements.get("pix-key-dialog")) {
  customElements.define("pix-key-dialog", PixKeyDialogComponent);
}
export default PixKeyDialogComponent;
