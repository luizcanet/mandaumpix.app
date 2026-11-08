import { describe, expect, it } from "vitest";
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

describe("pix-key-selector.constants", () => {
  describe("Imutabilidade dos objetos", () => {
    it("deve garantir que KEY_SELECTOR_EVENT_NAMES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_SELECTOR_EVENT_NAMES)).toBe(true);
    });

    it("deve garantir que KEY_SELECTOR_ICONS seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_SELECTOR_ICONS)).toBe(true);
    });

    it("deve garantir que KEY_SELECTOR_CLASSES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_SELECTOR_CLASSES)).toBe(true);
    });

    it("deve garantir que KEY_SELECTOR_INJECTABLES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_SELECTOR_INJECTABLES)).toBe(true);
    });
  });

  describe("Valores padrão dos textos e acessibilidade", () => {
    it("deve definir o identificador numérico de passo como 1", () => {
      expect(DEFAULT_KEY_SELECTOR_STEP).toBe("1");
    });

    it("deve definir o título padrão da seção de chaves", () => {
      expect(DEFAULT_KEY_SELECTOR_TITLE).toBe("Chave para recebimento");
    });

    it("deve definir o ID de cabeçalho padrão para aria-labelledby", () => {
      expect(DEFAULT_KEY_SELECTOR_TITLE_ID).toBe("key-selector-title");
    });

    it("deve definir o rótulo do botão de adicionar nova chave", () => {
      expect(DEFAULT_KEY_SELECTOR_ADD_BTN_LABEL).toBe("Nova chave");
    });

    it("deve definir o rótulo acessível da lista de cartões (radiogroup)", () => {
      expect(DEFAULT_KEY_SELECTOR_LIST_LABEL).toBe("Chaves PIX cadastradas");
    });

    it("deve definir o título padrão de remoção de chave", () => {
      expect(DEFAULT_KEY_SELECTOR_DELETE_TITLE).toBe("Remover chave");
    });

    it("deve formatar o aria-label de remoção de chave com o rótulo informado", () => {
      expect(formatKeyDeleteAriaLabel("Nubank Pessoal")).toBe(
        "Remover chave Nubank Pessoal",
      );
    });

    it("deve formatar o aria-label de remoção com fallback seguro quando rótulo for omitido ou vazio", () => {
      expect(formatKeyDeleteAriaLabel("")).toBe("Remover chave PIX");
      expect(formatKeyDeleteAriaLabel(null)).toBe("Remover chave PIX");
      expect(formatKeyDeleteAriaLabel(undefined)).toBe("Remover chave PIX");
    });
  });

  describe("Eventos, Ícones e Injetáveis", () => {
    it("deve definir os nomes canônicos dos eventos customizados", () => {
      expect(KEY_SELECTOR_EVENT_NAMES.OPEN_KEY_DIALOG).toBe("open-key-dialog");
      expect(KEY_SELECTOR_EVENT_NAMES.SELECT_KEY).toBe("select-key");
      expect(KEY_SELECTOR_EVENT_NAMES.DELETE_KEY).toBe("delete-key");
    });

    it("deve definir os nomes dos ícones consumidos", () => {
      expect(KEY_SELECTOR_ICONS.PLUS).toBe("plus");
      expect(KEY_SELECTOR_ICONS.TRASH).toBe("trash");
      expect(KEY_SELECTOR_ICONS.KEY).toBe("key");
    });

    it("deve definir os nomes canônicos de serviços do contêiner DI", () => {
      expect(KEY_SELECTOR_INJECTABLES.SELECT_PIX_KEY_USE_CASE).toBe(
        "select-pix-key-use-case",
      );
      expect(KEY_SELECTOR_INJECTABLES.DELETE_PIX_KEY_USE_CASE).toBe(
        "delete-pix-key-use-case",
      );
      expect(KEY_SELECTOR_INJECTABLES.LIST_PIX_KEYS_USE_CASE).toBe(
        "list-pix-keys-use-case",
      );
      expect(KEY_SELECTOR_INJECTABLES.PIX_KEY_REPOSITORY).toBe(
        "pix-key-repository",
      );
    });
  });

  describe("Classes BEM", () => {
    it("deve mapear todas as classes da estrutura BEM do componente", () => {
      expect(KEY_SELECTOR_CLASSES.ROOT).toBe("key-selector");
      expect(KEY_SELECTOR_CLASSES.CARD).toBe("card");
      expect(KEY_SELECTOR_CLASSES.SECTION_HEADER).toBe("section-header");
      expect(KEY_SELECTOR_CLASSES.HEADER_TITLE_GROUP).toBe(
        "section-header__title-group",
      );
      expect(KEY_SELECTOR_CLASSES.STEP_BADGE).toBe("step-badge");
      expect(KEY_SELECTOR_CLASSES.TITLE).toBe("section-header__title");
      expect(KEY_SELECTOR_CLASSES.ADD_BTN).toBe("key-selector__add-btn");
      expect(KEY_SELECTOR_CLASSES.LIST).toBe("key-selector__list");
      expect(KEY_SELECTOR_CLASSES.ITEM).toBe("key-selector__card");
      expect(KEY_SELECTOR_CLASSES.ITEM_SELECTED).toBe(
        "key-selector__card--selected",
      );
      expect(KEY_SELECTOR_CLASSES.CARD_LEFT).toBe("key-selector__card-left");
      expect(KEY_SELECTOR_CLASSES.RADIO).toBe("key-selector__radio");
      expect(KEY_SELECTOR_CLASSES.RADIO_DOT).toBe("key-selector__radio-dot");
      expect(KEY_SELECTOR_CLASSES.META).toBe("key-selector__meta");
      expect(KEY_SELECTOR_CLASSES.TITLE_ROW).toBe("key-selector__title-row");
      expect(KEY_SELECTOR_CLASSES.LABEL).toBe("key-selector__label");
      expect(KEY_SELECTOR_CLASSES.TYPE_BADGE).toBe("key-selector__type-badge");
      expect(KEY_SELECTOR_CLASSES.VALUE).toBe("key-selector__value");
      expect(KEY_SELECTOR_CLASSES.DELETE_BTN).toBe("key-selector__delete-btn");
    });
  });
});
