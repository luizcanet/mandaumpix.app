import { describe, expect, it, vi } from "vitest";
import { parsePixCharge } from "../../main.js";
import {
  CobrancaPix,
  PIX_CHARGE_ERROR_CODES,
} from "../../domain/entities/pix-charge.entity.js";
import {
  ChaveConta,
  PIX_KEY_TYPES,
} from "../../domain/entities/pix-key.entity.js";
import {
  GeneratePixChargeUseCase,
  executeGeneratePixCharge,
} from "./generate-pix-charge.use-case.js";

describe("generate-pix-charge.use-case.js — GeneratePixChargeUseCase (TASK-02.3.3)", () => {
  const samplePixKey = ChaveConta.create({
    id: "key-01",
    rotulo: "Conta Principal",
    tipo_chave: PIX_KEY_TYPES.EMAIL,
    valor_chave: "eu@luizca.net",
    nome_recebedor: "Luiz Henrique Canet Filho",
    cidade_recebedor: "Brasília",
    criado_em: "2026-11-07T16:00:00.000Z",
  });

  describe("Fixed Amount Charge Generation (Scenario 01 & 02 — RN02, RN03, RN04)", () => {
    it("should generate an immutable CobrancaPix with fixed amount, valid EMV tag 54, and QR Code representations", () => {
      // Arrange
      const useCase = GeneratePixChargeUseCase.create();

      // Act
      const charge = useCase.execute({
        chaveConta: samplePixKey,
        valor_opcional: 42.5,
        txid: "PEDIDO123",
        info_adicional: "Consultoria técnica",
        qrOptions: { border: 2 },
        gerado_em: "2026-11-07T17:00:00.000Z",
      });
      const parsed = parsePixCharge(charge.chave_cobranca);

      // Assert
      expect(charge).toBeInstanceOf(CobrancaPix);
      expect(Object.isFrozen(charge)).toBe(true);
      expect(charge.id_chave_conta).toBe("key-01");
      expect(charge.chave_conta).toBe(samplePixKey);
      expect(charge.valor_opcional).toBe(42.5);
      expect(charge.valor_dinamico).toBe(false);
      expect(charge.txid).toBe("PEDIDO123");
      expect(charge.info_adicional).toBe("Consultoria tecnica");
      expect(charge.gerado_em).toBe("2026-11-07T17:00:00.000Z");

      expect(charge.chave_cobranca).toContain("540542.50");
      expect(parsed.isStatic).toBe(true);
      expect(parsed.parsed.pixKey).toBe("eu@luizca.net");
      expect(parsed.parsed.merchantName).toBe("LUIZ HENRIQUE CANET FILHO");
      expect(parsed.parsed.merchantCity).toBe("BRASILIA");
      expect(parsed.parsed.transactionAmount).toBe(42.5);
      expect(parsed.parsed.txid).toBe("PEDIDO123");
      expect(parsed.parsed.infoAdicional).toBe("Consultoria tecnica");

      expect(charge.imagem_qrcode.svg).toContain("<svg");
      expect(charge.imagem_qrcode.dataUrl).toMatch(/^data:image\/gif;base64,/);
      expect(charge.imagem_qrcode.gifBytes).toBeInstanceOf(Uint8Array);
    });

    it("should sanitize BRL formatted monetary string ('R$ 1.250,75') and hydrate plain chave_conta object", () => {
      // Act
      const charge = executeGeneratePixCharge({
        chave_conta: samplePixKey.toJSON(),
        valor_opcional: "R$ 1.250,75",
      });
      const parsed = parsePixCharge(charge.chave_cobranca);

      // Assert
      expect(charge.valor_opcional).toBe(1250.75);
      expect(charge.valor_dinamico).toBe(false);
      expect(charge.chave_cobranca).toContain("54071250.75");
      expect(parsed.parsed.transactionAmount).toBe(1250.75);
    });
  });

  describe("Dynamic/Open Amount Charge Generation (Scenario 03 — RN03, RN04)", () => {
    it.each([[undefined], [null], [""], [0], ["0,00"], ["R$ 0,00"]])(
      "should generate a dynamic/open amount CobrancaPix without EMV tag 54 when valor_opcional is %p",
      (openAmount) => {
        // Arrange
        const useCase = new GeneratePixChargeUseCase();

        // Act
        const charge = useCase.execute({
          chaveConta: samplePixKey,
          valor_opcional: openAmount,
        });
        const parsed = parsePixCharge(charge.chave_cobranca);

        // Assert
        expect(charge.valor_opcional).toBeNull();
        expect(charge.valor_dinamico).toBe(true);
        expect(charge.txid).toBe("***");
        expect(parsed.isStatic).toBe(true);
        expect(parsed.parsed.pixKey).toBe("eu@luizca.net");
        expect(parsed.parsed.transactionAmount).toBe(0);
        expect(charge.imagem_qrcode.svg).toContain("<svg");
        expect(charge.imagem_qrcode.dataUrl).toMatch(
          /^data:image\/gif;base64,/,
        );
        expect(charge.imagem_qrcode.gifBytes).toBeInstanceOf(Uint8Array);
      },
    );

    it("should produce the exact deterministic BR Code for eu@luizca.net when open amount and default txid are used", () => {
      // Arrange
      const useCase = new GeneratePixChargeUseCase();

      // Act
      const charge = useCase.execute({
        chaveConta: samplePixKey,
      });

      // Assert
      expect(charge.chave_cobranca).toBe(
        "00020126350014br.gov.bcb.pix0113eu@luizca.net5204000053039865802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***63043C63",
      );
    });
  });

  describe("Repository Port Resolution (Scenario 04 — RN02)", () => {
    it("should resolve active ChaveConta via pixKeyRepository.getSelectedKey()", async () => {
      // Arrange
      const pixKeyRepository = {
        getSelectedKey: vi.fn().mockResolvedValue(samplePixKey),
      };
      const useCase = new GeneratePixChargeUseCase({ pixKeyRepository });

      // Act
      const charge = await useCase.execute({
        valor_opcional: 25,
      });

      // Assert
      expect(pixKeyRepository.getSelectedKey).toHaveBeenCalledTimes(1);
      expect(charge.id_chave_conta).toBe("key-01");
      expect(charge.valor_opcional).toBe(25);
    });

    it("should resolve active ChaveConta via pixKeyRepository.getSelectedKeyId() + findById()", async () => {
      // Arrange
      const pixKeyRepository = {
        getSelectedKeyId: vi.fn().mockResolvedValue("key-01"),
        findById: vi.fn().mockResolvedValue(samplePixKey),
      };
      const useCase = new GeneratePixChargeUseCase({ pixKeyRepository });

      // Act
      const charge = await useCase.execute({
        transactionAmount: 50,
      });

      // Assert
      expect(pixKeyRepository.getSelectedKeyId).toHaveBeenCalledTimes(1);
      expect(pixKeyRepository.findById).toHaveBeenCalledWith("key-01");
      expect(charge.id_chave_conta).toBe("key-01");
      expect(charge.valor_opcional).toBe(50);
    });

    it("should resolve active ChaveConta via pixKeyRepository.getSelectedKeyId() + findAll()", async () => {
      // Arrange
      const pixKeyRepository = {
        getSelectedKeyId: vi.fn().mockResolvedValue("key-01"),
        findAll: vi.fn().mockResolvedValue([samplePixKey.toJSON()]),
      };

      // Act
      const charge = await executeGeneratePixCharge(
        { valor_opcional: 10 },
        { pixKeyRepository },
      );

      // Assert
      expect(pixKeyRepository.getSelectedKeyId).toHaveBeenCalledTimes(1);
      expect(pixKeyRepository.findAll).toHaveBeenCalledTimes(1);
      expect(charge.id_chave_conta).toBe("key-01");
      expect(charge.valor_opcional).toBe(10);
    });
  });

  describe("Validation & Error Handling (Scenarios 05, 06, 07)", () => {
    it("should throw PixChargeValidationError (MISSING_PIX_KEY) when no key is provided and no repository is configured", () => {
      const useCase = new GeneratePixChargeUseCase();

      expect(() => useCase.execute()).toThrowError(
        expect.objectContaining({
          name: "PixChargeValidationError",
          code: PIX_CHARGE_ERROR_CODES.MISSING_PIX_KEY,
          field: "chave_conta",
        }),
      );
      expect(() => useCase.execute(null)).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_ERROR_CODES.MISSING_PIX_KEY,
        }),
      );
      expect(() => useCase.executeSync(null)).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_ERROR_CODES.MISSING_PIX_KEY,
        }),
      );
      expect(() => useCase.executeSync()).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_ERROR_CODES.MISSING_PIX_KEY,
        }),
      );
    });

    it("should reject with MISSING_PIX_KEY when repository has no selected key or key is not found", async () => {
      const repoWithNullId = {
        getSelectedKeyId: vi.fn().mockResolvedValue(null),
      };
      const repoWithMissingItem = {
        getSelectedKeyId: vi.fn().mockResolvedValue("non-existent"),
        findAll: vi.fn().mockResolvedValue([samplePixKey]),
      };
      const emptyRepo = {};

      await expect(
        new GeneratePixChargeUseCase({
          pixKeyRepository: repoWithNullId,
        }).execute({ valor_opcional: 10 }),
      ).rejects.toMatchObject({
        name: "PixChargeValidationError",
        code: PIX_CHARGE_ERROR_CODES.MISSING_PIX_KEY,
        field: "chave_conta",
      });

      await expect(
        new GeneratePixChargeUseCase({
          pixKeyRepository: repoWithMissingItem,
        }).execute({ valor_opcional: 10 }),
      ).rejects.toMatchObject({
        name: "PixChargeValidationError",
        code: PIX_CHARGE_ERROR_CODES.MISSING_PIX_KEY,
        field: "chave_conta",
      });

      expect(() =>
        new GeneratePixChargeUseCase({
          pixKeyRepository: emptyRepo,
        }).execute({ valor_opcional: 10 }),
      ).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_ERROR_CODES.MISSING_PIX_KEY,
        }),
      );
    });

    it("should throw PixChargeValidationError for invalid amount or invalid txid", () => {
      const useCase = new GeneratePixChargeUseCase();

      expect(() =>
        useCase.execute({
          chaveConta: samplePixKey,
          valor_opcional: -20,
        }),
      ).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_ERROR_CODES.INVALID_AMOUNT,
          field: "valor_opcional",
        }),
      );

      expect(() =>
        useCase.execute({
          chaveConta: samplePixKey,
          txid: "INVALID#TXID!",
        }),
      ).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_ERROR_CODES.INVALID_TXID,
          field: "txid",
        }),
      );
    });

    it("should throw PixChargeValidationError (CHARGE_GENERATION_FAILED) when pix-utils returns an error object", () => {
      const failingCreateStaticPix = vi.fn().mockReturnValue({
        error: "Erro interno ao montar TLV EMV",
      });
      const useCase = new GeneratePixChargeUseCase({
        createStaticPixFn: failingCreateStaticPix,
      });

      expect(() =>
        useCase.execute({
          chaveConta: samplePixKey,
          valor_opcional: 10,
        }),
      ).toThrowError(
        expect.objectContaining({
          name: "PixChargeValidationError",
          code: PIX_CHARGE_ERROR_CODES.CHARGE_GENERATION_FAILED,
          field: "chave_cobranca",
          message: "Erro interno ao montar TLV EMV",
        }),
      );
    });

    it("should use default fallback error message when pix-utils returns an error object without message", () => {
      const failingCreateStaticPix = vi.fn().mockReturnValue({
        error: "",
      });
      const useCase = new GeneratePixChargeUseCase({
        createStaticPixFn: failingCreateStaticPix,
      });

      expect(() =>
        useCase.execute({
          chaveConta: samplePixKey,
        }),
      ).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_ERROR_CODES.CHARGE_GENERATION_FAILED,
          message: "Falha ao gerar o payload da cobrança PIX.",
        }),
      );
    });
  });
});
