import { describe, expect, it, vi } from "vitest";
import {
  exportQrCodePng,
  generatePixCharge,
  parsePixCharge,
} from "./pix-qr.service.js";

describe("pix-qr.service.js", () => {
  const validPixKey = "12345678909";

  describe("generatePixCharge", () => {
    it("should generate valid static pix charge and QR representations", () => {
      const result = generatePixCharge({
        pixKey: validPixKey,
        merchantName: "Fulano de Tal",
        merchantCity: "Curitiba",
        transactionAmount: 25.5,
      });

      expect(result).toHaveProperty("pixObject");
      expect(result).toHaveProperty("brCode");
      expect(typeof result.brCode).toBe("string");
      expect(result.brCode).toContain("000201");
      expect(typeof result.qrSvg).toBe("string");
      expect(result.qrSvg).toContain("<svg");
      expect(typeof result.qrDataUrl).toBe("string");
      expect(result.qrDataUrl).toContain("data:image/gif;base64,");
      expect(result.qrGifBytes).toBeInstanceOf(Uint8Array);
    });

    it("should default transaction amount to 0 when omitted or negative", () => {
      const result = generatePixCharge({
        pixKey: validPixKey,
        transactionAmount: -10,
      });
      expect(result.brCode).toBeDefined();
    });

    it("should throw error when pix object has error", () => {
      expect(() => {
        generatePixCharge({
          pixKey: validPixKey,
          merchantName: "A".repeat(30), // exceeds 25 characters
        });
      }).toThrow(/character limit exceeded/);
    });
  });

  describe("parsePixCharge", () => {
    it("should parse a valid BR Code successfully", () => {
      const generated = generatePixCharge({
        pixKey: validPixKey,
        merchantName: "Fulano de Tal",
        merchantCity: "Curitiba",
      });

      const parsed = parsePixCharge(generated.brCode);
      expect(parsed).toHaveProperty("parsed");
      expect(parsed.isStatic).toBe(true);
    });

    it("should throw error for invalid BR Code", () => {
      expect(() => {
        parsePixCharge("invalid-brcode-payload");
      }).toThrow(/Código PIX inválido/);
    });
  });

  describe("exportQrCodePng", () => {
    it("should delegate to svgToPng with width and height", async () => {
      const mockSvgToPng = vi
        .fn()
        .mockResolvedValueOnce("data:image/png;base64,mocked");

      const generated = generatePixCharge({
        pixKey: validPixKey,
      });

      const pngResult = await exportQrCodePng(generated.brCode, {
        width: 256,
        height: 256,
        svgToPngFn: mockSvgToPng,
      });

      expect(mockSvgToPng).toHaveBeenCalledWith(
        expect.stringContaining("<svg"),
        256,
        256,
      );
      expect(pngResult).toBe("data:image/png;base64,mocked");
    });
  });
});
