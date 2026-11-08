import CustomElement from "@modnes/custom-element";
import {
  DEFAULT_KEY_SELECTOR_ADD_BTN_LABEL,
  DEFAULT_KEY_SELECTOR_DELETE_TITLE,
  DEFAULT_KEY_SELECTOR_LIST_LABEL,
  DEFAULT_KEY_SELECTOR_STEP,
  DEFAULT_KEY_SELECTOR_TITLE,
  DEFAULT_KEY_SELECTOR_TITLE_ID,
  KEY_SELECTOR_CLASSES,
  KEY_SELECTOR_EVENT_NAMES,
  KEY_SELECTOR_ICONS,
  KEY_SELECTOR_INJECTABLES,
  formatKeyDeleteAriaLabel,
} from "./pix-key-selector.constants.js";

/**
 * Web Component <pix-key-selector>
 * Apresenta a lista de chaves PIX cadastradas sob o padrão W3C ARIA Radiogroup,
 * permitindo seleção da chave ativa com 1 toque/teclado, exclusão de chaves
 * e botão de ação secundária para cadastrar novas chaves.
 */
export class PixKeySelectorComponent extends CustomElement {
  #keys = [];
  #selectedKeyId = null;

  selectPixKeyUseCase = null;
  deletePixKeyUseCase = null;
  listPixKeysUseCase = null;
  pixKeyRepository = null;

  constructor() {
    super();

    this.template = () => {
      const cardsHtml = this.#keys
        .map((item) => {
          const isSelected = item.id === this.#selectedKeyId;
          const selectedClass = isSelected
            ? ` ${KEY_SELECTOR_CLASSES.ITEM_SELECTED}`
            : "";
          const tabIndex = isSelected ? "0" : "-1";
          const ariaChecked = isSelected ? "true" : "false";

          return `
            <div
              role="radio"
              aria-checked="${ariaChecked}"
              tabindex="${tabIndex}"
              data-key-id="${item.id}"
              class="${KEY_SELECTOR_CLASSES.ITEM}${selectedClass}"
            >
              <div class="${KEY_SELECTOR_CLASSES.CARD_LEFT}">
                <span class="${KEY_SELECTOR_CLASSES.RADIO}">
                  ${isSelected ? `<span class="${KEY_SELECTOR_CLASSES.RADIO_DOT}"></span>` : ""}
                </span>
                <div class="${KEY_SELECTOR_CLASSES.META}">
                  <div class="${KEY_SELECTOR_CLASSES.TITLE_ROW}">
                    <span class="${KEY_SELECTOR_CLASSES.LABEL}">${item.rotulo}</span>
                    <span class="${KEY_SELECTOR_CLASSES.TYPE_BADGE}">${item.tipo_chave}</span>
                  </div>
                  <div class="${KEY_SELECTOR_CLASSES.VALUE}">${item.valor_chave}</div>
                </div>
              </div>
              <button
                type="button"
                class="${KEY_SELECTOR_CLASSES.DELETE_BTN}"
                title="${DEFAULT_KEY_SELECTOR_DELETE_TITLE}"
                aria-label="${formatKeyDeleteAriaLabel(item.rotulo)}"
                data-action="delete"
                data-key-id="${item.id}"
              >
                <vector-icon name="${KEY_SELECTOR_ICONS.TRASH}"></vector-icon>
              </button>
            </div>
          `;
        })
        .join("");

      return `
        <div class="${KEY_SELECTOR_CLASSES.SECTION_HEADER}">
          <div class="${KEY_SELECTOR_CLASSES.HEADER_TITLE_GROUP}">
            <span class="${KEY_SELECTOR_CLASSES.STEP_BADGE}">${DEFAULT_KEY_SELECTOR_STEP}</span>
            <h2 id="${DEFAULT_KEY_SELECTOR_TITLE_ID}" class="${KEY_SELECTOR_CLASSES.TITLE}">
              ${DEFAULT_KEY_SELECTOR_TITLE}
            </h2>
          </div>
          <button
            type="button"
            class="${KEY_SELECTOR_CLASSES.ADD_BTN}"
            data-action="open-key-dialog"
          >
            <vector-icon name="${KEY_SELECTOR_ICONS.PLUS}"></vector-icon>
            <span>${DEFAULT_KEY_SELECTOR_ADD_BTN_LABEL}</span>
          </button>
        </div>

        <div
          class="${KEY_SELECTOR_CLASSES.LIST}"
          role="radiogroup"
          aria-labelledby="${DEFAULT_KEY_SELECTOR_TITLE_ID}"
          aria-label="${DEFAULT_KEY_SELECTOR_LIST_LABEL}"
        >
          ${cardsHtml}
        </div>
      `;
    };
  }

  get keys() {
    return this.#keys;
  }

  set keys(value) {
    this.#keys = Array.isArray(value) ? [...value] : [];
    if (this.isConnected) {
      this.render();
    }
  }

  get selectedKeyId() {
    return this.#selectedKeyId;
  }

