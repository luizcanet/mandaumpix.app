import { describe, expect, it } from "vitest";
import {
  APP_METADATA,
  AccessController,
  ChaveConta,
  CobrancaPix,
  CustomElement,
  DEFAULT_PIX_CHARGE_TXID,
  DEFAULT_PIX_KEY_LABELS,
  DataController,
  DeletePixKeyUseCase,
  GeneratePixChargeUseCase,
  ListPixKeysUseCase,
  MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH,
  MAX_PIX_CHARGE_AMOUNT,
  MAX_PIX_CHARGE_TXID_LENGTH,
  PIX_CHARGE_ERROR_CODES,
  PIX_KEY_ERROR_CODES,
  PIX_KEY_MANAGEMENT_ERROR_CODES,
  PIX_KEY_TYPES,
  PixChargeEntity,
  PixChargeValidationError,
  PixKeyEntity,
  PixKeyManagementError,
  PixKeyValidationError,
  Router,
  SavePixKeyUseCase,
  SelectPixKeyUseCase,
  assertPixKeyRepository,
  bootstrapApp,
  executeDeletePixKey,
  executeGeneratePixCharge,
  executeListPixKeys,
  executeSavePixKey,
  executeSelectPixKey,
  generatePixCharge,
  hydrateChaveContaList,
  normalizeAdditionalInfo,
  normalizeMerchantCity,
  normalizeMerchantName,
  normalizeTransactionAmount,
  normalizeTxid,
  parsePixCharge,
  resolveChaveConta,
  resolveRequiredPixKeyId,
  validateAndNormalizePixKey,
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

  describe("domain exports (US-02.2)", () => {
    it("should re-export ChaveConta entity, constants, error class, and validators", () => {
      expect(ChaveConta).toBeDefined();
      expect(PixKeyEntity).toBe(ChaveConta);
      expect(PIX_KEY_TYPES).toBeDefined();
      expect(DEFAULT_PIX_KEY_LABELS).toBeDefined();
      expect(PIX_KEY_ERROR_CODES).toBeDefined();
      expect(PixKeyValidationError).toBeDefined();
      expect(validateAndNormalizePixKey).toBeTypeOf("function");
      expect(normalizeMerchantName).toBeTypeOf("function");
      expect(normalizeMerchantCity).toBeTypeOf("function");
    });
  });

  describe("domain & application exports (US-02.3)", () => {
    it("should re-export CobrancaPix entity, GeneratePixChargeUseCase, constants, errors, and sanitizers", () => {
      expect(CobrancaPix).toBeDefined();
      expect(PixChargeEntity).toBe(CobrancaPix);
      expect(PixChargeValidationError).toBeDefined();
      expect(PIX_CHARGE_ERROR_CODES).toBeDefined();
      expect(DEFAULT_PIX_CHARGE_TXID).toBe("***");
      expect(MAX_PIX_CHARGE_AMOUNT).toBe(999999999.99);
      expect(MAX_PIX_CHARGE_TXID_LENGTH).toBe(25);
      expect(MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH).toBe(72);
      expect(normalizeTransactionAmount).toBeTypeOf("function");
      expect(normalizeTxid).toBeTypeOf("function");
      expect(normalizeAdditionalInfo).toBeTypeOf("function");
      expect(resolveChaveConta).toBeTypeOf("function");
      expect(GeneratePixChargeUseCase).toBeDefined();
      expect(executeGeneratePixCharge).toBeTypeOf("function");
    });

    it("should generate a complete CobrancaPix from a ChaveConta via main.js exports", () => {
      // Arrange
      const pixKey = ChaveConta.create({
        tipo_chave: PIX_KEY_TYPES.EMAIL,
        valor_chave: "eu@luizca.net",
        nome_recebedor: "Luiz Henrique Canet Filho",
        cidade_recebedor: "Brasília",
      });

      // Act
      const charge = executeGeneratePixCharge({
        chaveConta: pixKey,
        valor_opcional: 25.5,
      });

      // Assert
      expect(charge).toBeInstanceOf(CobrancaPix);
      expect(charge.id_chave_conta).toBe(pixKey.id);
      expect(charge.valor_opcional).toBe(25.5);
      expect(charge.valor_dinamico).toBe(false);
      expect(charge.chave_cobranca).toContain("540525.50");
      expect(charge.imagem_qrcode.svg).toContain("<svg");
    });
  });

  describe("application exports & lifecycle integration (US-02.4)", () => {
    it("should re-export PIX key management use cases, error class, error codes, and helpers", () => {
      expect(SavePixKeyUseCase).toBeDefined();
      expect(ListPixKeysUseCase).toBeDefined();
      expect(SelectPixKeyUseCase).toBeDefined();
      expect(DeletePixKeyUseCase).toBeDefined();
      expect(executeSavePixKey).toBeTypeOf("function");
      expect(executeListPixKeys).toBeTypeOf("function");
      expect(executeSelectPixKey).toBeTypeOf("function");
      expect(executeDeletePixKey).toBeTypeOf("function");
      expect(PixKeyManagementError).toBeDefined();
      expect(PIX_KEY_MANAGEMENT_ERROR_CODES).toBeDefined();
      expect(assertPixKeyRepository).toBeTypeOf("function");
      expect(hydrateChaveContaList).toBeTypeOf("function");
      expect(resolveRequiredPixKeyId).toBeTypeOf("function");
    });

    it("should orchestrate full PIX key management lifecycle and charge generation via main.js exports", async () => {
      // Arrange
      const store = new Map();
      let selectedKeyId = null;
      const pixKeyRepository = {
        findAll: async () => Array.from(store.values()),
        save: async (key) => {
          store.set(key.id, key);
          return key;
        },
        deleteById: async (id) => {
          store.delete(id);
        },
        getSelectedKeyId: async () => selectedKeyId,
        setSelectedKeyId: async (id) => {
          selectedKeyId = id;
        },
      };

      // Act 1: Save first key (auto-selected) and second key
      const savedFirst = await executeSavePixKey(
        {
          id: "key-01",
          rotulo: "Conta Principal",
          tipo_chave: PIX_KEY_TYPES.EMAIL,
          valor_chave: "eu@luizca.net",
          nome_recebedor: "Luiz Henrique Canet Filho",
          cidade_recebedor: "Brasília",
        },
        { pixKeyRepository },
      );
      const savedSecond = await executeSavePixKey(
        {
          id: "key-02",
          rotulo: "Conta Celular",
          tipo_chave: PIX_KEY_TYPES.TELEFONE,
          valor_chave: "(61) 99999-8888",
          nome_recebedor: "Luiz Henrique Canet Filho",
          cidade_recebedor: "Brasília",
        },
        { pixKeyRepository },
      );

      // Assert 1
      expect(savedFirst.isSelected).toBe(true);
      expect(savedSecond.isSelected).toBe(false);

      // Act 2: Select second key and generate charge from repository active key
      await executeSelectPixKey("key-02", { pixKeyRepository });
      const listedAfterSelect = await executeListPixKeys({ pixKeyRepository });
      const charge = await executeGeneratePixCharge(
        { valor_opcional: 100 },
        { pixKeyRepository },
      );

      // Assert 2
      expect(listedAfterSelect.items).toHaveLength(2);
      expect(listedAfterSelect.selectedKeyId).toBe("key-02");
      expect(charge.id_chave_conta).toBe("key-02");
      expect(charge.chave_cobranca).toContain("+5561999998888");

      // Act 3: Delete active key (key-02) -> auto-reassigns to key-01
      const afterDeleteActive = await executeDeletePixKey("key-02", {
        pixKeyRepository,
      });

      // Assert 3
      expect(afterDeleteActive.selectedKeyId).toBe("key-01");
      expect(afterDeleteActive.items).toHaveLength(1);
    });
  });
});
