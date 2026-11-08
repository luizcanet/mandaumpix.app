import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../vector-icon/vector-icon.component.js";
import {
  DEFAULT_EMPTY_STATE_ARIA_LABEL,
  DEFAULT_EMPTY_STATE_CTA,
  DEFAULT_EMPTY_STATE_DESCRIPTION,
  DEFAULT_EMPTY_STATE_TITLE,
  KEY_EMPTY_EVENT_NAMES,
  KEY_EMPTY_ICONS,
} from "./pix-key-empty.constants.js";
import PixKeyEmptyComponent from "./pix-key-empty.component.js";

describe("PixKeyEmptyComponent (TASK-05.1.2: Testes Unitários de Renderização e Eventos)", () => {
  let emptyElement;

  beforeEach(() => {
    emptyElement = document.createElement("pix-key-empty");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (emptyElement && emptyElement.isConnected) {
      emptyElement.remove();
    }
  });

  describe("Registro e Semântica do Custom Element (W3C / BEM)", () => {
    it("deve registrar o elemento customizado <pix-key-empty> no customElements registry", () => {
      expect(customElements.get("pix-key-empty")).toBe(PixKeyEmptyComponent);
    });

    it("deve aplicar as classes .key-empty-state, .card e o aria-label institucional no connectedCallback", () => {
      document.body.appendChild(emptyElement);

      expect(emptyElement.classList.contains("key-empty-state")).toBe(true);
      expect(emptyElement.classList.contains("card")).toBe(true);
      expect(emptyElement.getAttribute("aria-label")).toBe(
        DEFAULT_EMPTY_STATE_ARIA_LABEL,
      );
      expect(emptyElement.getAttribute("role")).toBe("region");
    });
  });

  describe("Renderização Padrão e Estrutura BEM (Happy Path)", () => {
    it("deve renderizar o contêiner de ícone com o vector-icon de chave", () => {
      document.body.appendChild(emptyElement);

      const iconWrapper = emptyElement.querySelector(".key-empty-state__icon");
      expect(iconWrapper).not.toBeNull();

      const keyIcon = iconWrapper.querySelector(
        `vector-icon[name="${KEY_EMPTY_ICONS.KEY}"]`,
      );
      expect(keyIcon).not.toBeNull();
    });

    it("deve renderizar o título semântico h2 com o texto padrão", () => {
      document.body.appendChild(emptyElement);

      const title = emptyElement.querySelector("h2.key-empty-state__title");
      expect(title).not.toBeNull();
      expect(title.textContent.trim()).toBe(DEFAULT_EMPTY_STATE_TITLE);
    });

    it("deve renderizar a mensagem descritiva destacando o armazenamento local", () => {
      document.body.appendChild(emptyElement);

      const description = emptyElement.querySelector(
        ".key-empty-state__description",
      );
      expect(description).not.toBeNull();
      expect(description.textContent.trim()).toBe(
        DEFAULT_EMPTY_STATE_DESCRIPTION,
      );
      expect(description.textContent).toContain("100% localmente");
    });

    it("deve renderizar o botão CTA contendo ícone de plus e o texto padrão", () => {
      document.body.appendChild(emptyElement);

      const ctaBtn = emptyElement.querySelector(
        'button[data-action="open-key-dialog"]',
      );
      expect(ctaBtn).not.toBeNull();
      expect(ctaBtn.getAttribute("type")).toBe("button");
      expect(ctaBtn.classList.contains("key-empty-state__cta")).toBe(true);
      expect(ctaBtn.classList.contains("charge-cta")).toBe(true);

      const plusIcon = ctaBtn.querySelector(
        `vector-icon[name="${KEY_EMPTY_ICONS.PLUS}"]`,
      );
      expect(plusIcon).not.toBeNull();
      expect(ctaBtn.textContent).toContain(DEFAULT_EMPTY_STATE_CTA);
    });
  });

  describe("Disparo do Evento Customizado open-key-dialog", () => {
    it("deve emitir o evento open-key-dialog com bubbles e composed ao clicar no botão CTA", () => {
      document.body.appendChild(emptyElement);

      const eventListener = vi.fn();
      document.body.addEventListener(
        KEY_EMPTY_EVENT_NAMES.OPEN_KEY_DIALOG,
        eventListener,
      );

      const ctaBtn = emptyElement.querySelector(
        'button[data-action="open-key-dialog"]',
      );
      ctaBtn.click();

      expect(eventListener).toHaveBeenCalledTimes(1);
      const emittedEvent = eventListener.mock.calls[0][0];
      expect(emittedEvent.bubbles).toBe(true);
      expect(emittedEvent.composed).toBe(true);
      expect(emittedEvent.detail).toEqual({ source: "pix-key-empty" });

      document.body.removeEventListener(
        KEY_EMPTY_EVENT_NAMES.OPEN_KEY_DIALOG,
        eventListener,
      );
    });

    it("deve emitir o evento ao invocar o método público openKeyDialog()", () => {
      document.body.appendChild(emptyElement);

      const eventListener = vi.fn();
      emptyElement.addEventListener(
        KEY_EMPTY_EVENT_NAMES.OPEN_KEY_DIALOG,
        eventListener,
      );

      emptyElement.openKeyDialog();

      expect(eventListener).toHaveBeenCalledTimes(1);
    });
  });

  describe("Navegação por Teclado e Acessibilidade (a11y)", () => {
    it("deve emitir o evento open-key-dialog ao pressionar Enter ou Space no botão CTA", () => {
      document.body.appendChild(emptyElement);

      const eventListener = vi.fn();
      emptyElement.addEventListener(
        KEY_EMPTY_EVENT_NAMES.OPEN_KEY_DIALOG,
        eventListener,
      );

      const ctaBtn = emptyElement.querySelector(
        'button[data-action="open-key-dialog"]',
      );

      ctaBtn.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      expect(eventListener).toHaveBeenCalledTimes(1);

      ctaBtn.dispatchEvent(
        new KeyboardEvent("keydown", { key: " ", bubbles: true }),
      );
      expect(eventListener).toHaveBeenCalledTimes(2);
    });

    it("não deve emitir evento para outras teclas como ArrowDown ou Escape", () => {
      document.body.appendChild(emptyElement);

      const eventListener = vi.fn();
      emptyElement.addEventListener(
        KEY_EMPTY_EVENT_NAMES.OPEN_KEY_DIALOG,
        eventListener,
      );

      const ctaBtn = emptyElement.querySelector(
        'button[data-action="open-key-dialog"]',
      );

      ctaBtn.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
      ctaBtn.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );

      expect(eventListener).not.toHaveBeenCalled();
    });
  });

  describe("Reatividade e Parametrização via Atributos Observados", () => {
    it("deve atualizar o título quando o atributo title-text for modificado", () => {
      document.body.appendChild(emptyElement);

      emptyElement.setAttribute("title-text", "Adicione sua Chave Agora");

      const title = emptyElement.querySelector("h2.key-empty-state__title");
      expect(title.textContent.trim()).toBe("Adicione sua Chave Agora");
      expect(emptyElement.titleText).toBe("Adicione sua Chave Agora");
    });

    it("deve atualizar a descrição quando o atributo description-text for modificado", () => {
      document.body.appendChild(emptyElement);

      emptyElement.setAttribute(
        "description-text",
        "Armazenamento offline seguro.",
      );

      const description = emptyElement.querySelector(
        ".key-empty-state__description",
      );
      expect(description.textContent.trim()).toBe(
        "Armazenamento offline seguro.",
      );
      expect(emptyElement.descriptionText).toBe(
        "Armazenamento offline seguro.",
      );
    });

    it("deve atualizar o texto do botão CTA quando o atributo cta-text for modificado", () => {
      document.body.appendChild(emptyElement);

      emptyElement.setAttribute("cta-text", "Criar Nova Chave");

      const ctaBtn = emptyElement.querySelector(
        'button[data-action="open-key-dialog"]',
      );
      expect(ctaBtn.textContent).toContain("Criar Nova Chave");
      expect(emptyElement.ctaText).toBe("Criar Nova Chave");
    });

    it("deve atualizar a visualização ao alterar as propriedades diretamente via setters", () => {
      document.body.appendChild(emptyElement);

      emptyElement.titleText = "Novo Título";
      emptyElement.descriptionText = "Nova Descrição";
      emptyElement.ctaText = "Novo CTA";

      expect(
        emptyElement
          .querySelector("h2.key-empty-state__title")
          .textContent.trim(),
      ).toBe("Novo Título");
      expect(
        emptyElement
          .querySelector(".key-empty-state__description")
          .textContent.trim(),
      ).toBe("Nova Descrição");
      expect(
        emptyElement.querySelector('button[data-action="open-key-dialog"]')
          .textContent,
      ).toContain("Novo CTA");
    });
  });
});
