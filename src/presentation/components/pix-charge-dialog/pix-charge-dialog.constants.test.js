import { describe, expect, it } from "vitest";
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

describe("pix-charge-dialog.constants (TASK-07.4.1)", () => {
  describe("Imutabilidade dos objetos de configuração (Object.freeze)", () => {
    it("deve garantir que CHARGE_DIALOG_EVENT_NAMES seja congelado", () => {
      expect(Object.isFrozen(CHARGE_DIALOG_EVENT_NAMES)).toBe(true);
    });

    it("deve garantir que CHARGE_DIALOG_ICONS seja congelado", () => {
      expect(Object.isFrozen(CHARGE_DIALOG_ICONS)).toBe(true);
    });

    it("deve garantir que CHARGE_DIALOG_CLASSES seja congelado", () => {
      expect(Object.isFrozen(CHARGE_DIALOG_CLASSES)).toBe(true);
    });

    it("deve garantir que CHARGE_DIALOG_SELECTORS seja congelado", () => {
      expect(Object.isFrozen(CHARGE_DIALOG_SELECTORS)).toBe(true);
    });

    it("deve garantir que CHARGE_DIALOG_INJECTABLES seja congelado", () => {
      expect(Object.isFrozen(CHARGE_DIALOG_INJECTABLES)).toBe(true);
    });
  });

  describe("Valores padrão dos textos e acessibilidade W3C ARIA", () => {
    it("deve definir o título padrão da caixa de diálogo", () => {
      expect(DEFAULT_CHARGE_DIALOG_TITLE).toBe("Cobrança PIX Gerada");
    });

    it("deve definir o ID semântico do cabeçalho para aria-labelledby", () => {
      expect(DEFAULT_CHARGE_DIALOG_TITLE_ID).toBe("charge-dialog-title");
    });

    it("deve definir o título/tooltip de acessibilidade do botão fechar", () => {
      expect(DEFAULT_CHARGE_DIALOG_CLOSE_TITLE).toBe(
        "Fechar diálogo de cobrança",
      );
    });

    it("deve definir o aria-label padrão da caixa de diálogo", () => {
      expect(DEFAULT_CHARGE_DIALOG_ARIA_LABEL).toBe(
        "Resultado da cobrança PIX",
      );
    });

    it("deve definir o rótulo do botão de conclusão/fechamento inferior", () => {
      expect(DEFAULT_CHARGE_DIALOG_DISMISS_BTN_LABEL).toBe(
        "Concluir e fechar diálogo",
      );
    });
  });

  describe("Nomes canônicos de eventos customizados", () => {
    it("deve mapear os eventos de abertura e fechamento do diálogo", () => {
      expect(CHARGE_DIALOG_EVENT_NAMES.OPEN_CHARGE_DIALOG).toBe(
        "open-charge-dialog",
      );
      expect(CHARGE_DIALOG_EVENT_NAMES.CLOSE_CHARGE_DIALOG).toBe(
        "close-charge-dialog",
      );
      expect(CHARGE_DIALOG_EVENT_NAMES.CHARGE_DIALOG_OPENED).toBe(
        "charge-dialog-opened",
      );
      expect(CHARGE_DIALOG_EVENT_NAMES.CHARGE_DIALOG_CLOSED).toBe(
        "charge-dialog-closed",
      );
      expect(CHARGE_DIALOG_EVENT_NAMES.CHARGE_GENERATED).toBe(
        "charge-generated",
      );
    });
  });

  describe("Identificadores de ícones vetoriais (<vector-icon>)", () => {
    it("deve mapear os ícones check, xmark e qrcode", () => {
      expect(CHARGE_DIALOG_ICONS.CHECK).toBe("check");
      expect(CHARGE_DIALOG_ICONS.XMARK).toBe("xmark");
      expect(CHARGE_DIALOG_ICONS.QRCODE).toBe("qrcode");
    });
  });

  describe("Classes BEM e Seletores CSS", () => {
    it("deve definir as classes BEM padronizadas", () => {
      expect(CHARGE_DIALOG_CLASSES.ROOT).toBe("charge-dialog");
      expect(CHARGE_DIALOG_CLASSES.BACKDROP).toBe("charge-dialog-backdrop");
      expect(CHARGE_DIALOG_CLASSES.TOP_BAR).toBe("charge-dialog__top-bar");
      expect(CHARGE_DIALOG_CLASSES.TITLE).toBe("charge-dialog__title");
      expect(CHARGE_DIALOG_CLASSES.CLOSE_BTN).toBe("charge-dialog__close-btn");
      expect(CHARGE_DIALOG_CLASSES.BODY).toBe("charge-dialog__body");
      expect(CHARGE_DIALOG_CLASSES.DISMISS_BTN).toBe(
        "charge-dialog__dismiss-btn",
      );
      expect(CHARGE_DIALOG_CLASSES.HIDDEN).toBe("hidden");
      expect(CHARGE_DIALOG_CLASSES.VISIBLE).toBe("charge-dialog--visible");
    });

    it("deve mapear os seletores CSS correspondentes às classes BEM", () => {
      expect(CHARGE_DIALOG_SELECTORS.ROOT).toBe(".charge-dialog");
      expect(CHARGE_DIALOG_SELECTORS.BACKDROP).toBe(".charge-dialog-backdrop");
      expect(CHARGE_DIALOG_SELECTORS.TOP_BAR).toBe(".charge-dialog__top-bar");
      expect(CHARGE_DIALOG_SELECTORS.TITLE).toBe(".charge-dialog__title");
      expect(CHARGE_DIALOG_SELECTORS.CLOSE_BTN).toBe(
        ".charge-dialog__close-btn",
      );
      expect(CHARGE_DIALOG_SELECTORS.BODY).toBe(".charge-dialog__body");
      expect(CHARGE_DIALOG_SELECTORS.DISMISS_BTN).toBe(
        ".charge-dialog__dismiss-btn",
      );
      expect(CHARGE_DIALOG_SELECTORS.DIALOG_ELEMENT).toBe(
        "dialog.charge-dialog",
      );
      expect(CHARGE_DIALOG_SELECTORS.CHARGE_RESULT).toBe("pix-charge-result");
    });
  });

  describe("Injeção de dependências (SetInjectable)", () => {
    it("deve mapear as chaves de injeção dos casos de uso de geração e distribuição", () => {
      expect(CHARGE_DIALOG_INJECTABLES.GENERATE_PIX_CHARGE_USE_CASE).toBe(
        "generate-pix-charge-use-case",
      );
      expect(CHARGE_DIALOG_INJECTABLES.DISTRIBUTE_PIX_CHARGE_USE_CASE).toBe(
        "distribute-pix-charge-use-case",
      );
    });
  });
});
