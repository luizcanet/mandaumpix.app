import { describe, expect, it, vi } from "vitest";
import { CobrancaPix } from "../../domain/entities/pix-charge.entity.js";
import {
  ChaveConta,
  PIX_KEY_TYPES,
} from "../../domain/entities/pix-key.entity.js";
import { GeneratePixChargeUseCase } from "./generate-pix-charge.use-case.js";
import {
  DEFAULT_QR_IMAGE_FILENAME,
  DEFAULT_QR_IMAGE_SIZE,
  DEFAULT_SHARE_TITLE,
  DistributePixChargeUseCase,
  PIX_CHARGE_DISTRIBUTION_ACTIONS,
  PIX_CHARGE_DISTRIBUTION_CHANNELS,
  PIX_CHARGE_DISTRIBUTION_ERROR_CODES,
  PixChargeDistributionError,
  assertChargeDistributionGateway,
  buildWhatsAppShareUrl,
  executeDistributePixCharge,
  extractChargeDistributionTarget,
  normalizeQrDimensions,
  normalizeQrDownloadFileName,
} from "./distribute-pix-charge.use-case.js";

describe("distribute-pix-charge.use-case.js — DistributePixChargeUseCase (TASK-02.5.1)", () => {
  const samplePixKey = ChaveConta.create({
    id: "key-distribute-01",
    rotulo: "Conta Principal",
    tipo_chave: PIX_KEY_TYPES.EMAIL,
    valor_chave: "eu@luizca.net",
    nome_recebedor: "Luiz Henrique Canet Filho",
    cidade_recebedor: "Brasília",
    criado_em: "2026-11-07T16:00:00.000Z",
  });

  const sampleCharge = GeneratePixChargeUseCase.create().execute({
    chaveConta: samplePixKey,
    valor_opcional: 42.5,
    txid: "PEDIDO123",
    gerado_em: "2026-11-07T17:00:00.000Z",
  });

  describe("Helper Functions & Error Class", () => {
    it("should construct PixChargeDistributionError with default and custom metadata", () => {
      const defaultError = new PixChargeDistributionError("Erro padrão");
      expect(defaultError).toBeInstanceOf(Error);
      expect(defaultError).toBeInstanceOf(PixChargeDistributionError);
      expect(defaultError.name).toBe("PixChargeDistributionError");
      expect(defaultError.message).toBe("Erro padrão");
      expect(defaultError.code).toBe("PIX_CHARGE_DISTRIBUTION_ERROR");
      expect(defaultError.field).toBeNull();
      expect(defaultError.cause).toBeNull();

      const cause = new Error("Permissão negada");
      const customError = new PixChargeDistributionError("Falha ao copiar", {
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.COPY_FAILED,
        field: "chave_cobranca",
        cause,
      });
      expect(customError.code).toBe(
        PIX_CHARGE_DISTRIBUTION_ERROR_CODES.COPY_FAILED,
      );
      expect(customError.field).toBe("chave_cobranca");
      expect(customError.cause).toBe(cause);
    });

    it("should build encoded WhatsApp share URL and validate non-empty text", () => {
      const url = buildWhatsAppShareUrl(sampleCharge.chave_cobranca);
      expect(url).toBe(
        `https://wa.me/?text=${encodeURIComponent(sampleCharge.chave_cobranca)}`,
      );

      expect(() => buildWhatsAppShareUrl("")).toThrowError(
        expect.objectContaining({
          name: "PixChargeDistributionError",
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_CHARGE_PAYLOAD,
          field: "chave_cobranca",
        }),
      );
      expect(() => buildWhatsAppShareUrl(null)).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_CHARGE_PAYLOAD,
        }),
      );
    });

    it("should normalize QR download file names and reject invalid characters", () => {
      expect(normalizeQrDownloadFileName()).toBe(DEFAULT_QR_IMAGE_FILENAME);
      expect(normalizeQrDownloadFileName(null)).toBe(DEFAULT_QR_IMAGE_FILENAME);
      expect(normalizeQrDownloadFileName("   ")).toBe(
        DEFAULT_QR_IMAGE_FILENAME,
      );
      expect(normalizeQrDownloadFileName("cobranca-loja")).toBe(
        "cobranca-loja.png",
      );
      expect(normalizeQrDownloadFileName("cobranca-loja.PNG")).toBe(
        "cobranca-loja.png",
      );

      expect(() => normalizeQrDownloadFileName(123)).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_QR_FILE_NAME,
          field: "fileName",
        }),
      );
      expect(() => normalizeQrDownloadFileName("../secret.png")).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_QR_FILE_NAME,
          field: "fileName",
        }),
      );
      expect(() => normalizeQrDownloadFileName(".png")).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_QR_FILE_NAME,
          field: "fileName",
        }),
      );
    });

    it("should normalize QR image dimensions and reject invalid sizes", () => {
      expect(normalizeQrDimensions()).toEqual({
        width: DEFAULT_QR_IMAGE_SIZE,
        height: DEFAULT_QR_IMAGE_SIZE,
      });
      expect(normalizeQrDimensions({ width: 1024, height: 1024 })).toEqual({
        width: 1024,
        height: 1024,
      });

      expect(() =>
        normalizeQrDimensions({ width: 0, height: 512 }),
      ).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_QR_DIMENSIONS,
          field: "width",
        }),
      );
      expect(() =>
        normalizeQrDimensions({ width: 512, height: -10 }),
      ).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_QR_DIMENSIONS,
          field: "height",
        }),
      );
    });

    it("should extract charge target from CobrancaPix instance, plain object, or BR Code string", () => {
      const fromInstance = extractChargeDistributionTarget(sampleCharge);
      expect(fromInstance.cobranca).toBeInstanceOf(CobrancaPix);
      expect(fromInstance.chave_cobranca).toBe(sampleCharge.chave_cobranca);
      expect(fromInstance.imagem_qrcode).toEqual(sampleCharge.imagem_qrcode);

      const fromWrapper = extractChargeDistributionTarget({
        cobranca: sampleCharge.toJSON(),
      });
      expect(fromWrapper.cobranca).toBeInstanceOf(CobrancaPix);
      expect(fromWrapper.chave_cobranca).toBe(sampleCharge.chave_cobranca);

      const fromChargeAlias = extractChargeDistributionTarget({
        charge: sampleCharge,
      });
      expect(fromChargeAlias.cobranca).toBe(sampleCharge);

      const fromDirectString = extractChargeDistributionTarget(
        sampleCharge.chave_cobranca,
      );
      expect(fromDirectString.cobranca).toBeNull();
      expect(fromDirectString.chave_cobranca).toBe(sampleCharge.chave_cobranca);
      expect(fromDirectString.imagem_qrcode).toBeNull();

      const fromBrCodeField = extractChargeDistributionTarget({
        brCode: sampleCharge.chave_cobranca,
        svg: sampleCharge.imagem_qrcode.svg,
        dataUrl: sampleCharge.imagem_qrcode.dataUrl,
      });
      expect(fromBrCodeField.chave_cobranca).toBe(sampleCharge.chave_cobranca);
      expect(fromBrCodeField.imagem_qrcode.svg).toBe(
        sampleCharge.imagem_qrcode.svg,
      );

      const fromExplicitImagemQrCode = extractChargeDistributionTarget({
        chave_cobranca: sampleCharge.chave_cobranca,
        imagem_qrcode: sampleCharge.imagem_qrcode,
      });
      expect(fromExplicitImagemQrCode.imagem_qrcode).toBe(
        sampleCharge.imagem_qrcode,
      );

      const fromOnlyDataUrl = extractChargeDistributionTarget({
        chave_cobranca: sampleCharge.chave_cobranca,
        dataUrl: sampleCharge.imagem_qrcode.dataUrl,
      });
      expect(fromOnlyDataUrl.imagem_qrcode).toEqual({
        svg: null,
        dataUrl: sampleCharge.imagem_qrcode.dataUrl,
      });

      const fromOnlySvg = extractChargeDistributionTarget({
        chave_cobranca: sampleCharge.chave_cobranca,
        svg: sampleCharge.imagem_qrcode.svg,
      });
      expect(fromOnlySvg.imagem_qrcode).toEqual({
        svg: sampleCharge.imagem_qrcode.svg,
        dataUrl: null,
      });
    });

    it("should throw MISSING_CHARGE_PAYLOAD or INVALID_CHARGE_PAYLOAD when input has no valid BR Code", () => {
      expect(() => extractChargeDistributionTarget()).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_CHARGE_PAYLOAD,
          field: "chave_cobranca",
        }),
      );
      expect(() => extractChargeDistributionTarget(null)).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_CHARGE_PAYLOAD,
        }),
      );
      expect(() => extractChargeDistributionTarget("   ")).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_CHARGE_PAYLOAD,
        }),
      );
      expect(() =>
        extractChargeDistributionTarget({ chave_cobranca: "INVALID-BR-CODE" }),
      ).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_CHARGE_PAYLOAD,
          field: "chave_cobranca",
        }),
      );
      expect(() =>
        extractChargeDistributionTarget({
          cobranca: { chave_conta: null },
        }),
      ).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_CHARGE_PAYLOAD,
          field: "cobranca",
        }),
      );
    });

    it("should validate distribution gateway methods via assertChargeDistributionGateway", () => {
      expect(() =>
        assertChargeDistributionGateway(null, ["copyText"]),
      ).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_DISTRIBUTION_GATEWAY,
          field: "chargeDistributionGateway",
        }),
      );
      expect(() =>
        assertChargeDistributionGateway({}, ["copyText"]),
      ).toThrowError(
        expect.objectContaining({
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_DISTRIBUTION_GATEWAY,
        }),
      );

      const gateway = { copyText: vi.fn() };
      expect(assertChargeDistributionGateway(gateway, ["copyText"])).toBe(
        gateway,
      );
      expect(assertChargeDistributionGateway(gateway)).toBe(gateway);
    });
  });

  describe("Action 1: Copy Charge Code (Scenario 01 — RN05)", () => {
    it("should copy chave_cobranca via copyText and return frozen result", async () => {
      // Arrange
      const chargeDistributionGateway = {
        copyText: vi.fn().mockResolvedValue(undefined),
      };
      const useCase = DistributePixChargeUseCase.create({
        chargeDistributionGateway,
      });

      // Act
      const result = await useCase.copyChargeCode({ cobranca: sampleCharge });

      // Assert
      expect(chargeDistributionGateway.copyText).toHaveBeenCalledTimes(1);
      expect(chargeDistributionGateway.copyText).toHaveBeenCalledWith(
        sampleCharge.chave_cobranca,
      );
      expect(Object.isFrozen(result)).toBe(true);
      expect(result).toEqual({
        action: PIX_CHARGE_DISTRIBUTION_ACTIONS.COPY,
        copied: true,
        chave_cobranca: sampleCharge.chave_cobranca,
      });
    });

    it("should support execute({ action: 'COPY' }) and gateway alias copyChargeCode", async () => {
      const shareGateway = {
        copyChargeCode: vi.fn().mockResolvedValue(undefined),
      };

      const result = await executeDistributePixCharge(
        {
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.COPY,
          chave_cobranca: sampleCharge.chave_cobranca,
        },
        { shareGateway },
      );

      expect(shareGateway.copyChargeCode).toHaveBeenCalledWith(
        sampleCharge.chave_cobranca,
      );
      expect(result.copied).toBe(true);
    });

    it("should wrap gateway failure into PixChargeDistributionError (COPY_FAILED)", async () => {
      const chargeDistributionGateway = {
        copyText: vi
          .fn()
          .mockRejectedValue(new Error("Clipboard write blocked")),
      };
      const useCase = new DistributePixChargeUseCase({
        chargeDistributionGateway,
      });

      await expect(useCase.copyChargeCode(sampleCharge)).rejects.toMatchObject({
        name: "PixChargeDistributionError",
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.COPY_FAILED,
        field: "chave_cobranca",
        message: "Clipboard write blocked",
      });

      const emptyMessageGateway = {
        copyText: vi.fn().mockRejectedValue({}),
      };
      await expect(
        new DistributePixChargeUseCase({
          chargeDistributionGateway: emptyMessageGateway,
        }).copyChargeCode(sampleCharge),
      ).rejects.toMatchObject({
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.COPY_FAILED,
        message:
          "Não foi possível copiar o código PIX para a área de transferência.",
      });
    });
  });

  describe("Action 2: Share Charge via Web Share API or WhatsApp Fallback (Scenarios 02 & 03 — RN05)", () => {
    it("should share via native Web Share API when gateway supports share and canShare is true", async () => {
      // Arrange
      const chargeDistributionGateway = {
        canShare: vi.fn().mockReturnValue(true),
        share: vi.fn().mockResolvedValue(undefined),
        shareViaWhatsApp: vi.fn(),
      };
      const useCase = new DistributePixChargeUseCase({
        chargeDistributionGateway,
      });

      // Act
      const result = await useCase.shareCharge({
        cobranca: sampleCharge,
      });

      // Assert
      expect(chargeDistributionGateway.canShare).toHaveBeenCalledTimes(1);
      expect(chargeDistributionGateway.share).toHaveBeenCalledWith({
        title: DEFAULT_SHARE_TITLE,
        text: sampleCharge.chave_cobranca,
      });
      expect(chargeDistributionGateway.shareViaWhatsApp).not.toHaveBeenCalled();
      expect(Object.isFrozen(result)).toBe(true);
      expect(result).toEqual({
        action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
        shared: true,
        channel: PIX_CHARGE_DISTRIBUTION_CHANNELS.WEB_SHARE,
        chave_cobranca: sampleCharge.chave_cobranca,
        whatsappUrl: buildWhatsAppShareUrl(sampleCharge.chave_cobranca),
      });
    });

    it("should pass custom title, text, and files when sharing via native Web Share API without explicit canShare method", async () => {
      const mockFile = { name: "qrcode.png" };
      const distributionGateway = {
        share: vi.fn().mockResolvedValue(undefined),
      };
      const useCase = new DistributePixChargeUseCase({ distributionGateway });

      const result = await useCase.execute({
        action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
        cobranca: sampleCharge,
        title: "Pagamento Loja",
        text: `PIX: ${sampleCharge.chave_cobranca}`,
        files: [mockFile],
      });

      expect(distributionGateway.share).toHaveBeenCalledWith({
        title: "Pagamento Loja",
        text: `PIX: ${sampleCharge.chave_cobranca}`,
        files: [mockFile],
      });
      expect(result.channel).toBe(PIX_CHARGE_DISTRIBUTION_CHANNELS.WEB_SHARE);
    });

    it("should fallback to WhatsApp when canShare returns false or native share is unavailable", async () => {
      // Arrange
      const chargeDistributionGateway = {
        canShare: vi.fn().mockResolvedValue(false),
        share: vi.fn(),
        shareViaWhatsApp: vi.fn().mockResolvedValue(undefined),
      };
      const useCase = new DistributePixChargeUseCase({
        chargeDistributionGateway,
      });

      // Act
      const result = await useCase.shareCharge({ cobranca: sampleCharge });

      // Assert
      const expectedWhatsappUrl = buildWhatsAppShareUrl(
        sampleCharge.chave_cobranca,
      );
      expect(chargeDistributionGateway.share).not.toHaveBeenCalled();
      expect(chargeDistributionGateway.shareViaWhatsApp).toHaveBeenCalledWith({
        text: sampleCharge.chave_cobranca,
        url: expectedWhatsappUrl,
      });
      expect(result).toEqual({
        action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
        shared: true,
        channel: PIX_CHARGE_DISTRIBUTION_CHANNELS.WHATSAPP,
        chave_cobranca: sampleCharge.chave_cobranca,
        whatsappUrl: expectedWhatsappUrl,
      });
    });

    it("should use WhatsApp channel directly when channel='WHATSAPP' is requested or openExternalUrl alias is provided", async () => {
      const chargeDistributionGateway = {
        share: vi.fn(),
        openExternalUrl: vi.fn().mockResolvedValue(undefined),
      };
      const useCase = new DistributePixChargeUseCase({
        chargeDistributionGateway,
      });

      const result = await useCase.shareCharge({
        cobranca: sampleCharge,
        channel: PIX_CHARGE_DISTRIBUTION_CHANNELS.WHATSAPP,
      });

      const expectedWhatsappUrl = buildWhatsAppShareUrl(
        sampleCharge.chave_cobranca,
      );
      expect(chargeDistributionGateway.share).not.toHaveBeenCalled();
      expect(chargeDistributionGateway.openExternalUrl).toHaveBeenCalledWith(
        expectedWhatsappUrl,
      );
      expect(result.channel).toBe(PIX_CHARGE_DISTRIBUTION_CHANNELS.WHATSAPP);

      const directStringShare = await useCase.shareCharge(
        sampleCharge.chave_cobranca,
      );
      expect(directStringShare.channel).toBe(
        PIX_CHARGE_DISTRIBUTION_CHANNELS.WEB_SHARE,
      );
    });

    it("should throw MISSING_DISTRIBUTION_GATEWAY when neither share nor WhatsApp handler is provided, and wrap SHARE_FAILED errors", async () => {
      const invalidGateway = {
        canShare: () => false,
      };
      const useCaseWithInvalidGateway = new DistributePixChargeUseCase({
        chargeDistributionGateway: invalidGateway,
      });

      await expect(
        useCaseWithInvalidGateway.shareCharge(sampleCharge),
      ).rejects.toMatchObject({
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_DISTRIBUTION_GATEWAY,
      });

      const failingShareGateway = {
        share: vi.fn().mockRejectedValue(new Error("Share cancelled")),
      };
      await expect(
        new DistributePixChargeUseCase({
          chargeDistributionGateway: failingShareGateway,
        }).shareCharge(sampleCharge),
      ).rejects.toMatchObject({
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.SHARE_FAILED,
        message: "Share cancelled",
      });

      const failingEmptyGateway = {
        shareViaWhatsApp: vi.fn().mockRejectedValue({}),
      };
      await expect(
        new DistributePixChargeUseCase({
          chargeDistributionGateway: failingEmptyGateway,
        }).shareCharge(sampleCharge),
      ).rejects.toMatchObject({
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.SHARE_FAILED,
        message: "Não foi possível compartilhar a cobrança PIX.",
      });
    });
  });

  describe("Action 3: Download QR Code PNG (Scenario 04 — RN05)", () => {
    it("should download QR Code PNG with normalized fileName and default 512x512 dimensions", async () => {
      // Arrange
      const chargeDistributionGateway = {
        downloadQrCodePng: vi.fn().mockResolvedValue(undefined),
      };
      const useCase = new DistributePixChargeUseCase({
        chargeDistributionGateway,
      });

      // Act
      const result = await useCase.downloadQrImage({
        cobranca: sampleCharge,
        fileName: "pix-loja",
      });

      // Assert
      expect(chargeDistributionGateway.downloadQrCodePng).toHaveBeenCalledTimes(
        1,
      );
      expect(chargeDistributionGateway.downloadQrCodePng).toHaveBeenCalledWith({
        chave_cobranca: sampleCharge.chave_cobranca,
        svg: sampleCharge.imagem_qrcode.svg,
        dataUrl: sampleCharge.imagem_qrcode.dataUrl,
        fileName: "pix-loja.png",
        width: 512,
        height: 512,
      });
      expect(Object.isFrozen(result)).toBe(true);
      expect(result).toEqual({
        action: PIX_CHARGE_DISTRIBUTION_ACTIONS.DOWNLOAD_QR,
        downloaded: true,
        fileName: "pix-loja.png",
        width: 512,
        height: 512,
        chave_cobranca: sampleCharge.chave_cobranca,
      });
    });

    it("should support downloadQrImage alias on gateway and execute({ action: 'DOWNLOAD_QR' }) with string BR Code", async () => {
      const chargeDistributionGateway = {
        downloadQrImage: vi.fn().mockResolvedValue(undefined),
      };

      const result = await executeDistributePixCharge(
        {
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.DOWNLOAD_QR,
          chave_cobranca: sampleCharge.chave_cobranca,
          width: 256,
          height: 256,
        },
        { chargeDistributionGateway },
      );

      expect(chargeDistributionGateway.downloadQrImage).toHaveBeenCalledWith({
        chave_cobranca: sampleCharge.chave_cobranca,
        svg: null,
        dataUrl: null,
        fileName: DEFAULT_QR_IMAGE_FILENAME,
        width: 256,
        height: 256,
      });
      expect(result.downloaded).toBe(true);
      expect(result.fileName).toBe(DEFAULT_QR_IMAGE_FILENAME);

      const directStringDownload = await new DistributePixChargeUseCase({
        chargeDistributionGateway,
      }).downloadQrImage(sampleCharge.chave_cobranca);
      expect(directStringDownload.downloaded).toBe(true);
    });

    it("should wrap download failure into PixChargeDistributionError (DOWNLOAD_FAILED)", async () => {
      const chargeDistributionGateway = {
        downloadQrCodePng: vi
          .fn()
          .mockRejectedValue(new Error("Canvas export error")),
      };
      const useCase = new DistributePixChargeUseCase({
        chargeDistributionGateway,
      });

      await expect(useCase.downloadQrImage(sampleCharge)).rejects.toMatchObject(
        {
          name: "PixChargeDistributionError",
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.DOWNLOAD_FAILED,
          field: "imagem_qrcode",
          message: "Canvas export error",
        },
      );

      const emptyErrorGateway = {
        downloadQrCodePng: vi.fn().mockRejectedValue({}),
      };
      await expect(
        new DistributePixChargeUseCase({
          chargeDistributionGateway: emptyErrorGateway,
        }).downloadQrImage(sampleCharge),
      ).rejects.toMatchObject({
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.DOWNLOAD_FAILED,
        message: "Não foi possível salvar a imagem PNG do QR Code.",
      });
    });
  });

  describe("Unified execute() Dispatcher Validation (Scenario 05)", () => {
    it("should throw INVALID_DISTRIBUTION_ACTION when action is missing or unknown", async () => {
      const useCase = new DistributePixChargeUseCase({
        chargeDistributionGateway: { copyText: vi.fn() },
      });

      await expect(useCase.execute()).rejects.toMatchObject({
        name: "PixChargeDistributionError",
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_DISTRIBUTION_ACTION,
        field: "action",
      });

      await expect(useCase.execute(null)).rejects.toMatchObject({
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_DISTRIBUTION_ACTION,
      });

      await expect(
        useCase.execute({ action: "UNKNOWN_ACTION", cobranca: sampleCharge }),
      ).rejects.toMatchObject({
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_DISTRIBUTION_ACTION,
        field: "action",
      });

      const emptyGatewayUseCase = new DistributePixChargeUseCase({
        chargeDistributionGateway: {},
      });
      await expect(emptyGatewayUseCase.copyChargeCode()).rejects.toMatchObject({
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_DISTRIBUTION_GATEWAY,
      });
      await expect(emptyGatewayUseCase.downloadQrImage()).rejects.toMatchObject(
        {
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_DISTRIBUTION_GATEWAY,
        },
      );
      await expect(
        new DistributePixChargeUseCase().shareCharge(),
      ).rejects.toMatchObject({
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_DISTRIBUTION_GATEWAY,
      });
    });
  });
});
