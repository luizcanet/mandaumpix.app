import { describe, expect, it } from "vitest";
import {
  CHARGE_FORM_CLASSES,
  CHARGE_FORM_EVENT_NAMES,
  CHARGE_FORM_ICONS,
  CHARGE_FORM_INJECTABLES,
  CHARGE_FORM_PRESETS,
  DEFAULT_CHARGE_FORM_CLEAR_LABEL,
  DEFAULT_CHARGE_FORM_CTA_DISABLED_TITLE,
  DEFAULT_CHARGE_FORM_CTA_LABEL,
  DEFAULT_CHARGE_FORM_CURRENCY,
  DEFAULT_CHARGE_FORM_INPUT_ID,
  DEFAULT_CHARGE_FORM_OPTIONAL_BADGE,
  DEFAULT_CHARGE_FORM_PLACEHOLDER,
  DEFAULT_CHARGE_FORM_STATUS_FIXED_PREFIX,
  DEFAULT_CHARGE_FORM_STATUS_OPEN,
  DEFAULT_CHARGE_FORM_STEP,
  DEFAULT_CHARGE_FORM_TITLE,
  DEFAULT_CHARGE_FORM_TITLE_ID,
  formatFixedAmountStatus,
  parseChargeAmount,
  resolveCtaTooltip,
} from "./pix-charge-form.constants.js";

