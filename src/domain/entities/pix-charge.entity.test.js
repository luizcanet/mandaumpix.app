import { describe, expect, it } from "vitest";
import {
  DEFAULT_PIX_CHARGE_TXID,
  MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH,
  MAX_PIX_CHARGE_AMOUNT,
  MAX_PIX_CHARGE_TXID_LENGTH,
  PIX_CHARGE_ERROR_CODES,
  PixChargeValidationError,
  normalizeAdditionalInfo,
  normalizeTransactionAmount,
  normalizeTxid,
} from "./pix-charge.entity.js";

describe("pix-charge.entity.js — Domain Constants, Errors & Sanitizers (TASK-02.3.1)", () => {
  describe("Domain Constants & PIX_CHARGE_ERROR_CODES", () => {
    it("should expose frozen domain constants and error codes for PIX charges", () => {
      // Arrange & Act
      const codes = PIX_CHARGE_ERROR_CODES;

      // Assert
      expect(DEFAULT_PIX_CHARGE_TXID).toBe("***");
      expect(MAX_PIX_CHARGE_AMOUNT).toBe(999999999.99);
      expect(MAX_PIX_CHARGE_TXID_LENGTH).toBe(25);
      expect(MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH).toBe(72);
      expect(Object.isFrozen(codes)).toBe(true);
      expect(codes).toEqual({
        MISSING_PIX_KEY: "MISSING_PIX_KEY",
        INVALID_PIX_KEY: "INVALID_PIX_KEY",
        INVALID_AMOUNT: "INVALID_AMOUNT",
        INVALID_TXID: "INVALID_TXID",
        INVALID_ADDITIONAL_INFO: "INVALID_ADDITIONAL_INFO",
        INVALID_BR_CODE: "INVALID_BR_CODE",
        INVALID_QR_CODE: "INVALID_QR_CODE",
        CHARGE_GENERATION_FAILED: "CHARGE_GENERATION_FAILED",
      });
    });
  });

  describe("PixChargeValidationError", () => {
    it("should instantiate an Error subclass with message, code, and field", () => {
      // Arrange
      const message = "Valor da cobrança PIX inválido.";
      const options = {
        code: PIX_CHARGE_ERROR_CODES.INVALID_AMOUNT,
        field: "valor_opcional",
      };

      // Act
      const error = new PixChargeValidationError(message, options);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PixChargeValidationError);
      expect(error.name).toBe("PixChargeValidationError");
      expect(error.message).toBe(message);
      expect(error.code).toBe("INVALID_AMOUNT");
      expect(error.field).toBe("valor_opcional");
    });

    it("should provide default code and null field when options are omitted", () => {
      // Arrange & Act
      const error = new PixChargeValidationError(
        "Falha de validação na cobrança PIX.",
      );

      // Assert
      expect(error.name).toBe("PixChargeValidationError");
      expect(error.message).toBe("Falha de validação na cobrança PIX.");
      expect(error.code).toBe("PIX_CHARGE_VALIDATION_ERROR");
      expect(error.field).toBeNull();
    });
  });

  describe("normalizeTransactionAmount (RN03)", () => {
    it.each([
      [undefined],
      [null],
      [""],
      ["   "],
      [0],
      ["0"],
      ["0,00"],
      ["0.00"],
      ["R$ 0,00"],
      [" R$ 0 "],
    ])(
      "should return dynamic/open amount (valor_opcional = null, valor_dinamico = true) for %p",
      (rawAmount) => {
        // Act
        const result = normalizeTransactionAmount(rawAmount);

        // Assert
        expect(result).toEqual({
          valor_opcional: null,
          valor_dinamico: true,
        });
      },
    );

    it.each([
      [25, 25],
      [42.5, 42.5],
      [0.01, 0.01],
      [19.999, 20],
      [10.555, 10.56],
      [999999999.99, 999999999.99],
      ["25", 25],
      ["42.5", 42.5],
      ["42.50", 42.5],
      ["42,50", 42.5],
      ["R$ 42,50", 42.5],
      ["R$ 1.234,56", 1234.56],
      ["1.234.567,89", 1234567.89],
      [" 99,90 ", 99.9],
    ])(
      "should normalize fixed positive amount %p to { valor_opcional: %p, valor_dinamico: false }",
      (rawAmount, expectedAmount) => {
        // Act
        const result = normalizeTransactionAmount(rawAmount);

        // Assert
        expect(result).toEqual({
          valor_opcional: expectedAmount,
          valor_dinamico: false,
        });
      },
    );

    it.each([
      [-0.01],
      [-10],
      ["-10"],
      ["-10,50"],
      ["R$ -5,00"],
      [0.001],
      ["0,001"],
      [Number.NaN],
      [Number.POSITIVE_INFINITY],
      [Number.NEGATIVE_INFINITY],
      [1000000000],
      ["1000000000.00"],
      ["abc"],
      ["R$"],
      ["12,34,56"],
      ["12.34.56"],
      [true],
      [false],
      [{}],
      [[]],
    ])(
      "should throw PixChargeValidationError (INVALID_AMOUNT) for invalid amount %p",
      (invalidAmount) => {
        expect(() => normalizeTransactionAmount(invalidAmount)).toThrowError(
          expect.objectContaining({
            name: "PixChargeValidationError",
            code: PIX_CHARGE_ERROR_CODES.INVALID_AMOUNT,
            field: "valor_opcional",
          }),
        );
      },
    );
  });

  describe("normalizeTxid", () => {
    it.each([[undefined], [null], [""], ["   "], ["***"], [" *** "]])(
      "should default to '***' when txid is %p",
      (rawTxid) => {
        expect(normalizeTxid(rawTxid)).toBe("***");
      },
    );

    it.each([
      ["PEDIDO123", "PEDIDO123"],
      ["  Abc123XYZ  ", "Abc123XYZ"],
      ["A", "A"],
      ["1234567890123456789012345", "1234567890123456789012345"],
    ])(
      "should accept valid alphanumeric txid %p as %p",
      (rawTxid, expected) => {
        expect(normalizeTxid(rawTxid)).toBe(expected);
      },
    );

    it.each([
      ["PEDIDO-123"],
      ["PEDIDO_123"],
      ["PEDIDO 123"],
      ["PEDIDO#1"],
      ["***1"],
      ["12345678901234567890123456"], // 26 chars (> 25)
      [12345],
      [{}],
    ])(
      "should throw PixChargeValidationError (INVALID_TXID) for invalid txid %p",
      (invalidTxid) => {
        expect(() => normalizeTxid(invalidTxid)).toThrowError(
          expect.objectContaining({
            name: "PixChargeValidationError",
            code: PIX_CHARGE_ERROR_CODES.INVALID_TXID,
            field: "txid",
          }),
        );
      },
    );
  });

  describe("normalizeAdditionalInfo", () => {
    it.each([[undefined], [null], [""], ["   "]])(
      "should return null when infoAdicional is %p",
      (rawInfo) => {
        expect(normalizeAdditionalInfo(rawInfo)).toBeNull();
      },
    );

    it("should normalize diacritics, collapse spaces, and trim valid additional info", () => {
      expect(normalizeAdditionalInfo("  Serviço de   manutenção  ")).toBe(
        "Servico de manutencao",
      );
    });

    it.each([["A".repeat(73)], [123], [true], [{}]])(
      "should throw PixChargeValidationError (INVALID_ADDITIONAL_INFO) for %p",
      (invalidInfo) => {
        expect(() => normalizeAdditionalInfo(invalidInfo)).toThrowError(
          expect.objectContaining({
            name: "PixChargeValidationError",
            code: PIX_CHARGE_ERROR_CODES.INVALID_ADDITIONAL_INFO,
            field: "info_adicional",
          }),
        );
      },
    );
  });
});
