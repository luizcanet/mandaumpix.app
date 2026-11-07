import { describe, expect, it, vi } from "vitest";
import {
  DistributePixChargeUseCase,
  PIX_CHARGE_DISTRIBUTION_ACTIONS,
  PIX_CHARGE_DISTRIBUTION_ERROR_CODES,
} from "../../application/use-cases/distribute-pix-charge.use-case.js";
import {
  BROWSER_SHARE_ADAPTER_ERROR_CODES,
  BrowserShareAdapter,
  BrowserShareAdapterError,
  createBrowserShareAdapter,
} from "./browser-share.adapter.js";

const VALID_BR_CODE =
  "00020126350014br.gov.bcb.pix0113eu@luizca.net5204000053039865802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***63043C63";

function createMockNavigatorTarget({
  hasClipboard = true,
  writeTextImpl = vi.fn().mockResolvedValue(undefined),
} = {}) {
  const clipboard = hasClipboard
    ? {
        writeText: writeTextImpl,
      }
    : undefined;

  return {
    clipboard,
  };
}

describe("BrowserShareAdapter — TASK-03.3.1 (Clipboard API & Constantes)", () => {
  describe("Constantes e Erros", () => {
    it("deve expor os códigos de erro padronizados congelados", () => {
      expect(BROWSER_SHARE_ADAPTER_ERROR_CODES).toEqual({
        CLIPBOARD_UNAVAILABLE: "CLIPBOARD_UNAVAILABLE",
        CLIPBOARD_WRITE_FAILED: "CLIPBOARD_WRITE_FAILED",
        SHARE_UNAVAILABLE: "SHARE_UNAVAILABLE",
        SHARE_FAILED: "SHARE_FAILED",
        SHARE_ABORTED: "SHARE_ABORTED",
        POPUP_BLOCKED: "POPUP_BLOCKED",
        DOWNLOAD_FAILED: "DOWNLOAD_FAILED",
        INVALID_PAYLOAD: "INVALID_PAYLOAD",
      });
      expect(Object.isFrozen(BROWSER_SHARE_ADAPTER_ERROR_CODES)).toBe(true);
    });

    it("deve instanciar BrowserShareAdapterError com valores padrão quando options não for informado", () => {
      const error = new BrowserShareAdapterError("Erro genérico");

      expect(error.name).toBe("BrowserShareAdapterError");
      expect(error.message).toBe("Erro genérico");
      expect(error.code).toBe("BROWSER_SHARE_ADAPTER_ERROR");
      expect(error.field).toBeNull();
      expect(error.cause).toBeNull();
    });

    it("deve instanciar BrowserShareAdapterError com propriedades estruturadas", () => {
      const cause = new Error("Permissão negada");
      const error = new BrowserShareAdapterError("Falha na escrita", {
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.CLIPBOARD_WRITE_FAILED,
        field: "text",
        cause,
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BrowserShareAdapterError);
      expect(error.name).toBe("BrowserShareAdapterError");
      expect(error.message).toBe("Falha na escrita");
      expect(error.code).toBe("CLIPBOARD_WRITE_FAILED");
      expect(error.field).toBe("text");
      expect(error.cause).toBe(cause);
    });
  });

  describe("Instanciação e Fábrica", () => {
    it("deve instanciar com alvos padrão quando nenhum argumento for passado", () => {
      const adapter = new BrowserShareAdapter();
      const created = createBrowserShareAdapter();

      expect(adapter).toBeInstanceOf(BrowserShareAdapter);
      expect(created).toBeInstanceOf(BrowserShareAdapter);
      expect(adapter.windowTarget).toBe(globalThis.window);
      expect(adapter.navigatorTarget).toBe(globalThis.navigator);
      expect(adapter.documentTarget).toBe(globalThis.document);
      expect(adapter.exportQrCodePngFn).toBeNull();
    });

    it("deve instanciar BrowserShareAdapter diretamente ou via createBrowserShareAdapter", () => {
      const mockNavigator = createMockNavigatorTarget();
      const adapter1 = new BrowserShareAdapter({
        navigatorTarget: mockNavigator,
      });
      const adapter2 = createBrowserShareAdapter({
        navigatorTarget: mockNavigator,
      });

      expect(adapter1).toBeInstanceOf(BrowserShareAdapter);
      expect(adapter2).toBeInstanceOf(BrowserShareAdapter);
    });
  });

  describe("Validação de Entrada para copyText", () => {
    it("deve lançar BrowserShareAdapterError quando o texto for nulo, indefinido ou vazio", async () => {
      const mockNavigator = createMockNavigatorTarget();
      const adapter = new BrowserShareAdapter({
        navigatorTarget: mockNavigator,
      });

      await expect(adapter.copyText("")).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
        field: "text",
      });

      await expect(adapter.copyText("   ")).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
        field: "text",
      });

      await expect(adapter.copyText(null)).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
        field: "text",
      });

      await expect(adapter.copyText(12345)).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
        field: "text",
      });
    });
  });

  describe("Operação copyText e alias copyChargeCode", () => {
    it("deve copiar o texto com sucesso usando navigator.clipboard.writeText", async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      const mockNavigator = createMockNavigatorTarget({
        writeTextImpl: writeTextSpy,
      });
      const adapter = new BrowserShareAdapter({
        navigatorTarget: mockNavigator,
      });

      const result = await adapter.copyText(VALID_BR_CODE);

      expect(writeTextSpy).toHaveBeenCalledTimes(1);
      expect(writeTextSpy).toHaveBeenCalledWith(VALID_BR_CODE);
      expect(result).toEqual({
        action: PIX_CHARGE_DISTRIBUTION_ACTIONS.COPY,
        copied: true,
        text: VALID_BR_CODE,
      });
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("deve suportar o alias copyChargeCode delegando para copyText", async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      const mockNavigator = createMockNavigatorTarget({
        writeTextImpl: writeTextSpy,
      });
      const adapter = new BrowserShareAdapter({
        navigatorTarget: mockNavigator,
      });

      const result = await adapter.copyChargeCode(VALID_BR_CODE);

      expect(writeTextSpy).toHaveBeenCalledTimes(1);
      expect(writeTextSpy).toHaveBeenCalledWith(VALID_BR_CODE);
      expect(result.copied).toBe(true);
    });

    it("deve lançar CLIPBOARD_UNAVAILABLE quando navigator.clipboard não estiver disponível", async () => {
      const mockNavigator = createMockNavigatorTarget({ hasClipboard: false });
      const adapter = new BrowserShareAdapter({
        navigatorTarget: mockNavigator,
      });

      await expect(adapter.copyText(VALID_BR_CODE)).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.CLIPBOARD_UNAVAILABLE,
        field: "clipboard",
      });
    });

    it("deve lançar CLIPBOARD_UNAVAILABLE quando navigatorTarget for nulo", async () => {
      const adapter = new BrowserShareAdapter({ navigatorTarget: null });

      await expect(adapter.copyText(VALID_BR_CODE)).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.CLIPBOARD_UNAVAILABLE,
        field: "clipboard",
      });
    });

    it("deve usar mensagem padrão quando writeText rejeitar sem mensagem de erro", async () => {
      const writeTextSpy = vi.fn().mockRejectedValue({});
      const mockNavigator = createMockNavigatorTarget({
        writeTextImpl: writeTextSpy,
      });
      const adapter = new BrowserShareAdapter({
        navigatorTarget: mockNavigator,
      });

      await expect(adapter.copyText(VALID_BR_CODE)).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.CLIPBOARD_WRITE_FAILED,
        message:
          "Falha ao gravar texto na área de transferência do dispositivo.",
      });
    });

    it("deve lançar CLIPBOARD_WRITE_FAILED quando writeText rejeitar a Promise", async () => {
      const notAllowedError = new Error(
        "NotAllowedError: Read/Write permission denied.",
      );
      notAllowedError.name = "NotAllowedError";

      const writeTextSpy = vi.fn().mockRejectedValue(notAllowedError);
      const mockNavigator = createMockNavigatorTarget({
        writeTextImpl: writeTextSpy,
      });
      const adapter = new BrowserShareAdapter({
        navigatorTarget: mockNavigator,
      });

      await expect(adapter.copyText(VALID_BR_CODE)).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.CLIPBOARD_WRITE_FAILED,
        field: "text",
        cause: notAllowedError,
      });
    });
  });

  describe("Integração com DistributePixChargeUseCase", () => {
    it("deve funcionar perfeitamente como porta chargeDistributionGateway para cópia de código PIX", async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      const mockNavigator = createMockNavigatorTarget({
        writeTextImpl: writeTextSpy,
      });
      const adapter = new BrowserShareAdapter({
        navigatorTarget: mockNavigator,
      });

      const useCase = new DistributePixChargeUseCase({
        chargeDistributionGateway: adapter,
      });

      const result = await useCase.copyChargeCode({
        chave_cobranca: VALID_BR_CODE,
      });

      expect(writeTextSpy).toHaveBeenCalledWith(VALID_BR_CODE);
      expect(result).toEqual({
        action: PIX_CHARGE_DISTRIBUTION_ACTIONS.COPY,
        copied: true,
        chave_cobranca: VALID_BR_CODE,
      });
    });

    it("deve permitir que DistributePixChargeUseCase converta falha em PixChargeDistributionError com código COPY_FAILED", async () => {
      const writeTextSpy = vi
        .fn()
        .mockRejectedValue(new Error("Acesso negado"));
      const mockNavigator = createMockNavigatorTarget({
        writeTextImpl: writeTextSpy,
      });
      const adapter = new BrowserShareAdapter({
        navigatorTarget: mockNavigator,
      });

      const useCase = new DistributePixChargeUseCase({
        chargeDistributionGateway: adapter,
      });

      await expect(
        useCase.copyChargeCode({ chave_cobranca: VALID_BR_CODE }),
      ).rejects.toMatchObject({
        name: "PixChargeDistributionError",
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.COPY_FAILED,
      });
    });
  });
});
