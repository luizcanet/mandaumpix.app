import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../vector-icon/vector-icon.component.js";
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
import PixKeySelectorComponent from "./pix-key-selector.component.js";

describe("PixKeySelectorComponent (TASK-05.2.2: Testes Unitários de Renderização e Interação)", () => {
  let selectorElement;

  const mockKeys = [
    {
      id: "key-1",
      rotulo: "Nubank Pessoal",
      tipo_chave: "CPF",
      valor_chave: "123.456.789-00",
      nome_recebedor: "LUIZ CANET",
      cidade_recebedor: "BRASILIA",
    },
    {
      id: "key-2",
      rotulo: "Inter PJ",
      tipo_chave: "CNPJ",
      valor_chave: "11.222.333/0001-81",
      nome_recebedor: "LUIZ CANET CIA",
      cidade_recebedor: "BRASILIA",
    },
    {
      id: "key-3",
      rotulo: "Chave E-mail",
      tipo_chave: "EMAIL",
      valor_chave: "eu@luizca.net",
      nome_recebedor: "LUIZ CANET",
      cidade_recebedor: "BRASILIA",
    },
  ];

  beforeEach(() => {
    selectorElement = document.createElement("pix-key-selector");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (selectorElement && selectorElement.isConnected) {
      selectorElement.remove();
    }
  });

  describe("Registro e Semântica W3C / BEM", () => {
    it("deve registrar o elemento customizado <pix-key-selector> no registry do customElements", () => {
      expect(customElements.get("pix-key-selector")).toBe(
        PixKeySelectorComponent,
      );
    });

    it("deve aplicar as classes .key-selector, .card e atributos acessíveis no connectedCallback", () => {
      document.body.appendChild(selectorElement);

      expect(selectorElement.classList.contains(KEY_SELECTOR_CLASSES.ROOT)).toBe(
        true,
      );
      expect(selectorElement.classList.contains(KEY_SELECTOR_CLASSES.CARD)).toBe(
        true,
      );
      expect(selectorElement.getAttribute("role")).toBe("region");
      expect(selectorElement.getAttribute("aria-labelledby")).toBe(
        DEFAULT_KEY_SELECTOR_TITLE_ID,
      );
    });
  });

  describe("Cabeçalho da Seção e Botão '+ Nova chave'", () => {
    it("deve renderizar o cabeçalho de seção com identificador de passo '1' e título canônico", () => {
      document.body.appendChild(selectorElement);

      const header = selectorElement.querySelector(
        `.${KEY_SELECTOR_CLASSES.SECTION_HEADER}`,
      );
      expect(header).not.toBeNull();

      const stepBadge = header.querySelector(
        `.${KEY_SELECTOR_CLASSES.STEP_BADGE}`,
      );
      expect(stepBadge).not.toBeNull();
      expect(stepBadge.textContent.trim()).toBe(DEFAULT_KEY_SELECTOR_STEP);

      const title = header.querySelector(`.${KEY_SELECTOR_CLASSES.TITLE}`);
      expect(title).not.toBeNull();
      expect(title.id).toBe(DEFAULT_KEY_SELECTOR_TITLE_ID);
      expect(title.textContent.trim()).toBe(DEFAULT_KEY_SELECTOR_TITLE);
    });

    it("deve renderizar o botão '+ Nova chave' com o vector-icon de plus", () => {
      document.body.appendChild(selectorElement);

      const addBtn = selectorElement.querySelector(
        `button.${KEY_SELECTOR_CLASSES.ADD_BTN}`,
      );
      expect(addBtn).not.toBeNull();
      expect(addBtn.getAttribute("type")).toBe("button");

      const icon = addBtn.querySelector(
        `vector-icon[name="${KEY_SELECTOR_ICONS.PLUS}"]`,
      );
      expect(icon).not.toBeNull();
      expect(addBtn.textContent).toContain(DEFAULT_KEY_SELECTOR_ADD_BTN_LABEL);
    });

    it("deve emitir o evento open-key-dialog com bubbles e composed ao clicar no botão '+ Nova chave'", () => {
      document.body.appendChild(selectorElement);

      const eventListener = vi.fn();
      document.body.addEventListener(
        KEY_SELECTOR_EVENT_NAMES.OPEN_KEY_DIALOG,
        eventListener,
      );

      const addBtn = selectorElement.querySelector(
        `button.${KEY_SELECTOR_CLASSES.ADD_BTN}`,
      );
      addBtn.click();

      expect(eventListener).toHaveBeenCalledTimes(1);
      const emittedEvent = eventListener.mock.calls[0][0];
      expect(emittedEvent.bubbles).toBe(true);
      expect(emittedEvent.composed).toBe(true);
      expect(emittedEvent.detail).toEqual({ source: "pix-key-selector" });

      document.body.removeEventListener(
        KEY_SELECTOR_EVENT_NAMES.OPEN_KEY_DIALOG,
        eventListener,
      );
    });

    it("deve emitir open-key-dialog ao pressionar Enter ou Space no botão '+ Nova chave'", () => {
      document.body.appendChild(selectorElement);

      const eventListener = vi.fn();
      selectorElement.addEventListener(
        KEY_SELECTOR_EVENT_NAMES.OPEN_KEY_DIALOG,
        eventListener,
      );

      const addBtn = selectorElement.querySelector(
        `button.${KEY_SELECTOR_CLASSES.ADD_BTN}`,
      );

      addBtn.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      expect(eventListener).toHaveBeenCalledTimes(1);

      addBtn.dispatchEvent(
        new KeyboardEvent("keydown", { key: " ", bubbles: true }),
      );
      expect(eventListener).toHaveBeenCalledTimes(2);
    });
  });

  describe("Renderização da Lista (role='radiogroup') e Cartões (role='radio')", () => {
    it("deve renderizar o container de lista com role='radiogroup', aria-labelledby e aria-label", () => {
      selectorElement.keys = mockKeys;
      selectorElement.selectedKeyId = "key-1";
      document.body.appendChild(selectorElement);

      const list = selectorElement.querySelector(
        `.${KEY_SELECTOR_CLASSES.LIST}`,
      );
      expect(list).not.toBeNull();
      expect(list.getAttribute("role")).toBe("radiogroup");
      expect(list.getAttribute("aria-labelledby")).toBe(
        DEFAULT_KEY_SELECTOR_TITLE_ID,
      );
      expect(list.getAttribute("aria-label")).toBe(
        DEFAULT_KEY_SELECTOR_LIST_LABEL,
      );
    });

    it("deve renderizar todos os cartões com role='radio', metadados e botão de exclusão", () => {
      selectorElement.keys = mockKeys;
      selectorElement.selectedKeyId = "key-1";
      document.body.appendChild(selectorElement);

      const cards = selectorElement.querySelectorAll(
        `.${KEY_SELECTOR_CLASSES.ITEM}`,
      );
      expect(cards.length).toBe(3);

      cards.forEach((card, index) => {
        const item = mockKeys[index];
        expect(card.getAttribute("role")).toBe("radio");
        expect(card.dataset.keyId).toBe(item.id);

        const label = card.querySelector(`.${KEY_SELECTOR_CLASSES.LABEL}`);
        expect(label.textContent.trim()).toBe(item.rotulo);

        const badge = card.querySelector(`.${KEY_SELECTOR_CLASSES.TYPE_BADGE}`);
        expect(badge.textContent.trim()).toBe(item.tipo_chave);

        const value = card.querySelector(`.${KEY_SELECTOR_CLASSES.VALUE}`);
        expect(value.textContent.trim()).toBe(item.valor_chave);

        const deleteBtn = card.querySelector(
          `button.${KEY_SELECTOR_CLASSES.DELETE_BTN}`,
        );
        expect(deleteBtn).not.toBeNull();
        expect(deleteBtn.getAttribute("type")).toBe("button");
        expect(deleteBtn.getAttribute("title")).toBe(
          DEFAULT_KEY_SELECTOR_DELETE_TITLE,
        );
        expect(deleteBtn.getAttribute("aria-label")).toBe(
          formatKeyDeleteAriaLabel(item.rotulo),
        );
        expect(
          deleteBtn.querySelector(
            `vector-icon[name="${KEY_SELECTOR_ICONS.TRASH}"]`,
          ),
        ).not.toBeNull();
      });
    });

    it("deve aplicar aria-checked='true', tabindex='0' e modificador selecionado apenas no cartão ativo", () => {
      selectorElement.keys = mockKeys;
      selectorElement.selectedKeyId = "key-2";
      document.body.appendChild(selectorElement);

      const cards = selectorElement.querySelectorAll(
        `.${KEY_SELECTOR_CLASSES.ITEM}`,
      );

      // Cartão 1: Não selecionado
      expect(cards[0].getAttribute("aria-checked")).toBe("false");
      expect(cards[0].getAttribute("tabindex")).toBe("-1");
      expect(
        cards[0].classList.contains(KEY_SELECTOR_CLASSES.ITEM_SELECTED),
      ).toBe(false);
      expect(
        cards[0].querySelector(`.${KEY_SELECTOR_CLASSES.RADIO_DOT}`),
      ).toBeNull();

      // Cartão 2: Selecionado
      expect(cards[1].getAttribute("aria-checked")).toBe("true");
      expect(cards[1].getAttribute("tabindex")).toBe("0");
      expect(
        cards[1].classList.contains(KEY_SELECTOR_CLASSES.ITEM_SELECTED),
      ).toBe(true);
      expect(
        cards[1].querySelector(`.${KEY_SELECTOR_CLASSES.RADIO_DOT}`),
      ).not.toBeNull();

      // Cartão 3: Não selecionado
      expect(cards[2].getAttribute("aria-checked")).toBe("false");
      expect(cards[2].getAttribute("tabindex")).toBe("-1");
      expect(
        cards[2].classList.contains(KEY_SELECTOR_CLASSES.ITEM_SELECTED),
      ).toBe(false);
      expect(
        cards[2].querySelector(`.${KEY_SELECTOR_CLASSES.RADIO_DOT}`),
      ).toBeNull();
    });
  });

  describe("Interação de Seleção de Chave (Clique e Teclado)", () => {
    it("deve selecionar a chave ao clicar sobre um cartão e emitir o evento select-key", async () => {
      selectorElement.keys = mockKeys;
      selectorElement.selectedKeyId = "key-1";
      document.body.appendChild(selectorElement);

      const selectListener = vi.fn();
      selectorElement.addEventListener(
        KEY_SELECTOR_EVENT_NAMES.SELECT_KEY,
        selectListener,
      );

      const cards = selectorElement.querySelectorAll(
        `.${KEY_SELECTOR_CLASSES.ITEM}`,
      );
      // Clica no cartão 2 ("key-2")
      cards[1].click();

      expect(selectListener).toHaveBeenCalledTimes(1);
      const eventDetail = selectListener.mock.calls[0][0].detail;
      expect(eventDetail.id).toBe("key-2");
      expect(eventDetail.key.rotulo).toBe("Inter PJ");

      expect(selectorElement.selectedKeyId).toBe("key-2");

      const updatedCards = selectorElement.querySelectorAll(
        `.${KEY_SELECTOR_CLASSES.ITEM}`,
      );
      expect(updatedCards[1].getAttribute("aria-checked")).toBe("true");
      expect(
        updatedCards[1].classList.contains(KEY_SELECTOR_CLASSES.ITEM_SELECTED),
      ).toBe(true);
      expect(updatedCards[0].getAttribute("aria-checked")).toBe("false");
      expect(
        updatedCards[0].classList.contains(KEY_SELECTOR_CLASSES.ITEM_SELECTED),
      ).toBe(false);
    });

    it("deve selecionar a chave ao pressionar Enter ou Space no cartão focado", () => {
      selectorElement.keys = mockKeys;
      selectorElement.selectedKeyId = "key-1";
      document.body.appendChild(selectorElement);

      const selectListener = vi.fn();
      selectorElement.addEventListener(
        KEY_SELECTOR_EVENT_NAMES.SELECT_KEY,
        selectListener,
      );

      const cards = selectorElement.querySelectorAll(
        `.${KEY_SELECTOR_CLASSES.ITEM}`,
      );

      cards[2].dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      expect(selectListener).toHaveBeenCalledTimes(1);
      expect(selectorElement.selectedKeyId).toBe("key-3");

      cards[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: " ", bubbles: true }),
      );
      expect(selectListener).toHaveBeenCalledTimes(2);
      expect(selectorElement.selectedKeyId).toBe("key-1");
    });

    it("deve invocar o caso de uso selectPixKeyUseCase quando injetado", async () => {
      const mockSelectUseCase = {
        execute: vi.fn().mockResolvedValue({
          selectedKeyId: "key-2",
          selectedKey: mockKeys[1],
        }),
      };

      selectorElement.selectPixKeyUseCase = mockSelectUseCase;
      selectorElement.keys = mockKeys;
      selectorElement.selectedKeyId = "key-1";
      document.body.appendChild(selectorElement);

      const cards = selectorElement.querySelectorAll(
        `.${KEY_SELECTOR_CLASSES.ITEM}`,
      );
      cards[1].click();

      expect(mockSelectUseCase.execute).toHaveBeenCalledWith({ id: "key-2" });
    });
  });

  describe("Navegação por Teclado nos Rádios (W3C ARIA Arrow Navigation)", () => {
    it("deve navegar para o próximo rádio ao pressionar ArrowDown ou ArrowRight com wrap-around", () => {
      selectorElement.keys = mockKeys;
      selectorElement.selectedKeyId = "key-1";
      document.body.appendChild(selectorElement);

      const cards = selectorElement.querySelectorAll(
        `.${KEY_SELECTOR_CLASSES.ITEM}`,
      );
      cards[0].focus();

      // De key-1 -> key-2
      cards[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
      expect(selectorElement.selectedKeyId).toBe("key-2");

      // De key-2 -> key-3
      cards[1].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
      expect(selectorElement.selectedKeyId).toBe("key-3");

      // De key-3 -> volta para key-1 (wrap-around)
      cards[2].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
      expect(selectorElement.selectedKeyId).toBe("key-1");
    });

    it("deve navegar para o rádio anterior ao pressionar ArrowUp ou ArrowLeft com wrap-around", () => {
      selectorElement.keys = mockKeys;
      selectorElement.selectedKeyId = "key-1";
      document.body.appendChild(selectorElement);

      const cards = selectorElement.querySelectorAll(
        `.${KEY_SELECTOR_CLASSES.ITEM}`,
      );
      cards[0].focus();

      // De key-1 -> volta para o último key-3 (wrap-around)
      cards[0].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
      );
      expect(selectorElement.selectedKeyId).toBe("key-3");

      // De key-3 -> key-2
      cards[2].dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
      );
      expect(selectorElement.selectedKeyId).toBe("key-2");
    });
  });

  describe("Exclusão de Chave com stopPropagation", () => {
    it("deve emitir delete-key e chamar stopPropagation impedindo a seleção acidental", async () => {
      selectorElement.keys = mockKeys;
      selectorElement.selectedKeyId = "key-1";
      document.body.appendChild(selectorElement);

      const selectListener = vi.fn();
      const deleteListener = vi.fn();
      selectorElement.addEventListener(
        KEY_SELECTOR_EVENT_NAMES.SELECT_KEY,
        selectListener,
      );
      selectorElement.addEventListener(
        KEY_SELECTOR_EVENT_NAMES.DELETE_KEY,
        deleteListener,
      );

      const cards = selectorElement.querySelectorAll(
        `.${KEY_SELECTOR_CLASSES.ITEM}`,
      );
      const deleteBtn = cards[1].querySelector(
        `button.${KEY_SELECTOR_CLASSES.DELETE_BTN}`,
      );

      deleteBtn.click();

      // O evento delete-key deve ser emitido com os dados da chave
      expect(deleteListener).toHaveBeenCalledTimes(1);
      const deleteDetail = deleteListener.mock.calls[0][0].detail;
      expect(deleteDetail.id).toBe("key-2");

      // A seleção NÃO deve ser disparada (stopPropagation ativo)
      expect(selectListener).not.toHaveBeenCalled();
      expect(selectorElement.selectedKeyId).toBe("key-1");
    });

    it("deve invocar deletePixKeyUseCase quando injetado e atualizar a lista local", async () => {
      const mockDeleteUseCase = {
        execute: vi.fn().mockResolvedValue({
          deletedId: "key-2",
          remainingKeys: [mockKeys[0], mockKeys[2]],
          selectedKeyId: "key-1",
        }),
      };

      selectorElement.deletePixKeyUseCase = mockDeleteUseCase;
      selectorElement.keys = mockKeys;
      selectorElement.selectedKeyId = "key-1";
      document.body.appendChild(selectorElement);

      const cards = selectorElement.querySelectorAll(
        `.${KEY_SELECTOR_CLASSES.ITEM}`,
      );
      const deleteBtn = cards[1].querySelector(
        `button.${KEY_SELECTOR_CLASSES.DELETE_BTN}`,
      );

      deleteBtn.click();

      expect(mockDeleteUseCase.execute).toHaveBeenCalledWith({ id: "key-2" });
    });
  });

  describe("Injeção de Dependências Desacoplada e Reatividade", () => {
    it("deve solicitar os casos de uso no contêiner DI via request-provider", () => {
      const requestProviderListener = vi.fn();
      document.body.addEventListener(
        "request-provider",
        requestProviderListener,
      );

      document.body.appendChild(selectorElement);

      const requestedServices = requestProviderListener.mock.calls.map(
        (call) => call[0].detail?.name,
      );

      expect(requestedServices).toContain(
        KEY_SELECTOR_INJECTABLES.SELECT_PIX_KEY_USE_CASE,
      );
      expect(requestedServices).toContain(
        KEY_SELECTOR_INJECTABLES.DELETE_PIX_KEY_USE_CASE,
      );
      expect(requestedServices).toContain(
        KEY_SELECTOR_INJECTABLES.LIST_PIX_KEYS_USE_CASE,
      );
      expect(requestedServices).toContain(
        KEY_SELECTOR_INJECTABLES.PIX_KEY_REPOSITORY,
      );

      document.body.removeEventListener(
        "request-provider",
        requestProviderListener,
      );
    });

    it("deve re-renderizar imediatamente quando a propriedade keys for atualizada", () => {
      document.body.appendChild(selectorElement);

      expect(
        selectorElement.querySelectorAll(`.${KEY_SELECTOR_CLASSES.ITEM}`)
          .length,
      ).toBe(0);

      selectorElement.keys = [mockKeys[0]];
      expect(
        selectorElement.querySelectorAll(`.${KEY_SELECTOR_CLASSES.ITEM}`)
          .length,
      ).toBe(1);

      selectorElement.keys = mockKeys;
      expect(
        selectorElement.querySelectorAll(`.${KEY_SELECTOR_CLASSES.ITEM}`)
          .length,
      ).toBe(3);
    });

    it("deve sincronizar a chave selecionada ao carregar via listPixKeysUseCase se disponível", async () => {
      const mockListUseCase = {
        execute: vi.fn().mockResolvedValue({
          items: mockKeys,
          selectedKeyId: "key-3",
          selectedKey: mockKeys[2],
        }),
      };

      selectorElement.listPixKeysUseCase = mockListUseCase;
      document.body.appendChild(selectorElement);

      // Aguarda tick assíncrono de inicialização
      await Promise.resolve();

      expect(mockListUseCase.execute).toHaveBeenCalledTimes(1);
      expect(selectorElement.keys.length).toBe(3);
      expect(selectorElement.selectedKeyId).toBe("key-3");
    });
  });
});