describe("pix-charge-form.constants", () => {
  describe("Imutabilidade dos objetos e coleções", () => {
    it("deve garantir que CHARGE_FORM_EVENT_NAMES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(CHARGE_FORM_EVENT_NAMES)).toBe(true);
    });

    it("deve garantir que CHARGE_FORM_ICONS seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(CHARGE_FORM_ICONS)).toBe(true);
    });

    it("deve garantir que CHARGE_FORM_CLASSES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(CHARGE_FORM_CLASSES)).toBe(true);
    });

    it("deve garantir que CHARGE_FORM_INJECTABLES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(CHARGE_FORM_INJECTABLES)).toBe(true);
    });

    it("deve garantir que CHARGE_FORM_PRESETS e cada um dos seus itens sejam congelados", () => {
      expect(Object.isFrozen(CHARGE_FORM_PRESETS)).toBe(true);
      CHARGE_FORM_PRESETS.forEach((preset) => {
        expect(Object.isFrozen(preset)).toBe(true);
      });
    });
  });

  describe("Valores padrão dos textos e acessibilidade", () => {
    it("deve definir o identificador numérico de passo como 2", () => {
      expect(DEFAULT_CHARGE_FORM_STEP).toBe("2");
    });

    it("deve definir o título padrão do campo de valor da cobrança", () => {
      expect(DEFAULT_CHARGE_FORM_TITLE).toBe("Valor da cobrança");
    });

    it("deve definir o ID de cabeçalho padrão para aria-labelledby", () => {
      expect(DEFAULT_CHARGE_FORM_TITLE_ID).toBe("charge-amount-label");
    });

    it("deve definir o ID do campo input monetário", () => {
      expect(DEFAULT_CHARGE_FORM_INPUT_ID).toBe("charge-amount");
    });

    it("deve definir o rótulo da badge de campo opcional", () => {
      expect(DEFAULT_CHARGE_FORM_OPTIONAL_BADGE).toBe("Opcional");
    });

    it("deve definir o placeholder monetário padrão", () => {
      expect(DEFAULT_CHARGE_FORM_PLACEHOLDER).toBe("0,00 (Valor aberto)");
    });

    it("deve definir o prefixo da moeda brasileira como R$", () => {
      expect(DEFAULT_CHARGE_FORM_CURRENCY).toBe("R$");
    });

    it("deve definir o rótulo do botão de limpeza rápida", () => {
      expect(DEFAULT_CHARGE_FORM_CLEAR_LABEL).toBe(
        "Limpar e manter valor aberto",
      );
    });

    it("deve definir o rótulo padrão do botão CTA", () => {
      expect(DEFAULT_CHARGE_FORM_CTA_LABEL).toBe("Manda um PIX");
    });

    it("deve definir o tooltip descritivo do CTA quando desabilitado", () => {
      expect(DEFAULT_CHARGE_FORM_CTA_DISABLED_TITLE).toBe(
        "Selecione ou cadastre uma chave PIX para gerar a cobrança",
      );
    });

    it("deve definir o texto de status para valor aberto", () => {
      expect(DEFAULT_CHARGE_FORM_STATUS_OPEN).toBe(
        "Valor aberto (pagador define)",
      );
    });

    it("deve definir o prefixo de status para valor fixo", () => {
      expect(DEFAULT_CHARGE_FORM_STATUS_FIXED_PREFIX).toBe("Valor fixo: R$ ");
    });
  });

  describe("Atalhos rápidos predefinidos (Presets)", () => {
    it("deve disponibilizar 3 opções de presets de valor", () => {
      expect(CHARGE_FORM_PRESETS).toHaveLength(3);
    });

    it("deve configurar o preset de valor aberto corretamente", () => {
      const openPreset = CHARGE_FORM_PRESETS.find((p) => p.id === "open");
      expect(openPreset).toBeDefined();
      expect(openPreset.label).toBe("Aberto");
      expect(openPreset.value).toBe("");
      expect(openPreset.ariaLabel).toBe(
        "Definir valor aberto (pagador define)",
      );
    });

    it("deve configurar o preset de R$ 25 corretamente", () => {
      const preset25 = CHARGE_FORM_PRESETS.find((p) => p.id === "25");
      expect(preset25).toBeDefined();
      expect(preset25.label).toBe("R$ 25");
      expect(preset25.value).toBe("25,00");
      expect(preset25.ariaLabel).toBe("Definir valor fixo de R$ 25,00");
    });

    it("deve configurar o preset de R$ 50 corretamente", () => {
      const preset50 = CHARGE_FORM_PRESETS.find((p) => p.id === "50");
      expect(preset50).toBeDefined();
      expect(preset50.label).toBe("R$ 50");
      expect(preset50.value).toBe("50,00");
      expect(preset50.ariaLabel).toBe("Definir valor fixo de R$ 50,00");
    });
  });

  describe("Eventos, Ícones e Injetáveis", () => {
    it("deve definir os nomes canônicos dos eventos customizados", () => {
      expect(CHARGE_FORM_EVENT_NAMES.CHARGE_GENERATED).toBe("charge-generated");
      expect(CHARGE_FORM_EVENT_NAMES.AMOUNT_CHANGED).toBe(
        "charge-amount-changed",
      );
      expect(CHARGE_FORM_EVENT_NAMES.OPEN_KEY_DIALOG).toBe("open-key-dialog");
    });

    it("deve definir os nomes dos ícones consumidos via <vector-icon>", () => {
      expect(CHARGE_FORM_ICONS.QRCODE).toBe("qrcode");
      expect(CHARGE_FORM_ICONS.XMARK).toBe("xmark");
      expect(CHARGE_FORM_ICONS.ALERT).toBe("circle-exclamation");
    });

    it("deve definir os identificadores de serviços injetáveis no contêiner DI", () => {
      expect(CHARGE_FORM_INJECTABLES.GENERATE_PIX_CHARGE_USE_CASE).toBe(
        "generate-pix-charge-use-case",
      );
      expect(CHARGE_FORM_INJECTABLES.PIX_KEY_REPOSITORY).toBe(
        "pix-key-repository",
      );
    });
  });

  describe("Mapeamento de Classes BEM (CHARGE_FORM_CLASSES)", () => {
    it("deve mapear os seletores de bloco e elementos principais", () => {
      expect(CHARGE_FORM_CLASSES.ROOT).toBe("charge-form");
      expect(CHARGE_FORM_CLASSES.CARD).toBe("card");
      expect(CHARGE_FORM_CLASSES.AMOUNT_FIELD).toBe("amount-field");
      expect(CHARGE_FORM_CLASSES.SECTION_HEADER).toBe("section-header");
      expect(CHARGE_FORM_CLASSES.HEADER_TITLE_GROUP).toBe(
        "section-header__title-group",
      );
      expect(CHARGE_FORM_CLASSES.STEP_BADGE).toBe("step-badge");
      expect(CHARGE_FORM_CLASSES.TITLE).toBe("section-header__title");
      expect(CHARGE_FORM_CLASSES.OPTIONAL_BADGE).toBe(
        "amount-field__optional-badge",
      );
      expect(CHARGE_FORM_CLASSES.BOX).toBe("amount-field__box");
      expect(CHARGE_FORM_CLASSES.CURRENCY).toBe("amount-field__currency");
      expect(CHARGE_FORM_CLASSES.INPUT).toBe("amount-field__input");
      expect(CHARGE_FORM_CLASSES.INPUT_ERROR).toBe(
        "amount-field__input--error",
      );
      expect(CHARGE_FORM_CLASSES.CLEAR_BTN).toBe("amount-field__clear-btn");
      expect(CHARGE_FORM_CLASSES.CLEAR_BTN_HIDDEN).toBe(
        "amount-field__clear-btn--hidden",
      );
      expect(CHARGE_FORM_CLASSES.FOOTER).toBe("amount-field__footer");
      expect(CHARGE_FORM_CLASSES.STATUS).toBe("amount-field__status");
      expect(CHARGE_FORM_CLASSES.STATUS_OPEN).toBe(
        "amount-field__status--open",
      );
      expect(CHARGE_FORM_CLASSES.STATUS_FIXED).toBe(
        "amount-field__status--fixed",
      );
      expect(CHARGE_FORM_CLASSES.SHORTCUTS).toBe("amount-field__shortcuts");
      expect(CHARGE_FORM_CLASSES.PRESET).toBe("amount-field__preset");
      expect(CHARGE_FORM_CLASSES.PRESET_ACTIVE).toBe(
        "amount-field__preset--active",
      );
      expect(CHARGE_FORM_CLASSES.ALERT).toBe("charge-form__alert");
      expect(CHARGE_FORM_CLASSES.ALERT_ICON).toBe("charge-form__alert-icon");
      expect(CHARGE_FORM_CLASSES.ALERT_TEXT).toBe("charge-form__alert-text");
      expect(CHARGE_FORM_CLASSES.CTA).toBe("charge-cta");
      expect(CHARGE_FORM_CLASSES.CTA_DISABLED).toBe("charge-cta--disabled");
    });
  });

  describe("Helper formatFixedAmountStatus", () => {
    it("deve retornar status de valor aberto quando amount for nulo, indefinido ou vazio", () => {
      expect(formatFixedAmountStatus(null)).toBe(
        DEFAULT_CHARGE_FORM_STATUS_OPEN,
      );
      expect(formatFixedAmountStatus(undefined)).toBe(
        DEFAULT_CHARGE_FORM_STATUS_OPEN,
      );
      expect(formatFixedAmountStatus("")).toBe(DEFAULT_CHARGE_FORM_STATUS_OPEN);
      expect(formatFixedAmountStatus("   ")).toBe(
        DEFAULT_CHARGE_FORM_STATUS_OPEN,
      );
    });

    it("deve formatar valor com o prefixo correto", () => {
      expect(formatFixedAmountStatus("25,00")).toBe("Valor fixo: R$ 25,00");
      expect(formatFixedAmountStatus("150,50")).toBe("Valor fixo: R$ 150,50");
    });

    it("deve remover prefixo monetário duplicado antes de formatar", () => {
      expect(formatFixedAmountStatus("R$ 50,00")).toBe("Valor fixo: R$ 50,00");
      expect(formatFixedAmountStatus("R$   99,90")).toBe(
        "Valor fixo: R$ 99,90",
      );
    });

    it("deve formatar número primitivo", () => {
      expect(formatFixedAmountStatus(100)).toBe("Valor fixo: R$ 100");
    });
  });

  describe("Helper parseChargeAmount", () => {
    it("deve classificar valores vazios ou nulos como valor aberto", () => {
      expect(parseChargeAmount(null)).toEqual({
        isFixed: false,
        numericAmount: null,
        statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
        statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
      });

      expect(parseChargeAmount(undefined)).toEqual({
        isFixed: false,
        numericAmount: null,
        statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
        statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
      });

      expect(parseChargeAmount("")).toEqual({
        isFixed: false,
        numericAmount: null,
        statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
        statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
      });

      expect(parseChargeAmount("   ")).toEqual({
        isFixed: false,
        numericAmount: null,
        statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
        statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
      });
    });

    it("deve classificar zero como valor aberto (pagador define)", () => {
      expect(parseChargeAmount("0")).toEqual({
        isFixed: false,
        numericAmount: null,
        statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
        statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
      });

      expect(parseChargeAmount("0,00")).toEqual({
        isFixed: false,
        numericAmount: null,
        statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
        statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
      });

      expect(parseChargeAmount(0)).toEqual({
        isFixed: false,
        numericAmount: null,
        statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
        statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
      });
    });

    it("deve classificar valores não numéricos ou negativos como valor aberto de forma segura", () => {
      expect(parseChargeAmount("invalido")).toEqual({
        isFixed: false,
        numericAmount: null,
        statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
        statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
      });

      expect(parseChargeAmount("-25,00")).toEqual({
        isFixed: false,
        numericAmount: null,
        statusText: DEFAULT_CHARGE_FORM_STATUS_OPEN,
        statusClass: CHARGE_FORM_CLASSES.STATUS_OPEN,
      });
    });

    it("deve classificar valor monetário positivo com vírgula como fixo", () => {
      expect(parseChargeAmount("45,90")).toEqual({
        isFixed: true,
        numericAmount: 45.9,
        statusText: "Valor fixo: R$ 45,90",
        statusClass: CHARGE_FORM_CLASSES.STATUS_FIXED,
      });
    });

    it("deve suportar separadores de milhar com ponto e decimais com vírgula", () => {
      expect(parseChargeAmount("1.250,50")).toEqual({
        isFixed: true,
        numericAmount: 1250.5,
        statusText: "Valor fixo: R$ 1.250,50",
        statusClass: CHARGE_FORM_CLASSES.STATUS_FIXED,
      });
    });

    it("deve suportar valores com prefixo R$", () => {
      expect(parseChargeAmount("R$ 50,00")).toEqual({
        isFixed: true,
        numericAmount: 50,
        statusText: "Valor fixo: R$ 50,00",
        statusClass: CHARGE_FORM_CLASSES.STATUS_FIXED,
      });
    });

    it("deve suportar valores numéricos primitivos", () => {
      expect(parseChargeAmount(75.5)).toEqual({
        isFixed: true,
        numericAmount: 75.5,
        statusText: "Valor fixo: R$ 75.5",
        statusClass: CHARGE_FORM_CLASSES.STATUS_FIXED,
      });
    });
  });

  describe("Helper resolveCtaTooltip", () => {
    it("deve retornar tooltip de desabilitado quando hasSelectedKey for false", () => {
      expect(resolveCtaTooltip(false)).toBe(
        DEFAULT_CHARGE_FORM_CTA_DISABLED_TITLE,
      );
      expect(resolveCtaTooltip(null)).toBe(
        DEFAULT_CHARGE_FORM_CTA_DISABLED_TITLE,
      );
      expect(resolveCtaTooltip(undefined)).toBe(
        DEFAULT_CHARGE_FORM_CTA_DISABLED_TITLE,
      );
    });

    it("deve retornar rótulo padrão quando hasSelectedKey for true e sem título customizado", () => {
      expect(resolveCtaTooltip(true)).toBe(DEFAULT_CHARGE_FORM_CTA_LABEL);
    });

    it("deve retornar título customizado quando fornecido e hasSelectedKey for true", () => {
      expect(resolveCtaTooltip(true, "Gerar Cobrança Instantânea")).toBe(
        "Gerar Cobrança Instantânea",
      );
    });
  });
});
