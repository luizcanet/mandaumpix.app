import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  pixChargeResultTemplate,
  resolveQrContent,
} from "./pix-charge-result.template.js";
import { CHARGE_RESULT_CLASSES } from "./pix-charge-result.constants.js";

describe("PixChargeResultTemplate", () => {
  it("deve escapar caracteres HTML", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    expect(escapeHtml(null)).toBe("");
  });

  describe("resolveQrContent", () => {
    it("deve retornar string vazia para entrada vazia ou nula", () => {
      expect(resolveQrContent(null)).toBe("");
      expect(resolveQrContent("")).toBe("");
    });

    it("deve retornar o SVG cru se a string iniciar com <svg", () => {
      const svg = '<svg viewBox="0 0 10 10"></svg>';
      expect(resolveQrContent(svg)).toBe(svg);
    });

    it("deve retornar tag img se for uma url de imagem", () => {
      expect(resolveQrContent("https://example.com/qr.png")).toContain(
        '<img src="https://example.com/qr.png"',
      );
    });

    it("deve suportar objeto com svg ou dataUrl", () => {
      expect(resolveQrContent({ svg: "<svg></svg>" })).toBe("<svg></svg>");
      expect(
        resolveQrContent({ dataUrl: "data:image/png;base64,123" }),
      ).toContain('<img src="data:image/png;base64,123"');
    });
  });

  describe("pixChargeResultTemplate", () => {
    it("deve renderizar o estado de espera quando não houver cobrança", () => {
      const html = pixChargeResultTemplate({ charge: null });
      expect(html).toContain(CHARGE_RESULT_CLASSES.WAITING);
      expect(html).toContain(CHARGE_RESULT_CLASSES.WAITING_TITLE);
      expect(html).toContain(CHARGE_RESULT_CLASSES.WAITING_DESC);
    });

    it("deve renderizar o resultado da cobrança completo quando charge for fornecido", () => {
      const mockCharge = {
        chave_conta: {
          rotulo: "Chave Principal",
          tipo_chave: "ALEATORIA",
          valor_chave: "abc-123",
          nome_recebedor: "Fulano de Tal",
          cidade_recebedor: "Curitiba",
        },
        valor_opcional: "50,00",
        valor_dinamico: false,
        chave_cobranca: "00020126580014BR.GOV.BCB.PIX...",
        imagem_qrcode: "<svg></svg>",
      };

      const html = pixChargeResultTemplate({
        charge: mockCharge,
        isCopied: false,
      });

      expect(html).toContain(CHARGE_RESULT_CLASSES.HEADER);
      expect(html).toContain(CHARGE_RESULT_CLASSES.QR_STAGE);
      expect(html).toContain(CHARGE_RESULT_CLASSES.BRCODE_WRAPPER);
      expect(html).toContain("Chave Principal");
      expect(html).toContain("00020126580014BR.GOV.BCB.PIX...");
      expect(html).not.toContain(CHARGE_RESULT_CLASSES.BTN_COPIED);
    });

    it("deve renderizar estado de copiado quando isCopied for true", () => {
      const mockCharge = {
        chave_conta: { rotulo: "Minha Chave" },
        valor_dinamico: true,
        chave_cobranca: "BRCODE",
        imagem_qrcode: "<svg></svg>",
      };

      const html = pixChargeResultTemplate({
        charge: mockCharge,
        isCopied: true,
      });

      expect(html).toContain(CHARGE_RESULT_CLASSES.BTN_COPIED);
      expect(html).toContain("Copiado!");
    });
  });
});
