import { describe, expect, it } from "vitest";
import {
  APP_METADATA,
  AccessController,
  CustomElement,
  DataController,
  Router,
  bootstrapApp,
  generatePixCharge,
  parsePixCharge,
} from "./main.js";

describe("main.js", () => {
  describe("APP_METADATA", () => {
    it("should expose frozen application metadata", () => {
      expect(Object.isFrozen(APP_METADATA)).toBe(true);
      expect(APP_METADATA).toEqual({
        name: "Manda um PIX",
        packageName: "mandaumpix.app",
        version: "1.0.0",
        license: "AGPL-3.0-only",
      });
    });
  });

  describe("generatePixCharge & parsePixCharge", () => {
    it("should generate a valid static PIX charge with a fixed transaction amount", () => {
      // Arrange
      const chargeInput = {
        pixKey: "contato@mandaumpix.app",
        merchantName: "Manda um PIX",
        merchantCity: "Brasilia",
        transactionAmount: 42.5,
        txid: "PEDIDO123",
      };

      // Act
      const result = generatePixCharge(chargeInput);
      const parsedResult = parsePixCharge(result.brCode);

      // Assert
      expect(result.brCode).toMatch(/^000201/);
      expect(result.qrSvg).toContain("<svg");
      expect(result.qrDataUrl).toMatch(/^data:image\/gif;base64,/);
      expect(result.qrGifBytes).toBeInstanceOf(Uint8Array);
      expect(parsedResult.isStatic).toBe(true);
      expect(parsedResult.parsed.pixKey).toBe("contato@mandaumpix.app");
      expect(parsedResult.parsed.transactionAmount).toBe(42.5);
    });

    it("should generate a valid static PIX charge with dynamic/open amount when omitted", () => {
      // Arrange
      const chargeInput = {
        pixKey: "contato@mandaumpix.app",
      };

      // Act
      const result = generatePixCharge(chargeInput);
      const parsedResult = parsePixCharge(result.brCode);

      // Assert
      expect(result.brCode).toMatch(/^000201/);
      expect(parsedResult.isStatic).toBe(true);
      expect(parsedResult.parsed.pixKey).toBe("contato@mandaumpix.app");
      expect(parsedResult.parsed.transactionAmount).toBe(0);
    });

    it("should throw an error when parsing an invalid BR Code", () => {
      expect(() => parsePixCharge("INVALID_BR_CODE")).toThrow();
    });
  });

  describe("bootstrapApp", () => {
    it("should mark the root element as initialized when present", () => {
      // Arrange
      const rootElement = document.createElement("div");

      // Act
      const initialized = bootstrapApp(rootElement);

      // Assert
      expect(initialized).toBe(rootElement);
      expect(rootElement.dataset.initialized).toBe("true");
    });

    it("should return null when root element is not found", () => {
      expect(bootstrapApp(null)).toBeNull();
    });
  });

  describe("@modnes exports", () => {
    it("should re-export core modnes classes", () => {
      expect(AccessController).toBeDefined();
      expect(CustomElement).toBeDefined();
      expect(DataController).toBeDefined();
      expect(Router).toBeDefined();
    });
  });
});
