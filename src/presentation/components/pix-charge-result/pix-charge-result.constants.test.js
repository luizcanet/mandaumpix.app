import { describe, expect, it } from "vitest";
import {
  CHARGE_RESULT_CLASSES,
  CHARGE_RESULT_EVENT_NAMES,
  CHARGE_RESULT_ICONS,
  DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK,
  DEFAULT_CHARGE_RESULT_AMOUNT_OPEN,
  DEFAULT_CHARGE_RESULT_AMOUNT_PREFIX,
  DEFAULT_CHARGE_RESULT_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BRCODE_ARIA_LABEL,
  DEFAULT_CHARGE_RESULT_BRCODE_TITLE,
  DEFAULT_CHARGE_RESULT_MODE_FIXED,
  DEFAULT_CHARGE_RESULT_MODE_OPEN,
  DEFAULT_CHARGE_RESULT_QR_ALT,
  DEFAULT_CHARGE_RESULT_READY_BADGE,
  DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION,
  DEFAULT_CHARGE_RESULT_WAITING_TITLE,
  formatAccountSummary,
  formatChargeAmountBadge,
  formatCurrencyBRL,
  formatKeyMetadata,
} from "./pix-charge-result.constants.js";

describe("pix-charge-result.constants", () => {
  describe("Imutabilidade de objetos e coleções", () => {
    it("deve garantir que CHARGE_RESULT_CLASSES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(CHARGE_RESULT_CLASSES)).toBe(true);
    });

    it("deve garantir que CHARGE_RESULT_ICONS seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(CHARGE_RESULT_ICONS)).toBe(true);
    });

    it("deve garantir que CHARGE_RESULT_EVENT_NAMES seja congelado com Object.freeze", () => {
      expect(Object.isFrozen(CHARGE_RESULT_EVENT_NAMES)).toBe(true);
    });
  });

  describe("Valores padrão dos textos e acessibilidade", () => {
    it("deve definir o rótulo de acessibilidade (aria-label) da seção", () => {
      expect(DEFAULT_CHARGE_RESULT_ARIA_LABEL).toBe("Cobrança PIX gerada");
    });

    it("deve definir o título do estado aguardando geração", () => {
      expect(DEFAULT_CHARGE_RESULT_WAITING_TITLE).toBe("Aguardando geração");
    });

    it("deve definir a mensagem instrutiva do estado aguardando geração", () => {
      expect(DEFAULT_CHARGE_RESULT_WAITING_DESCRIPTION).toContain(
        "Manda um PIX",
      );
    });

    it("deve definir o rótulo da badge de cobrança pronta", () => {
      expect(DEFAULT_CHARGE_RESULT_READY_BADGE).toBe("Cobrança pronta");
    });

    it("deve definir o texto da pílula para modalidade de valor aberto", () => {
      expect(DEFAULT_CHARGE_RESULT_AMOUNT_OPEN).toBe("Valor Aberto");
    });

    it("deve definir o prefixo monetário brasileiro como R$", () => {
      expect(DEFAULT_CHARGE_RESULT_AMOUNT_PREFIX).toBe("R$ ");
    });

    it("deve definir o título do bloco PIX Copia e Cola", () => {
      expect(DEFAULT_CHARGE_RESULT_BRCODE_TITLE).toBe("PIX Copia e Cola");
    });

    it("deve definir o rótulo de modalidade de valor fixo", () => {
      expect(DEFAULT_CHARGE_RESULT_MODE_FIXED).toBe("Valor Fixo");
    });

    it("deve definir o rótulo de modalidade de valor dinâmico", () => {
      expect(DEFAULT_CHARGE_RESULT_MODE_OPEN).toBe("Valor Dinâmico");
    });

    it("deve definir o fallback da identificação da conta/recebedor", () => {
      expect(DEFAULT_CHARGE_RESULT_ACCOUNT_FALLBACK).toBe(
        "Chave PIX Selecionada",
      );
    });

    it("deve definir o texto alternativo padrão da imagem QR Code", () => {
      expect(DEFAULT_CHARGE_RESULT_QR_ALT).toBe(
        "QR Code para pagamento via PIX",
      );
    });

    it("deve definir o rótulo acessível da caixa de código Copia e Cola", () => {
      expect(DEFAULT_CHARGE_RESULT_BRCODE_ARIA_LABEL).toBe(
        "Código PIX Copia e Cola",
      );
    });
  });

  describe("Mapeamento de classes BEM", () => {
    it("deve conter as classes da casca e estados do cartão", () => {
      expect(CHARGE_RESULT_CLASSES.ROOT).toBe("charge-result");
      expect(CHARGE_RESULT_CLASSES.CARD).toBe("card");
      expect(CHARGE_RESULT_CLASSES.EMPTY).toBe("charge-result--empty");
      expect(CHARGE_RESULT_CLASSES.WAITING).toBe("charge-result__waiting");
      expect(CHARGE_RESULT_CLASSES.WAITING_ICON).toBe(
        "charge-result__waiting-icon",
      );
      expect(CHARGE_RESULT_CLASSES.WAITING_TITLE).toBe(
        "charge-result__waiting-title",
      );
      expect(CHARGE_RESULT_CLASSES.WAITING_DESC).toBe(
        "charge-result__waiting-desc",
      );
    });

    it("deve conter as classes do cabeçalho e badges de status", () => {
      expect(CHARGE_RESULT_CLASSES.HEADER).toBe("charge-result__header");
      expect(CHARGE_RESULT_CLASSES.HEADER_INFO).toBe(
        "charge-result__header-info",
      );
      expect(CHARGE_RESULT_CLASSES.BADGE_READY).toBe(
        "charge-result__badge-ready",
      );
      expect(CHARGE_RESULT_CLASSES.ACCOUNT).toBe("charge-result__account");
      expect(CHARGE_RESULT_CLASSES.AMOUNT_PILL).toBe(
        "charge-result__amount-pill",
      );
      expect(CHARGE_RESULT_CLASSES.AMOUNT_PILL_OPEN).toBe(
        "charge-result__amount-pill--open",
      );
    });

    it("deve conter as classes do palco do QR Code e metadados", () => {
      expect(CHARGE_RESULT_CLASSES.QR_STAGE).toBe("charge-result__qr-stage");
      expect(CHARGE_RESULT_CLASSES.QR_FRAME).toBe("charge-result__qr-frame");
      expect(CHARGE_RESULT_CLASSES.QR_SVG).toBe("charge-result__qr-svg");
      expect(CHARGE_RESULT_CLASSES.META).toBe("charge-result__meta");
    });

    it("deve conter as classes do código Copia e Cola, ações e região live", () => {
      expect(CHARGE_RESULT_CLASSES.BRCODE_WRAPPER).toBe(
        "charge-result__brcode-wrapper",
      );
      expect(CHARGE_RESULT_CLASSES.BRCODE_LABEL).toBe(
        "charge-result__brcode-label",
      );
      expect(CHARGE_RESULT_CLASSES.BRCODE_TITLE).toBe(
        "charge-result__brcode-title",
      );
      expect(CHARGE_RESULT_CLASSES.BRCODE_MODE).toBe(
        "charge-result__brcode-mode",
      );
      expect(CHARGE_RESULT_CLASSES.BRCODE).toBe("charge-result__brcode");
      expect(CHARGE_RESULT_CLASSES.ACTIONS).toBe("charge-result__actions");
      expect(CHARGE_RESULT_CLASSES.LIVE_REGION).toBe(
        "charge-result__live-region",
      );
    });
  });

  describe("Mapeamento de ícones e eventos", () => {
    it("deve expor os identificadores canônicos de ícones vetoriais", () => {
      expect(CHARGE_RESULT_ICONS.QRCODE).toBe("qrcode");
      expect(CHARGE_RESULT_ICONS.CHECK).toBe("check");
      expect(CHARGE_RESULT_ICONS.COPY).toBe("copy");
      expect(CHARGE_RESULT_ICONS.SHARE).toBe("share");
      expect(CHARGE_RESULT_ICONS.DOWNLOAD).toBe("download");
    });

    it("deve expor os nomes dos eventos customizados do componente", () => {
      expect(CHARGE_RESULT_EVENT_NAMES.CHARGE_CHANGED).toBe("charge-changed");
      expect(CHARGE_RESULT_EVENT_NAMES.CHARGE_CLEARED).toBe("charge-cleared");
    });
  });

  describe("Helper formatCurrencyBRL", () => {
    it("deve formatar valores numéricos positivos inteiros", () => {
      expect(formatCurrencyBRL(10)).toBe("R$ 10,00");
      expect(formatCurrencyBRL(100)).toBe("R$ 100,00");
      expect(formatCurrencyBRL(1000)).toBe("R$ 1.000,00");
      expect(formatCurrencyBRL(1234567)).toBe("R$ 1.234.567,00");
    });

    it("deve formatar valores numéricos com casas decimais", () => {
      expect(formatCurrencyBRL(45.9)).toBe("R$ 45,90");
      expect(formatCurrencyBRL(45.95)).toBe("R$ 45,95");
      expect(formatCurrencyBRL(0.5)).toBe("R$ 0,50");
      expect(formatCurrencyBRL(1234.56)).toBe("R$ 1.234,56");
    });

    it("deve formatar strings numéricas ou com formatação brasileira", () => {
      expect(formatCurrencyBRL("45.9")).toBe("R$ 45,90");
      expect(formatCurrencyBRL("45,90")).toBe("R$ 45,90");
      expect(formatCurrencyBRL("R$ 1.250,50")).toBe("R$ 1.250,50");
      expect(formatCurrencyBRL("1500,75")).toBe("R$ 1.500,75");
    });

    it("deve retornar string vazia para valores nulos, vazios ou indefinidos", () => {
      expect(formatCurrencyBRL(null)).toBe("");
      expect(formatCurrencyBRL(undefined)).toBe("");
      expect(formatCurrencyBRL("")).toBe("");
      expect(formatCurrencyBRL("   ")).toBe("");
    });

    it("deve retornar string vazia para valores menores ou iguais a zero ou inválidos", () => {
      expect(formatCurrencyBRL(0)).toBe("");
      expect(formatCurrencyBRL(-10)).toBe("");
      expect(formatCurrencyBRL(NaN)).toBe("");
      expect(formatCurrencyBRL(Infinity)).toBe("");
      expect(formatCurrencyBRL("invalido")).toBe("");
    });
  });

  describe("Helper formatChargeAmountBadge", () => {
    it("deve retornar configuração de valor aberto quando isDynamic for true", () => {
      const result = formatChargeAmountBadge(45.9, true);
      expect(result).toEqual({
        text: "Valor Aberto",
        isOpen: true,
        className:
          "charge-result__amount-pill charge-result__amount-pill--open",
      });
    });

    it("deve retornar configuração de valor aberto quando o valor for nulo, indefinido ou vazio", () => {
      expect(formatChargeAmountBadge(null)).toEqual({
        text: "Valor Aberto",
        isOpen: true,
        className:
          "charge-result__amount-pill charge-result__amount-pill--open",
      });
      expect(formatChargeAmountBadge(undefined)).toEqual({
        text: "Valor Aberto",
        isOpen: true,
        className:
          "charge-result__amount-pill charge-result__amount-pill--open",
      });
      expect(formatChargeAmountBadge("")).toEqual({
        text: "Valor Aberto",
        isOpen: true,
        className:
          "charge-result__amount-pill charge-result__amount-pill--open",
      });
    });

    it("deve retornar configuração de valor fixo formatado para números válidos", () => {
      const result = formatChargeAmountBadge(45.9);
      expect(result).toEqual({
        text: "R$ 45,90",
        isOpen: false,
        className: "charge-result__amount-pill",
      });
    });

    it("deve retornar configuração de valor fixo formatado para strings numéricas", () => {
      const result = formatChargeAmountBadge("120,50");
      expect(result).toEqual({
        text: "R$ 120,50",
        isOpen: false,
        className: "charge-result__amount-pill",
      });
    });

    it("deve retornar valor aberto caso a string monetária seja inválida ou igual a zero", () => {
      expect(formatChargeAmountBadge("0")).toEqual({
        text: "Valor Aberto",
        isOpen: true,
        className:
          "charge-result__amount-pill charge-result__amount-pill--open",
      });
      expect(formatChargeAmountBadge("texto_invalido")).toEqual({
        text: "Valor Aberto",
        isOpen: true,
        className:
          "charge-result__amount-pill charge-result__amount-pill--open",
      });
    });
  });

  describe("Helper formatAccountSummary", () => {
    it("deve formatar resumo contendo rótulo e nome do recebedor", () => {
      const chaveConta = {
        rotulo: "Nubank",
        nome_recebedor: "JOAO DA SILVA",
      };
      expect(formatAccountSummary(chaveConta)).toBe("Nubank • JOAO DA SILVA");
    });

    it("deve formatar resumo contendo apenas o rótulo quando o nome for ausente", () => {
      const chaveConta = {
        rotulo: "Conta Principal",
        nome_recebedor: "",
      };
      expect(formatAccountSummary(chaveConta)).toBe("Conta Principal");
    });

    it("deve formatar resumo contendo apenas o nome do recebedor quando o rótulo for ausente", () => {
      const chaveConta = {
        rotulo: "",
        nome_recebedor: "MARIA SILVA",
      };
      expect(formatAccountSummary(chaveConta)).toBe("MARIA SILVA");
    });

    it("deve aplicar trim nos campos de texto", () => {
      const chaveConta = {
        rotulo: "  Inter PJ  ",
        nome_recebedor: "  EMPRESA LTDA  ",
      };
      expect(formatAccountSummary(chaveConta)).toBe("Inter PJ • EMPRESA LTDA");
    });

    it("deve retornar o fallback padrão quando os campos estiverem vazios ou ausentes", () => {
      expect(formatAccountSummary({})).toBe("Chave PIX Selecionada");
      expect(formatAccountSummary(null)).toBe("Chave PIX Selecionada");
      expect(formatAccountSummary(undefined)).toBe("Chave PIX Selecionada");
      expect(formatAccountSummary("nao_objeto")).toBe("Chave PIX Selecionada");
    });
  });

  describe("Helper formatKeyMetadata", () => {
    it("deve formatar metadados com tipo, valor da chave e cidade", () => {
      const chaveConta = {
        tipo_chave: "CPF",
        valor_chave: "123.456.789-00",
        cidade_recebedor: "CURITIBA",
      };
      expect(formatKeyMetadata(chaveConta)).toBe(
        "Chave CPF: 123.456.789-00 (CURITIBA)",
      );
    });

    it("deve formatar metadados sem cidade quando não informada", () => {
      const chaveConta = {
        tipo_chave: "EMAIL",
        valor_chave: "usuario@pix.com.br",
        cidade_recebedor: "",
      };
      expect(formatKeyMetadata(chaveConta)).toBe(
        "Chave EMAIL: usuario@pix.com.br",
      );
    });

    it("deve formatar metadados quando tipo_chave for omitido mas valor estiver presente", () => {
      const chaveConta = {
        valor_chave: "+5511999998888",
        cidade_recebedor: "SAO PAULO",
      };
      expect(formatKeyMetadata(chaveConta)).toBe(
        "Chave: +5511999998888 (SAO PAULO)",
      );
    });

    it("deve retornar apenas a cidade se chave e tipo forem omitidos", () => {
      const chaveConta = {
        cidade_recebedor: "BRASILIA",
      };
      expect(formatKeyMetadata(chaveConta)).toBe("(BRASILIA)");
    });

    it("deve retornar string vazia para entrada vazia ou inválida", () => {
      expect(formatKeyMetadata({})).toBe("");
      expect(formatKeyMetadata(null)).toBe("");
      expect(formatKeyMetadata(undefined)).toBe("");
      expect(formatKeyMetadata("invalido")).toBe("");
    });
  });
});
