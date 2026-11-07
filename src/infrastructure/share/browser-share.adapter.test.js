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
  hasShare = true,
  shareImpl = vi.fn().mockResolvedValue(undefined),
  hasCanShare = true,
  canShareImpl = vi.fn().mockReturnValue(true),
} = {}) {
  const clipboard = hasClipboard
    ? {
        writeText: writeTextImpl,
      }
    : undefined;

  const target = {
    clipboard,
  };

  if (hasShare) {
    target.share = shareImpl;
  }

  if (hasCanShare) {
    target.canShare = canShareImpl;
  }

  return target;
}

function createMockWindowTarget({
  hasOpen = true,
  openImpl = vi.fn().mockReturnValue({ closed: false }),
  urlTarget = null,
} = {}) {
  const windowObj = {};

  if (hasOpen) {
    windowObj.open = openImpl;
  }

  if (urlTarget) {
    windowObj.URL = urlTarget;
  }

  return windowObj;
}

function createMockDocumentTarget({
  hasCreateElement = true,
  createElementImpl = null,
} = {}) {
  if (!hasCreateElement) {
    return {};
  }

  const appendedChildren = [];
  const body = {
    appendChild: vi.fn((el) => {
      appendedChildren.push(el);
      return el;
    }),
    removeChild: vi.fn((el) => {
      const idx = appendedChildren.indexOf(el);
      if (idx !== -1) {
        appendedChildren.splice(idx, 1);
      }
      return el;
    }),
  };

  const createElement =
    createElementImpl ||
    vi.fn((tagName) => {
      return {
        tagName: tagName.toUpperCase(),
        href: "",
        download: "",
        style: {},
        click: vi.fn(),
      };
    });

  return {
    body,
    createElement,
  };
}

