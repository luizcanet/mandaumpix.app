import { describe, expect, it } from "vitest";
import {
  DEFAULT_PIX_KEY_LABELS,
  PIX_KEY_ERROR_CODES,
  PIX_KEY_TYPES,
  PixKeyValidationError,
} from "./pix-key.entity.js";

describe("pix-key.entity.js — Domain Constants & PixKeyValidationError (TASK-02.2.1)", () => {
  describe("PIX_KEY_TYPES", () => {
    it("should expose a frozen enum with the 5 BACEN PIX key types", () => {
      // Arrange & Act
      const types = PIX_KEY_TYPES;

      // Assert
      expect(Object.isFrozen(types)).toBe(true);
      expect(types).toEqual({
        CPF: "CPF",
        CNPJ: "CNPJ",
        EMAIL: "EMAIL",
        TELEFONE: "TELEFONE",
        EVP: "EVP",
      });
    });
  });

  describe("DEFAULT_PIX_KEY_LABELS", () => {
    it("should expose frozen default friendly account labels for each PIX key type", () => {
      // Arrange & Act
      const labels = DEFAULT_PIX_KEY_LABELS;

      // Assert
      expect(Object.isFrozen(labels)).toBe(true);
      expect(labels).toEqual({
        CPF: "Conta CPF",
        CNPJ: "Conta CNPJ",
        EMAIL: "Conta E-mail",
        TELEFONE: "Conta Celular",
        EVP: "Conta EVP",
      });
    });
  });

  describe("PIX_KEY_ERROR_CODES", () => {
    it("should expose frozen domain validation error codes", () => {
      // Arrange & Act
      const codes = PIX_KEY_ERROR_CODES;

      // Assert
      expect(Object.isFrozen(codes)).toBe(true);
      expect(codes).toEqual({
        INVALID_KEY_TYPE: "INVALID_KEY_TYPE",
        INVALID_CPF: "INVALID_CPF",
        INVALID_CNPJ: "INVALID_CNPJ",
        INVALID_EMAIL: "INVALID_EMAIL",
        INVALID_PHONE: "INVALID_PHONE",
        INVALID_EVP: "INVALID_EVP",
        INVALID_MERCHANT_NAME: "INVALID_MERCHANT_NAME",
        INVALID_MERCHANT_CITY: "INVALID_MERCHANT_CITY",
      });
    });
  });

  describe("PixKeyValidationError", () => {
    it("should instantiate an Error subclass with message, code, and field", () => {
      // Arrange
      const message = "CPF inválido informado para a chave PIX.";
      const options = {
        code: PIX_KEY_ERROR_CODES.INVALID_CPF,
        field: "valor_chave",
      };

      // Act
      const error = new PixKeyValidationError(message, options);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PixKeyValidationError);
      expect(error.name).toBe("PixKeyValidationError");
      expect(error.message).toBe(message);
      expect(error.code).toBe("INVALID_CPF");
      expect(error.field).toBe("valor_chave");
    });

    it("should provide sensible defaults when options are omitted", () => {
      // Arrange & Act
      const error = new PixKeyValidationError(
        "Falha de validação de chave PIX.",
      );

      // Assert
      expect(error.name).toBe("PixKeyValidationError");
      expect(error.message).toBe("Falha de validação de chave PIX.");
      expect(error.code).toBe("PIX_KEY_VALIDATION_ERROR");
      expect(error.field).toBeNull();
    });
  });
});
