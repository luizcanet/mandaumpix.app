import { describe, expect, it, vi } from "vitest";
import {
  PWA_INSTALL_ADAPTER_ERROR_CODES,
  PwaInstallAdapterError,
  STANDALONE_MEDIA_QUERY,
  detectStandaloneMode,
} from "./pwa-install.adapter.js";

describe("pwa-install.adapter.js — TASK-03.2.1: Constants, Error & detectStandaloneMode", () => {
  describe("STANDALONE_MEDIA_QUERY & PWA_INSTALL_ADAPTER_ERROR_CODES", () => {
    it("should export STANDALONE_MEDIA_QUERY matching '(display-mode: standalone)'", () => {
      expect(STANDALONE_MEDIA_QUERY).toBe("(display-mode: standalone)");
    });

    it("should export frozen PWA_INSTALL_ADAPTER_ERROR_CODES with all expected error codes", () => {
      expect(Object.isFrozen(PWA_INSTALL_ADAPTER_ERROR_CODES)).toBe(true);
      expect(PWA_INSTALL_ADAPTER_ERROR_CODES).toEqual({
        PWA_ALREADY_INSTALLED: "PWA_ALREADY_INSTALLED",
        INSTALL_PROMPT_UNAVAILABLE: "INSTALL_PROMPT_UNAVAILABLE",
        INSTALL_PROMPT_EXECUTION_FAILED: "INSTALL_PROMPT_EXECUTION_FAILED",
        INVALID_INSTALL_LISTENER: "INVALID_INSTALL_LISTENER",
      });
    });
  });

  describe("PwaInstallAdapterError", () => {
    it("should construct PwaInstallAdapterError with default properties", () => {
      const error = new PwaInstallAdapterError("Erro padrão de instalação");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PwaInstallAdapterError);
      expect(error.name).toBe("PwaInstallAdapterError");
      expect(error.message).toBe("Erro padrão de instalação");
      expect(error.code).toBe("PWA_INSTALL_ADAPTER_ERROR");
      expect(error.field).toBeNull();
      expect(error.cause).toBeNull();
    });

    it("should construct PwaInstallAdapterError with custom code, field, and cause", () => {
      const cause = new Error("Native prompt crashed");
      const error = new PwaInstallAdapterError(
        "Falha na execução do prompt nativo",
        {
          code: PWA_INSTALL_ADAPTER_ERROR_CODES.INSTALL_PROMPT_EXECUTION_FAILED,
          field: "deferredPrompt",
          cause,
        },
      );

      expect(error.name).toBe("PwaInstallAdapterError");
      expect(error.message).toBe("Falha na execução do prompt nativo");
      expect(error.code).toBe(
        PWA_INSTALL_ADAPTER_ERROR_CODES.INSTALL_PROMPT_EXECUTION_FAILED,
      );
      expect(error.field).toBe("deferredPrompt");
      expect(error.cause).toBe(cause);
    });
  });

  describe("detectStandaloneMode", () => {
    it("should return true when navigatorTarget.standalone is true (iOS/Safari)", () => {
      const navigatorTarget = { standalone: true };
      const windowTarget = {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      };

      const result = detectStandaloneMode({ windowTarget, navigatorTarget });

      expect(result).toBe(true);
    });

    it("should return true when windowTarget.matchMedia matches '(display-mode: standalone)'", () => {
      const navigatorTarget = { standalone: false };
      const matchMediaMock = vi.fn().mockImplementation((query) => {
        return {
          matches: query === STANDALONE_MEDIA_QUERY,
        };
      });
      const windowTarget = { matchMedia: matchMediaMock };

      const result = detectStandaloneMode({ windowTarget, navigatorTarget });

      expect(result).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith(STANDALONE_MEDIA_QUERY);
    });

    it("should return false when neither standalone media query nor navigator.standalone is true", () => {
      const navigatorTarget = { standalone: false };
      const windowTarget = {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      };

      const result = detectStandaloneMode({ windowTarget, navigatorTarget });

      expect(result).toBe(false);
    });

    it("should handle null, undefined, or missing targets without throwing and return false", () => {
      expect(
        detectStandaloneMode({ windowTarget: null, navigatorTarget: null }),
      ).toBe(false);
      expect(
        detectStandaloneMode({
          windowTarget: undefined,
          navigatorTarget: undefined,
        }),
      ).toBe(false);
      expect(detectStandaloneMode({})).toBe(false);
    });

    it("should safely handle windowTarget when matchMedia is not a function or throws an error", () => {
      const windowWithoutMatchMedia = {};
      expect(
        detectStandaloneMode({
          windowTarget: windowWithoutMatchMedia,
          navigatorTarget: { standalone: false },
        }),
      ).toBe(false);

      const windowWithThrowingMatchMedia = {
        matchMedia: vi.fn().mockImplementation(() => {
          throw new Error("SecurityError: restricted access");
        }),
      };
      expect(
        detectStandaloneMode({
          windowTarget: windowWithThrowingMatchMedia,
          navigatorTarget: { standalone: false },
        }),
      ).toBe(false);
    });

    it("should safely fallback when matchMedia returns null or non-object", () => {
      const windowTarget = {
        matchMedia: vi.fn().mockReturnValue(null),
      };
      expect(
        detectStandaloneMode({
          windowTarget,
          navigatorTarget: { standalone: false },
        }),
      ).toBe(false);
    });
  });
});