function createMockUrlTarget({ hasCreate = true, hasRevoke = true } = {}) {
  const urlObj = {};

  if (hasCreate) {
    urlObj.createObjectURL = vi.fn(
      () => `blob:http://localhost/${Math.random().toString(36).slice(2)}`,
    );
  }

  if (hasRevoke) {
    urlObj.revokeObjectURL = vi.fn();
  }

  return urlObj;
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

  describe("BrowserShareAdapter — TASK-03.3.2 (Web Share API, Fallback WhatsApp & Janelas Seguras)", () => {
    describe("Método canShare", () => {
      it("deve retornar true quando navigator.canShare retornar true", () => {
        const canShareSpy = vi.fn().mockReturnValue(true);
        const mockNavigator = createMockNavigatorTarget({
          canShareImpl: canShareSpy,
        });
        const adapter = new BrowserShareAdapter({
          navigatorTarget: mockNavigator,
        });

        const result = adapter.canShare({ title: "PIX", text: VALID_BR_CODE });

        expect(canShareSpy).toHaveBeenCalledWith({
          title: "PIX",
          text: VALID_BR_CODE,
        });
        expect(result).toBe(true);
      });

      it("deve retornar false quando navigator.canShare retornar false", () => {
        const canShareSpy = vi.fn().mockReturnValue(false);
        const mockNavigator = createMockNavigatorTarget({
          canShareImpl: canShareSpy,
        });
        const adapter = new BrowserShareAdapter({
          navigatorTarget: mockNavigator,
        });

        expect(adapter.canShare({ title: "PIX", text: VALID_BR_CODE })).toBe(
          false,
        );
      });

      it("deve retornar true como fallback quando navigator.share existir mas canShare não estiver definido", () => {
        const mockNavigator = createMockNavigatorTarget({
          hasShare: true,
          hasCanShare: false,
        });
        const adapter = new BrowserShareAdapter({
          navigatorTarget: mockNavigator,
        });

        expect(adapter.canShare({ title: "PIX", text: VALID_BR_CODE })).toBe(
          true,
        );
      });

      it("deve retornar false quando navigator.share não existir ou navigatorTarget for nulo", () => {
        const mockNavigator = createMockNavigatorTarget({
          hasShare: false,
          hasCanShare: false,
        });
        const adapter1 = new BrowserShareAdapter({
          navigatorTarget: mockNavigator,
        });
        const adapter2 = new BrowserShareAdapter({ navigatorTarget: null });

        expect(adapter1.canShare({ text: VALID_BR_CODE })).toBe(false);
        expect(adapter2.canShare({ text: VALID_BR_CODE })).toBe(false);
      });
    });

    describe("Método share", () => {
      it("deve disparar navigator.share com sucesso e retornar payload congelado", async () => {
        const shareSpy = vi.fn().mockResolvedValue(undefined);
        const mockNavigator = createMockNavigatorTarget({
          shareImpl: shareSpy,
        });
        const adapter = new BrowserShareAdapter({
          navigatorTarget: mockNavigator,
        });

        const sharePayload = {
          title: "Manda um PIX",
          text: VALID_BR_CODE,
        };

        const result = await adapter.share(sharePayload);

        expect(shareSpy).toHaveBeenCalledWith(sharePayload);
        expect(result).toEqual({
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
          shared: true,
          aborted: false,
          payload: sharePayload,
        });
        expect(Object.isFrozen(result)).toBe(true);
      });

      it("deve lançar INVALID_PAYLOAD quando payload for nulo ou não for objeto", async () => {
        const adapter = new BrowserShareAdapter({
          navigatorTarget: createMockNavigatorTarget(),
        });

        await expect(adapter.share(null)).rejects.toMatchObject({
          name: "BrowserShareAdapterError",
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
          field: "payload",
        });

        await expect(adapter.share("texto")).rejects.toMatchObject({
          name: "BrowserShareAdapterError",
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
          field: "payload",
        });
      });

      it("deve lançar SHARE_UNAVAILABLE quando navigator.share não estiver disponível", async () => {
        const adapter = new BrowserShareAdapter({
          navigatorTarget: createMockNavigatorTarget({ hasShare: false }),
        });

        await expect(
          adapter.share({ text: VALID_BR_CODE }),
        ).rejects.toMatchObject({
          name: "BrowserShareAdapterError",
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.SHARE_UNAVAILABLE,
          field: "share",
        });
      });

      it("deve tratar AbortError graciosamente retornando shared: false e aborted: true", async () => {
        const abortError = new Error("Share canceled by user.");
        abortError.name = "AbortError";

        const shareSpy = vi.fn().mockRejectedValue(abortError);
        const adapter = new BrowserShareAdapter({
          navigatorTarget: createMockNavigatorTarget({ shareImpl: shareSpy }),
        });

        const result = await adapter.share({ text: VALID_BR_CODE });

        expect(result).toEqual({
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
          shared: false,
          aborted: true,
        });
        expect(Object.isFrozen(result)).toBe(true);
      });

      it("deve lançar SHARE_FAILED quando navigator.share falhar com erro inesperado", async () => {
        const networkError = new Error("Internal share provider failure.");
        const shareSpy = vi.fn().mockRejectedValue(networkError);
        const adapter = new BrowserShareAdapter({
          navigatorTarget: createMockNavigatorTarget({ shareImpl: shareSpy }),
        });

        await expect(
          adapter.share({ text: VALID_BR_CODE }),
        ).rejects.toMatchObject({
          name: "BrowserShareAdapterError",
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.SHARE_FAILED,
          field: "share",
          cause: networkError,
        });
      });

      it("deve utilizar mensagem padrão de falha quando erro em share não tiver mensagem", async () => {
        const shareSpy = vi.fn().mockRejectedValue({});
        const adapter = new BrowserShareAdapter({
          navigatorTarget: createMockNavigatorTarget({ shareImpl: shareSpy }),
        });

        await expect(
          adapter.share({ text: VALID_BR_CODE }),
        ).rejects.toMatchObject({
          name: "BrowserShareAdapterError",
          code: BROWSER_SHARE_ADAPTER_ERROR_CODES.SHARE_FAILED,
          message: "Falha ao acionar o compartilhamento nativo do sistema.",
        });
      });
    });

    describe("Método openExternalUrl", () => {
      it("deve abrir URL com target '_blank' e 'noopener,noreferrer' por padrão", () => {
        const openSpy = vi.fn().mockReturnValue({ closed: false });
        const mockWindow = createMockWindowTarget({ openImpl: openSpy });
        const adapter = new BrowserShareAdapter({ windowTarget: mockWindow });

        const opened = adapter.openExternalUrl("https://wa.me/?text=teste");

        expect(openSpy).toHaveBeenCalledWith(
          "https://wa.me/?text=teste",
          "_blank",
          "noopener,noreferrer",
        );
        expect(opened).toEqual({ closed: false });
      });

      it("deve lançar INVALID_PAYLOAD quando url for inválida ou vazia", () => {
        const adapter = new BrowserShareAdapter({
          windowTarget: createMockWindowTarget(),
        });

        expect(() => adapter.openExternalUrl("")).toThrow(
          BrowserShareAdapterError,
        );
        expect(() => adapter.openExternalUrl(null)).toThrow(
          BrowserShareAdapterError,
        );
      });

      it("deve lançar POPUP_BLOCKED quando windowTarget ou window.open não estiver disponível", () => {
        const adapter1 = new BrowserShareAdapter({ windowTarget: null });
        const adapter2 = new BrowserShareAdapter({
          windowTarget: createMockWindowTarget({ hasOpen: false }),
        });

        expect(() =>
          adapter1.openExternalUrl("https://wa.me/?text=teste"),
        ).toThrow(
          expect.objectContaining({
            name: "BrowserShareAdapterError",
            code: BROWSER_SHARE_ADAPTER_ERROR_CODES.POPUP_BLOCKED,
          }),
        );

        expect(() =>
          adapter2.openExternalUrl("https://wa.me/?text=teste"),
        ).toThrow(
          expect.objectContaining({
            name: "BrowserShareAdapterError",
            code: BROWSER_SHARE_ADAPTER_ERROR_CODES.POPUP_BLOCKED,
          }),
        );
      });

      it("deve lançar POPUP_BLOCKED quando window.open retornar null (bloqueador ativo)", () => {
        const openSpy = vi.fn().mockReturnValue(null);
        const mockWindow = createMockWindowTarget({ openImpl: openSpy });
        const adapter = new BrowserShareAdapter({ windowTarget: mockWindow });

        expect(() =>
          adapter.openExternalUrl("https://wa.me/?text=teste"),
        ).toThrow(
          expect.objectContaining({
            name: "BrowserShareAdapterError",
            code: BROWSER_SHARE_ADAPTER_ERROR_CODES.POPUP_BLOCKED,
            field: "url",
          }),
        );
      });

      it("deve lançar POPUP_BLOCKED quando window.open lançar uma exceção", () => {
        const openSpy = vi.fn().mockImplementation(() => {
          throw new Error("Window open denied");
        });
        const mockWindow = createMockWindowTarget({ openImpl: openSpy });
        const adapter = new BrowserShareAdapter({ windowTarget: mockWindow });

        expect(() =>
          adapter.openExternalUrl("https://wa.me/?text=teste"),
        ).toThrow(
          expect.objectContaining({
            name: "BrowserShareAdapterError",
            code: BROWSER_SHARE_ADAPTER_ERROR_CODES.POPUP_BLOCKED,
            field: "url",
          }),
        );
      });

      it("deve usar mensagem padrão quando window.open lançar erro sem mensagem", () => {
        const openSpy = vi.fn().mockImplementation(() => {
          throw {};
        });
        const mockWindow = createMockWindowTarget({ openImpl: openSpy });
        const adapter = new BrowserShareAdapter({ windowTarget: mockWindow });

        expect(() =>
          adapter.openExternalUrl("https://wa.me/?text=teste"),
        ).toThrow(
          expect.objectContaining({
            name: "BrowserShareAdapterError",
            code: BROWSER_SHARE_ADAPTER_ERROR_CODES.POPUP_BLOCKED,
            message: "Falha ao abrir a URL externa no navegador.",
          }),
        );
      });
    });

    describe("Método shareViaWhatsApp", () => {
      it("deve construir URL do WhatsApp e abrir janela segura quando apenas text for passado", () => {
        const openSpy = vi.fn().mockReturnValue({ closed: false });
        const mockWindow = createMockWindowTarget({ openImpl: openSpy });
        const adapter = new BrowserShareAdapter({ windowTarget: mockWindow });

        const expectedUrl = `https://wa.me/?text=${encodeURIComponent(VALID_BR_CODE)}`;
        const result = adapter.shareViaWhatsApp({ text: VALID_BR_CODE });

        expect(openSpy).toHaveBeenCalledWith(
          expectedUrl,
          "_blank",
          "noopener,noreferrer",
        );
        expect(result).toEqual({
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
          shared: true,
          channel: "WHATSAPP",
          url: expectedUrl,
        });
        expect(Object.isFrozen(result)).toBe(true);
      });

      it("deve respeitar url pré-construída fornecida no payload", () => {
        const openSpy = vi.fn().mockReturnValue({ closed: false });
        const mockWindow = createMockWindowTarget({ openImpl: openSpy });
        const adapter = new BrowserShareAdapter({ windowTarget: mockWindow });

        const customUrl = "https://wa.me/?text=custom-text";
        const result = adapter.shareViaWhatsApp({ url: customUrl });

        expect(openSpy).toHaveBeenCalledWith(
          customUrl,
          "_blank",
          "noopener,noreferrer",
        );
        expect(result.url).toBe(customUrl);
      });

      it("deve lançar INVALID_PAYLOAD quando nem url nem text válidos forem fornecidos", () => {
        const adapter = new BrowserShareAdapter({
          windowTarget: createMockWindowTarget(),
        });

        expect(() => adapter.shareViaWhatsApp({})).toThrow(
          BrowserShareAdapterError,
        );
        expect(() => adapter.shareViaWhatsApp({ text: "   " })).toThrow(
          BrowserShareAdapterError,
        );
      });
    });

    describe("Integração de Compartilhamento com DistributePixChargeUseCase", () => {
      it("deve acionar Web Share nativo quando suportado pelo adaptador", async () => {
        const shareSpy = vi.fn().mockResolvedValue(undefined);
        const canShareSpy = vi.fn().mockReturnValue(true);
        const mockNavigator = createMockNavigatorTarget({
          shareImpl: shareSpy,
          canShareImpl: canShareSpy,
        });
        const adapter = new BrowserShareAdapter({
          navigatorTarget: mockNavigator,
        });

        const useCase = new DistributePixChargeUseCase({
          chargeDistributionGateway: adapter,
        });

        const result = await useCase.shareCharge({
          chave_cobranca: VALID_BR_CODE,
          title: "Manda um PIX",
        });

        expect(shareSpy).toHaveBeenCalledWith({
          title: "Manda um PIX",
          text: VALID_BR_CODE,
        });
        expect(result).toEqual({
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
          shared: true,
          channel: "WEB_SHARE",
          chave_cobranca: VALID_BR_CODE,
          whatsappUrl: `https://wa.me/?text=${encodeURIComponent(VALID_BR_CODE)}`,
        });
      });

      it("deve utilizar fallback para shareViaWhatsApp quando canShare retornar false", async () => {
        const openSpy = vi.fn().mockReturnValue({ closed: false });
        const mockWindow = createMockWindowTarget({ openImpl: openSpy });
        const mockNavigator = createMockNavigatorTarget({
          hasShare: true,
          canShareImpl: vi.fn().mockReturnValue(false),
        });
        const adapter = new BrowserShareAdapter({
          navigatorTarget: mockNavigator,
          windowTarget: mockWindow,
        });

        const useCase = new DistributePixChargeUseCase({
          chargeDistributionGateway: adapter,
        });

        const result = await useCase.shareCharge({
          chave_cobranca: VALID_BR_CODE,
        });

        const expectedUrl = `https://wa.me/?text=${encodeURIComponent(VALID_BR_CODE)}`;
        expect(openSpy).toHaveBeenCalledWith(
          expectedUrl,
          "_blank",
          "noopener,noreferrer",
        );
        expect(result).toEqual({
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
          shared: true,
          channel: "WHATSAPP",
          chave_cobranca: VALID_BR_CODE,
          whatsappUrl: expectedUrl,
        });
      });

      it("deve forçar envio pelo WhatsApp quando channel for explicitamente WHATSAPP", async () => {
        const openSpy = vi.fn().mockReturnValue({ closed: false });
        const mockWindow = createMockWindowTarget({ openImpl: openSpy });
        const shareSpy = vi.fn();
        const mockNavigator = createMockNavigatorTarget({
          shareImpl: shareSpy,
          canShareImpl: vi.fn().mockReturnValue(true),
        });
        const adapter = new BrowserShareAdapter({
          navigatorTarget: mockNavigator,
          windowTarget: mockWindow,
        });

        const useCase = new DistributePixChargeUseCase({
          chargeDistributionGateway: adapter,
        });

        const result = await useCase.shareCharge({
          chave_cobranca: VALID_BR_CODE,
          channel: "WHATSAPP",
        });

        expect(shareSpy).not.toHaveBeenCalled();
        expect(openSpy).toHaveBeenCalledTimes(1);
        expect(result.channel).toBe("WHATSAPP");
      });
    });
  });

  describe("BrowserShareAdapter — TASK-03.3.3 (Download PNG do QR Code, Blob & Liberação de Recursos)", () => {
    it("deve converter e baixar o QR Code PNG utilizando exportQrCodePngFn e disparar o clique da âncora", async () => {
      const fakeBlob = new Blob(["png-binary-content"], { type: "image/png" });
      const exportQrCodePngSpy = vi.fn().mockResolvedValue(fakeBlob);
      const mockDocument = createMockDocumentTarget();
      const mockUrl = createMockUrlTarget();
      const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
        exportQrCodePngFn: exportQrCodePngSpy,
      });

      const result = await adapter.downloadQrCodePng({
        chave_cobranca: VALID_BR_CODE,
        fileName: "meu-pix.png",
        width: 512,
        height: 512,
      });

      expect(exportQrCodePngSpy).toHaveBeenCalledWith(VALID_BR_CODE, {
        width: 512,
        height: 512,
      });
      expect(mockUrl.createObjectURL).toHaveBeenCalledWith(fakeBlob);
      expect(mockDocument.createElement).toHaveBeenCalledWith("a");
      expect(mockDocument.body.appendChild).toHaveBeenCalledTimes(1);
      expect(mockDocument.body.removeChild).toHaveBeenCalledTimes(1);
      expect(mockUrl.revokeObjectURL).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        action: PIX_CHARGE_DISTRIBUTION_ACTIONS.DOWNLOAD_QR,
        downloaded: true,
        fileName: "meu-pix.png",
        width: 512,
        height: 512,
        chave_cobranca: VALID_BR_CODE,
      });
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("deve suportar o alias downloadQrImage delegando para downloadQrCodePng", async () => {
      const fakeBlob = new Blob(["png-binary-content"], { type: "image/png" });
      const exportQrCodePngSpy = vi.fn().mockResolvedValue(fakeBlob);
      const mockDocument = createMockDocumentTarget();
      const mockUrl = createMockUrlTarget();
      const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
        exportQrCodePngFn: exportQrCodePngSpy,
      });

      const result = await adapter.downloadQrImage({
        chave_cobranca: VALID_BR_CODE,
      });

      expect(result.downloaded).toBe(true);
      expect(result.fileName).toBe("mandaumpix-qrcode.png");
    });

    it("deve normalizar o nome do arquivo acrescentando extensão .png quando omitida", async () => {
      const fakeBlob = new Blob(["png-data"], { type: "image/png" });
      const exportQrCodePngSpy = vi.fn().mockResolvedValue(fakeBlob);
      const mockDocument = createMockDocumentTarget();
      const mockUrl = createMockUrlTarget();
      const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
        exportQrCodePngFn: exportQrCodePngSpy,
      });

      const result = await adapter.downloadQrCodePng({
        chave_cobranca: VALID_BR_CODE,
        fileName: "cobranca-loja",
      });

      expect(result.fileName).toBe("cobranca-loja.png");
    });

    it("deve suportar payload contendo blob diretamente sem invocar exportQrCodePngFn", async () => {
      const directBlob = new Blob(["direct-blob"], { type: "image/png" });
      const exportQrCodePngSpy = vi.fn();
      const mockDocument = createMockDocumentTarget();
      const mockUrl = createMockUrlTarget();
      const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
        exportQrCodePngFn: exportQrCodePngSpy,
      });

      const result = await adapter.downloadQrCodePng({
        chave_cobranca: VALID_BR_CODE,
        blob: directBlob,
      });

      expect(exportQrCodePngSpy).not.toHaveBeenCalled();
      expect(mockUrl.createObjectURL).toHaveBeenCalledWith(directBlob);
      expect(result.downloaded).toBe(true);
    });

    it("deve suportar conversão de dataUrl (base64) para Blob quando fornecido", async () => {
      const fakeDataUrl =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const mockDocument = createMockDocumentTarget();
      const mockUrl = createMockUrlTarget();
      const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
      });

      const result = await adapter.downloadQrCodePng({
        dataUrl: fakeDataUrl,
      });

      expect(mockUrl.createObjectURL).toHaveBeenCalled();
      expect(result.downloaded).toBe(true);
    });

    it("deve lançar INVALID_PAYLOAD quando payload for nulo ou não contiver chave_cobranca, svg, dataUrl ou blob", async () => {
      const adapter = new BrowserShareAdapter();

      await expect(adapter.downloadQrCodePng(null)).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
        field: "payload",
      });

      await expect(adapter.downloadQrCodePng({})).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.INVALID_PAYLOAD,
        field: "chave_cobranca",
      });
    });

    it("deve lançar DOWNLOAD_FAILED quando documentTarget for nulo ou sem suporte a createElement", async () => {
      const adapter = new BrowserShareAdapter({
        documentTarget: null,
        exportQrCodePngFn: vi.fn().mockResolvedValue(new Blob([])),
      });

      await expect(
        adapter.downloadQrCodePng({ chave_cobranca: VALID_BR_CODE }),
      ).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.DOWNLOAD_FAILED,
        field: "document",
      });
    });

    it("deve lançar DOWNLOAD_FAILED quando URL.createObjectURL não estiver disponível", async () => {
      const mockDocument = createMockDocumentTarget();
      const mockWindow = createMockWindowTarget({
        urlTarget: { createObjectURL: null },
      });
      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
        exportQrCodePngFn: vi.fn().mockResolvedValue(new Blob([])),
      });

      await expect(
        adapter.downloadQrCodePng({ chave_cobranca: VALID_BR_CODE }),
      ).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.DOWNLOAD_FAILED,
        field: "createObjectURL",
      });
    });

    it("deve converter dataURL retornado por exportQrCodePngFn para Blob", async () => {
      const fakeDataUrl =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const exportQrCodePngSpy = vi.fn().mockResolvedValue(fakeDataUrl);
      const mockDocument = createMockDocumentTarget();
      const mockUrl = createMockUrlTarget();
      const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
        exportQrCodePngFn: exportQrCodePngSpy,
      });

      const result = await adapter.downloadQrCodePng({
        chave_cobranca: VALID_BR_CODE,
      });

      expect(result.downloaded).toBe(true);
      expect(mockUrl.createObjectURL).toHaveBeenCalled();
    });

    it("deve converter resultado não-Blob e não-dataURL retornado por exportQrCodePngFn em Blob", async () => {
      const rawBytes = new Uint8Array([1, 2, 3]);
      const exportQrCodePngSpy = vi.fn().mockResolvedValue(rawBytes);
      const mockDocument = createMockDocumentTarget();
      const mockUrl = createMockUrlTarget();
      const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
        exportQrCodePngFn: exportQrCodePngSpy,
      });

      const result = await adapter.downloadQrCodePng({
        chave_cobranca: VALID_BR_CODE,
      });

      expect(result.downloaded).toBe(true);
    });

    it("deve lançar DOWNLOAD_FAILED quando exportQrCodePngFn retornar valor nulo ou indefinido", async () => {
      const exportQrCodePngSpy = vi.fn().mockResolvedValue(null);
      const mockDocument = createMockDocumentTarget();
      const mockUrl = createMockUrlTarget();
      const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
        exportQrCodePngFn: exportQrCodePngSpy,
      });

      await expect(
        adapter.downloadQrCodePng({ chave_cobranca: VALID_BR_CODE }),
      ).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.DOWNLOAD_FAILED,
        field: "imagem_qrcode",
      });
    });

    it("deve usar mensagem padrão quando exportQrCodePngFn rejeitar sem mensagem", async () => {
      const mockDocument = createMockDocumentTarget();
      const mockUrl = createMockUrlTarget();
      const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
        exportQrCodePngFn: vi.fn().mockRejectedValue({}),
      });

      await expect(
        adapter.downloadQrCodePng({ chave_cobranca: VALID_BR_CODE }),
      ).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.DOWNLOAD_FAILED,
        message: "Falha ao converter ou rasterizar a imagem PNG do QR Code.",
      });
    });

    it("deve lançar DOWNLOAD_FAILED quando exportQrCodePngFn rejeitar", async () => {
      const generationError = new Error("Falha na rasterização do QR Code");
      const mockDocument = createMockDocumentTarget();
      const mockUrl = createMockUrlTarget();
      const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
        exportQrCodePngFn: vi.fn().mockRejectedValue(generationError),
      });

      await expect(
        adapter.downloadQrCodePng({ chave_cobranca: VALID_BR_CODE }),
      ).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.DOWNLOAD_FAILED,
        field: "imagem_qrcode",
        cause: generationError,
      });
    });

    it("deve lançar DOWNLOAD_FAILED quando o clique da âncora lançar erro", async () => {
      const mockDocument = createMockDocumentTarget({
        createElementImpl: () => ({
          tagName: "A",
          style: {},
          click: () => {
            throw new Error("Click event dispatch blocked");
          },
        }),
      });
      const mockUrl = createMockUrlTarget();
      const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

      const adapter = new BrowserShareAdapter({
        documentTarget: mockDocument,
        windowTarget: mockWindow,
        exportQrCodePngFn: vi.fn().mockResolvedValue(new Blob([])),
      });

      await expect(
        adapter.downloadQrCodePng({ chave_cobranca: VALID_BR_CODE }),
      ).rejects.toMatchObject({
        name: "BrowserShareAdapterError",
        code: BROWSER_SHARE_ADAPTER_ERROR_CODES.DOWNLOAD_FAILED,
      });
      // Verifica que mesmo se o click falhar, a URL é revogada na limpeza
      expect(mockUrl.revokeObjectURL).toHaveBeenCalledTimes(1);
    });

    describe("Integração com DistributePixChargeUseCase (downloadQrImage)", () => {
      it("deve executar o fluxo completo de download através de DistributePixChargeUseCase", async () => {
        const fakeBlob = new Blob(["pix-png"], { type: "image/png" });
        const exportQrCodePngSpy = vi.fn().mockResolvedValue(fakeBlob);
        const mockDocument = createMockDocumentTarget();
        const mockUrl = createMockUrlTarget();
        const mockWindow = createMockWindowTarget({ urlTarget: mockUrl });

        const adapter = new BrowserShareAdapter({
          documentTarget: mockDocument,
          windowTarget: mockWindow,
          exportQrCodePngFn: exportQrCodePngSpy,
        });

        const useCase = new DistributePixChargeUseCase({
          chargeDistributionGateway: adapter,
        });

        const result = await useCase.downloadQrImage({
          chave_cobranca: VALID_BR_CODE,
          fileName: "cobranca-cliente.png",
          width: 512,
          height: 512,
        });

        expect(result).toEqual({
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.DOWNLOAD_QR,
          downloaded: true,
          fileName: "cobranca-cliente.png",
          width: 512,
          height: 512,
          chave_cobranca: VALID_BR_CODE,
        });
        expect(mockUrl.createObjectURL).toHaveBeenCalledWith(fakeBlob);
        expect(mockUrl.revokeObjectURL).toHaveBeenCalled();
      });

      it("deve permitir que DistributePixChargeUseCase converta falha em PixChargeDistributionError com DOWNLOAD_FAILED", async () => {
        const adapter = new BrowserShareAdapter({
          documentTarget: null,
          exportQrCodePngFn: vi.fn().mockResolvedValue(new Blob([])),
        });

        const useCase = new DistributePixChargeUseCase({
          chargeDistributionGateway: adapter,
        });

        await expect(
          useCase.downloadQrImage({ chave_cobranca: VALID_BR_CODE }),
        ).rejects.toMatchObject({
          name: "PixChargeDistributionError",
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.DOWNLOAD_FAILED,
        });
      });
    });
  });
});