  set selectedKeyId(value) {
    this.#selectedKeyId = value || null;
    if (this.isConnected) {
      this.render();
    }
  }

  connectedCallback() {
    if (!this.classList.contains(KEY_SELECTOR_CLASSES.ROOT)) {
      this.classList.add(KEY_SELECTOR_CLASSES.ROOT);
    }
    if (!this.classList.contains(KEY_SELECTOR_CLASSES.CARD)) {
      this.classList.add(KEY_SELECTOR_CLASSES.CARD);
    }
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "region");
    }
    if (!this.hasAttribute("aria-labelledby")) {
      this.setAttribute("aria-labelledby", DEFAULT_KEY_SELECTOR_TITLE_ID);
    }

    this.addInjectable(
      KEY_SELECTOR_INJECTABLES.SELECT_PIX_KEY_USE_CASE,
      "selectPixKeyUseCase",
    );
    this.addInjectable(
      KEY_SELECTOR_INJECTABLES.DELETE_PIX_KEY_USE_CASE,
      "deletePixKeyUseCase",
    );
    this.addInjectable(
      KEY_SELECTOR_INJECTABLES.LIST_PIX_KEYS_USE_CASE,
      "listPixKeysUseCase",
    );
    this.addInjectable(
      KEY_SELECTOR_INJECTABLES.PIX_KEY_REPOSITORY,
      "pixKeyRepository",
    );

    super.connectedCallback();

    if (
      this.listPixKeysUseCase &&
      typeof this.listPixKeysUseCase.execute === "function"
    ) {
      Promise.resolve(this.listPixKeysUseCase.execute())
        .then((result) => {
          if (result && Array.isArray(result.items)) {
            this.#keys = [...result.items];
            this.#selectedKeyId = result.selectedKeyId || null;
            this.render();
          }
        })
        .catch(() => {});
    }
  }

  init() {
    const addBtn = this.querySelector(`button[data-action="open-key-dialog"]`);
    if (addBtn) {
      addBtn.addEventListener("click", () => this.#emitOpenKeyDialog());
      addBtn.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.#emitOpenKeyDialog();
        }
      });
    }

    const cards = this.querySelectorAll(`.${KEY_SELECTOR_CLASSES.ITEM}`);
    cards.forEach((card, index) => {
      const keyId = card.dataset.keyId;

      card.addEventListener("click", () => this.selectKey(keyId));

      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.selectKey(keyId);
        } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
          event.preventDefault();
          const nextIndex = (index + 1) % cards.length;
          const nextCard = cards[nextIndex];
          const nextKeyId = nextCard.dataset.keyId;
          this.selectKey(nextKeyId);
          nextCard.focus();
        } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
          event.preventDefault();
          const prevIndex = (index - 1 + cards.length) % cards.length;
          const prevCard = cards[prevIndex];
          const prevKeyId = prevCard.dataset.keyId;
          this.selectKey(prevKeyId);
          prevCard.focus();
        }
      });

      const deleteBtn = card.querySelector(`button[data-action="delete"]`);
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          this.deleteKey(keyId);
        });
      }
    });
  }

  async selectKey(id) {
    if (!id) return;
    this.#selectedKeyId = id;
    this.render();

    const selectedKey = this.#keys.find((item) => item.id === id) || null;

    this.dispatchEvent(
      new CustomEvent(KEY_SELECTOR_EVENT_NAMES.SELECT_KEY, {
        bubbles: true,
        composed: true,
        detail: { id, key: selectedKey },
      }),
    );

    if (
      this.selectPixKeyUseCase &&
      typeof this.selectPixKeyUseCase.execute === "function"
    ) {
      try {
        await this.selectPixKeyUseCase.execute({ id });
      } catch {
        // use-case errors can be handled gracefully
      }
    }
  }

  async deleteKey(id) {
    if (!id) return;

    const targetKey = this.#keys.find((item) => item.id === id) || null;

    this.dispatchEvent(
      new CustomEvent(KEY_SELECTOR_EVENT_NAMES.DELETE_KEY, {
        bubbles: true,
        composed: true,
        detail: { id, key: targetKey },
      }),
    );

    if (
      this.deletePixKeyUseCase &&
      typeof this.deletePixKeyUseCase.execute === "function"
    ) {
      try {
        await this.deletePixKeyUseCase.execute({ id });
      } catch {
        // use-case errors handled
      }
    }

    this.#keys = this.#keys.filter((item) => item.id !== id);
    if (this.#selectedKeyId === id) {
      this.#selectedKeyId = this.#keys[0]?.id || null;
    }
    this.render();
  }

  #emitOpenKeyDialog() {
    this.dispatchEvent(
      new CustomEvent(KEY_SELECTOR_EVENT_NAMES.OPEN_KEY_DIALOG, {
        bubbles: true,
        composed: true,
        detail: { source: "pix-key-selector" },
      }),
    );
  }
}

if (!customElements.get("pix-key-selector")) {
  customElements.define("pix-key-selector", PixKeySelectorComponent);
}

export default PixKeySelectorComponent;
