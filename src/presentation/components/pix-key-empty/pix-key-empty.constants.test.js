import { describe, expect, it } from "vitest";
import {
  DEFAULT_EMPTY_STATE_ARIA_LABEL,
  DEFAULT_EMPTY_STATE_CTA,
  DEFAULT_EMPTY_STATE_DESCRIPTION,
  DEFAULT_EMPTY_STATE_TITLE,
  KEY_EMPTY_EVENT_NAMES,
  KEY_EMPTY_ICONS,
} from "./pix-key-empty.constants.js";

describe("pix-key-empty.constants", () => {
  describe("Imutabilidade dos objetos", () => {
    it("deve garantir que KEY_EMPTY_EVENT_NAMES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_EMPTY_EVENT_NAMES)).toBe(true);
    });

    it("deve garantir que KEY_EMPTY_ICONS seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_EMPTY_ICONS)).toBe(true);
    });
  });

  describe("Valores padrão dos textos", () => {
    it("deve definir o título padrão correto para o estado vazio", () => {
      expect(DEFAULT_EMPTY_STATE_TITLE).toBe("Cadastre sua primeira chave PIX");
    });

    it("deve definir a mensagem descritiva enfatizando o armazenamento local", () => {
      expect(DEFAULT_EMPTY_STATE_DESCRIPTION).toContain("100% localmente");
      expect(DEFAULT_EMPTY_STATE_DESCRIPTION).toContain("neste aparelho");
    });

    it("deve definir o rótulo do CTA para adicionar a primeira chave", () => {
      expect(DEFAULT_EMPTY_STATE_CTA).toBe("Adicionar Minha Primeira Chave");
    });

    it("deve definir o rótulo acessível aria-label padrão para a seção", () => {
      expect(DEFAULT_EMPTY_STATE_ARIA_LABEL).toBe("Primeiro acesso sem chaves");
    });
  });

  describe("Eventos e Ícones", () => {
    it("deve definir o evento open-key-dialog", () => {
      expect(KEY_EMPTY_EVENT_NAMES.OPEN_KEY_DIALOG).toBe("open-key-dialog");
    });

    it("deve referenciar os ícones key e plus", () => {
      expect(KEY_EMPTY_ICONS.KEY).toBe("key");
      expect(KEY_EMPTY_ICONS.PLUS).toBe("plus");
    });
  });
});
