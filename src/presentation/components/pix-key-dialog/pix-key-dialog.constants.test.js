import { describe, expect, it } from "vitest";
import { PIX_KEY_TYPES } from "../../../domain/entities/pix-key.entity.js";
import {
  DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL,
  DEFAULT_KEY_DIALOG_CLOSE_TITLE,
  DEFAULT_KEY_DIALOG_FIELD_LABELS,
  DEFAULT_KEY_DIALOG_INITIAL_TYPE,
  DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL,
  DEFAULT_KEY_DIALOG_TITLE,
  DEFAULT_KEY_DIALOG_TITLE_ID,
  KEY_DIALOG_CLASSES,
  KEY_DIALOG_EVENT_NAMES,
  KEY_DIALOG_FIELD_LABELS,
  KEY_DIALOG_ICONS,
  KEY_DIALOG_INJECTABLES,
  KEY_DIALOG_MAX_LENGTHS,
  KEY_DIALOG_TYPES_CONFIG,
  getKeyTypeConfig,
} from "./pix-key-dialog.constants.js";

describe("pix-key-dialog.constants", () => {
  describe("Imutabilidade dos objetos", () => {
    it("deve garantir que KEY_DIALOG_EVENT_NAMES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_DIALOG_EVENT_NAMES)).toBe(true);
    });

    it("deve garantir que KEY_DIALOG_ICONS seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_DIALOG_ICONS)).toBe(true);
    });

    it("deve garantir que KEY_DIALOG_CLASSES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_DIALOG_CLASSES)).toBe(true);
    });

    it("deve garantir que KEY_DIALOG_INJECTABLES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_DIALOG_INJECTABLES)).toBe(true);
    });

    it("deve garantir que KEY_DIALOG_FIELD_LABELS seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_DIALOG_FIELD_LABELS)).toBe(true);
    });

    it("deve garantir que KEY_DIALOG_MAX_LENGTHS seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(KEY_DIALOG_MAX_LENGTHS)).toBe(true);
    });

    it("deve garantir que KEY_DIALOG_TYPES_CONFIG e seus itens sejam congelados com Object.freeze", () => {
      expect(Object.isFrozen(KEY_DIALOG_TYPES_CONFIG)).toBe(true);
      KEY_DIALOG_TYPES_CONFIG.forEach((cfg) => {
        expect(Object.isFrozen(cfg)).toBe(true);
      });
    });
  });

  describe("Valores padrão dos textos e acessibilidade", () => {
    it("deve definir o título padrão do modal de cadastro", () => {
      expect(DEFAULT_KEY_DIALOG_TITLE).toBe("Cadastrar chave PIX");
    });

    it("deve definir o ID de cabeçalho padrão para aria-labelledby", () => {
      expect(DEFAULT_KEY_DIALOG_TITLE_ID).toBe("key-dialog-title");
    });

    it("deve definir o tipo inicial como CPF", () => {
      expect(DEFAULT_KEY_DIALOG_INITIAL_TYPE).toBe(PIX_KEY_TYPES.CPF);
    });

    it("deve definir o rótulo padrão do botão de salvar", () => {
      expect(DEFAULT_KEY_DIALOG_SAVE_BTN_LABEL).toBe("Salvar Chave");
    });

    it("deve definir o rótulo padrão do botão de cancelar", () => {
      expect(DEFAULT_KEY_DIALOG_CANCEL_BTN_LABEL).toBe("Cancelar");
    });

    it("deve definir o título de fechamento de janela", () => {
      expect(DEFAULT_KEY_DIALOG_CLOSE_TITLE).toBe("Fechar janela");
    });

    it("deve definir rótulos e placeholders padrão para os campos", () => {
      expect(DEFAULT_KEY_DIALOG_FIELD_LABELS.ACCOUNT_LABEL).toBe(
        "Apelido da conta (opcional)",
      );
      expect(DEFAULT_KEY_DIALOG_FIELD_LABELS.ACCOUNT_LABEL_PLACEHOLDER).toBe(
        "Ex: Nubank Pessoal",
      );
      expect(DEFAULT_KEY_DIALOG_FIELD_LABELS.KEY_VALUE).toBe("Chave PIX");
      expect(DEFAULT_KEY_DIALOG_FIELD_LABELS.MERCHANT_NAME).toBe(
        "Nome do titular",
      );
      expect(DEFAULT_KEY_DIALOG_FIELD_LABELS.MERCHANT_NAME_PLACEHOLDER).toBe(
        "Ex: Luiz Canet",
      );
      expect(DEFAULT_KEY_DIALOG_FIELD_LABELS.MERCHANT_CITY).toBe("Cidade");
      expect(DEFAULT_KEY_DIALOG_FIELD_LABELS.MERCHANT_CITY_PLACEHOLDER).toBe(
        "Ex: Brasilia",
      );
    });

    it("deve definir limites máximos de comprimento de campo", () => {
      expect(KEY_DIALOG_MAX_LENGTHS.ACCOUNT_LABEL).toBe(40);
      expect(KEY_DIALOG_MAX_LENGTHS.MERCHANT_NAME).toBe(25);
      expect(KEY_DIALOG_MAX_LENGTHS.MERCHANT_CITY).toBe(15);
      expect(KEY_DIALOG_MAX_LENGTHS.CPF).toBe(14);
      expect(KEY_DIALOG_MAX_LENGTHS.CNPJ).toBe(18);
      expect(KEY_DIALOG_MAX_LENGTHS.EMAIL).toBe(77);
      expect(KEY_DIALOG_MAX_LENGTHS.TELEFONE).toBe(20);
      expect(KEY_DIALOG_MAX_LENGTHS.EVP).toBe(36);
    });
  });

  describe("Eventos, Ícones e Injetáveis", () => {
    it("deve definir os nomes canônicos dos eventos customizados", () => {
      expect(KEY_DIALOG_EVENT_NAMES.OPEN_KEY_DIALOG).toBe("open-key-dialog");
      expect(KEY_DIALOG_EVENT_NAMES.CLOSE_KEY_DIALOG).toBe("close-key-dialog");
      expect(KEY_DIALOG_EVENT_NAMES.KEY_SAVED).toBe("key-saved");
    });

    it("deve definir os ícones vetoriais consumidos via vector-icon", () => {
      expect(KEY_DIALOG_ICONS.CHECK).toBe("check");
      expect(KEY_DIALOG_ICONS.XMARK).toBe("xmark");
      expect(KEY_DIALOG_ICONS.CIRCLE_EXCLAMATION).toBe("circle-exclamation");
      expect(KEY_DIALOG_ICONS.KEY).toBe("key");
    });

    it("deve definir os nomes canônicos dos serviços injetáveis", () => {
      expect(KEY_DIALOG_INJECTABLES.SAVE_PIX_KEY_USE_CASE).toBe(
        "save-pix-key-use-case",
      );
      expect(KEY_DIALOG_INJECTABLES.PIX_KEY_REPOSITORY).toBe(
        "pix-key-repository",
      );
    });

    it("deve mapear classes BEM canônicas", () => {
      expect(KEY_DIALOG_CLASSES.ROOT).toBe("key-dialog");
      expect(KEY_DIALOG_CLASSES.BACKDROP).toBe("key-dialog-backdrop");
      expect(KEY_DIALOG_CLASSES.HEADER).toBe("key-dialog__header");
      expect(KEY_DIALOG_CLASSES.TITLE).toBe("key-dialog__title");
      expect(KEY_DIALOG_CLASSES.CLOSE_BTN).toBe("key-dialog__close-btn");
      expect(KEY_DIALOG_CLASSES.FORM).toBe("key-dialog__form");
      expect(KEY_DIALOG_CLASSES.TYPES).toBe("key-dialog__types");
      expect(KEY_DIALOG_CLASSES.TYPE_BTN).toBe("key-dialog__type-btn");
      expect(KEY_DIALOG_CLASSES.TYPE_BTN_ACTIVE).toBe(
        "key-dialog__type-btn--active",
      );
      expect(KEY_DIALOG_CLASSES.ALERT).toBe("key-dialog__alert");
      expect(KEY_DIALOG_CLASSES.ALERT_ICON).toBe("key-dialog__alert-icon");
      expect(KEY_DIALOG_CLASSES.ALERT_TEXT).toBe("key-dialog__alert-text");
      expect(KEY_DIALOG_CLASSES.FIELD).toBe("key-dialog__field");
      expect(KEY_DIALOG_CLASSES.ROW).toBe("key-dialog__row");
      expect(KEY_DIALOG_CLASSES.LABEL).toBe("key-dialog__label");
      expect(KEY_DIALOG_CLASSES.INPUT).toBe("key-dialog__input");
      expect(KEY_DIALOG_CLASSES.INPUT_ERROR).toBe("key-dialog__input--error");
      expect(KEY_DIALOG_CLASSES.ACTIONS).toBe("key-dialog__actions");
      expect(KEY_DIALOG_CLASSES.BTN_CANCEL).toBe("key-dialog__btn-cancel");
      expect(KEY_DIALOG_CLASSES.BTN_SAVE).toBe("key-dialog__btn-save");
    });
  });

  describe("Configuração de tipos e função auxiliar getKeyTypeConfig", () => {
    it("deve conter exatamente os 5 tipos canônicos de chave PIX", () => {
      expect(KEY_DIALOG_TYPES_CONFIG).toHaveLength(5);
      const types = KEY_DIALOG_TYPES_CONFIG.map((item) => item.type);
      expect(types).toEqual([
        PIX_KEY_TYPES.CPF,
        PIX_KEY_TYPES.CNPJ,
        PIX_KEY_TYPES.EMAIL,
        PIX_KEY_TYPES.TELEFONE,
        PIX_KEY_TYPES.EVP,
      ]);
    });

    it("deve retornar a configuração correta para cada tipo de chave", () => {
      const cpfConfig = getKeyTypeConfig(PIX_KEY_TYPES.CPF);
      expect(cpfConfig.type).toBe(PIX_KEY_TYPES.CPF);
      expect(cpfConfig.placeholder).toBe("000.000.000-00");
      expect(cpfConfig.inputMode).toBe("numeric");

      const emailConfig = getKeyTypeConfig(PIX_KEY_TYPES.EMAIL);
      expect(emailConfig.type).toBe(PIX_KEY_TYPES.EMAIL);
      expect(emailConfig.placeholder).toBe("seu.email@exemplo.com");
      expect(emailConfig.inputMode).toBe("email");
      expect(emailConfig.typeAttr).toBe("email");

      const telConfig = getKeyTypeConfig("telefone");
      expect(telConfig.type).toBe(PIX_KEY_TYPES.TELEFONE);
      expect(telConfig.inputMode).toBe("tel");

      const cnpjConfig = getKeyTypeConfig("cnpj");
      expect(cnpjConfig.type).toBe(PIX_KEY_TYPES.CNPJ);
      expect(cnpjConfig.inputMode).toBe("numeric");

      const evpConfig = getKeyTypeConfig("evp");
      expect(evpConfig.type).toBe(PIX_KEY_TYPES.EVP);
      expect(evpConfig.placeholder).toBe(
        "123e4567-e89b-12d3-a456-426614174000",
      );
    });

    it("deve retornar a configuração padrão de CPF em caso de tipo desconhecido, vazio ou inválido", () => {
      const fallbackUnknown = getKeyTypeConfig("DESCONHECIDO");
      expect(fallbackUnknown.type).toBe(PIX_KEY_TYPES.CPF);

      const fallbackEmpty = getKeyTypeConfig("");
      expect(fallbackEmpty.type).toBe(PIX_KEY_TYPES.CPF);

      const fallbackNull = getKeyTypeConfig(null);
      expect(fallbackNull.type).toBe(PIX_KEY_TYPES.CPF);

      const fallbackUndefined = getKeyTypeConfig(undefined);
      expect(fallbackUndefined.type).toBe(PIX_KEY_TYPES.CPF);
    });
  });
});
