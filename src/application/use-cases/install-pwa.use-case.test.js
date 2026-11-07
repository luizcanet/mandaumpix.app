import { describe, expect, it, vi } from "vitest";
import {
  InstallPwaUseCase,
  PWA_INSTALL_ACTIONS,
  PWA_INSTALL_ERROR_CODES,
  PWA_INSTALL_OUTCOMES,
  PwaInstallError,
  assertPwaInstallGateway,
  executeInstallPwa,
  normalizePwaInstallOutcome,
  normalizePwaInstallState,
} from "./install-pwa.use-case.js";

describe("install-pwa.use-case.js — InstallPwaUseCase (TASK-02.5.2)", () => {
  describe("Helper Functions & Error Class", () => {
    it("should construct PwaInstallError with default and custom metadata", () => {
      const defaultError = new PwaInstallError("Erro padrão de instalação");
      expect(defaultError).toBeInstanceOf(Error);
      expect(defaultError).toBeInstanceOf(PwaInstallError);
      expect(defaultError.name).toBe("PwaInstallError");
      expect(defaultError.message).toBe("Erro padrão de instalação");
      expect(defaultError.code).toBe("PWA_INSTALL_ERROR");
      expect(defaultError.field).toBeNull();
      expect(defaultError.cause).toBeNull();

      const cause = new Error("Prompt aborted");
      const customError = new PwaInstallError("Falha no prompt", {
        code: PWA_INSTALL_ERROR_CODES.PWA_INSTALL_PROMPT_FAILED,
        field: "pwaInstallGateway",
        cause,
      });
      expect(customError.code).toBe(
        PWA_INSTALL_ERROR_CODES.PWA_INSTALL_PROMPT_FAILED,
      );
      expect(customError.field).toBe("pwaInstallGateway");
      expect(customError.cause).toBe(cause);
    });

    it("should enforce RN06 invariant in normalizePwaInstallState", () => {
      expect(normalizePwaInstallState()).toEqual({
        isInstalled: false,
        canInstall: false,
        shouldShowInstallButton: false,
      });

      const readyToInstall = normalizePwaInstallState({
        isInstalled: false,
        canInstall: true,
      });
      expect(Object.isFrozen(readyToInstall)).toBe(true);
      expect(readyToInstall).toEqual({
        isInstalled: false,
        canInstall: true,
        shouldShowInstallButton: true,
      });

      const alreadyInstalled = normalizePwaInstallState({
        isInstalled: true,
        canInstall: true,
      });
      expect(alreadyInstalled).toEqual({
        isInstalled: true,
        canInstall: false,
        shouldShowInstallButton: false,
      });
    });

    it("should normalize prompt outcomes from string, object, or boolean flags", () => {
      expect(normalizePwaInstallOutcome("accepted")).toBe(
        PWA_INSTALL_OUTCOMES.ACCEPTED,
      );
      expect(normalizePwaInstallOutcome("ACCEPTED")).toBe(
        PWA_INSTALL_OUTCOMES.ACCEPTED,
      );
      expect(normalizePwaInstallOutcome({ outcome: "accepted" })).toBe(
        PWA_INSTALL_OUTCOMES.ACCEPTED,
      );
      expect(normalizePwaInstallOutcome({ accepted: true })).toBe(
        PWA_INSTALL_OUTCOMES.ACCEPTED,
      );

      expect(normalizePwaInstallOutcome("dismissed")).toBe(
        PWA_INSTALL_OUTCOMES.DISMISSED,
      );
      expect(normalizePwaInstallOutcome({ outcome: "dismissed" })).toBe(
        PWA_INSTALL_OUTCOMES.DISMISSED,
      );
      expect(normalizePwaInstallOutcome(null)).toBe(
        PWA_INSTALL_OUTCOMES.DISMISSED,
      );
      expect(normalizePwaInstallOutcome({})).toBe(
        PWA_INSTALL_OUTCOMES.DISMISSED,
      );
    });

    it("should validate gateway contract via assertPwaInstallGateway", () => {
      expect(() => assertPwaInstallGateway(null)).toThrowError(
        expect.objectContaining({
          name: "PwaInstallError",
          code: PWA_INSTALL_ERROR_CODES.MISSING_PWA_INSTALL_GATEWAY,
          field: "pwaInstallGateway",
        }),
      );
      expect(() => assertPwaInstallGateway({})).toThrowError(
        expect.objectContaining({
          code: PWA_INSTALL_ERROR_CODES.MISSING_PWA_INSTALL_GATEWAY,
        }),
      );

      const gateway = {
        isInstalled: () => false,
        canInstall: () => true,
      };
      expect(assertPwaInstallGateway(gateway)).toBe(gateway);
    });
  });

  describe("getInstallState() — RN06 Visibility Invariant (Scenario 06)", () => {
    it("should return shouldShowInstallButton = true when not installed and install prompt is available", async () => {
      // Arrange
      const pwaInstallGateway = {
        isInstalled: vi.fn().mockResolvedValue(false),
        canInstall: vi.fn().mockResolvedValue(true),
      };
      const useCase = InstallPwaUseCase.create({ pwaInstallGateway });

      // Act
      const state = await useCase.getInstallState();

      // Assert
      expect(pwaInstallGateway.isInstalled).toHaveBeenCalledTimes(1);
      expect(pwaInstallGateway.canInstall).toHaveBeenCalledTimes(1);
      expect(Object.isFrozen(state)).toBe(true);
      expect(state).toEqual({
        isInstalled: false,
        canInstall: true,
        shouldShowInstallButton: true,
      });
    });

    it("should force canInstall = false and shouldShowInstallButton = false when app is already installed", async () => {
      const installAdapter = {
        isInstalled: vi.fn().mockReturnValue(true),
        canInstall: vi.fn().mockReturnValue(true),
      };
      const useCase = new InstallPwaUseCase({ installAdapter });

      const state = await useCase.getInstallState();

      expect(state).toEqual({
        isInstalled: true,
        canInstall: false,
        shouldShowInstallButton: false,
      });
    });
  });

  describe("triggerInstall() — Native Prompt Execution (Scenarios 07 & 08 — RN06)", () => {
    it("should trigger promptInstall and hide install button immediately when user accepts", async () => {
      // Arrange
      let installedFlag = false;
      let canInstallFlag = true;
      const pwaInstallGateway = {
        isInstalled: vi.fn(() => installedFlag),
        canInstall: vi.fn(() => canInstallFlag),
        promptInstall: vi.fn(async () => {
          installedFlag = true;
          canInstallFlag = false;
          return { outcome: "accepted" };
        }),
      };
      const useCase = new InstallPwaUseCase({ pwaInstallGateway });

      // Act
      const result = await useCase.triggerInstall();

      // Assert
      expect(pwaInstallGateway.promptInstall).toHaveBeenCalledTimes(1);
      expect(Object.isFrozen(result)).toBe(true);
      expect(result).toEqual({
        outcome: PWA_INSTALL_OUTCOMES.ACCEPTED,
        accepted: true,
        isInstalled: true,
        canInstall: false,
        shouldShowInstallButton: false,
      });
    });

    it("should enforce isInstalled = true when outcome is accepted even if gateway has not yet fired appinstalled", async () => {
      const pwaInstallGateway = {
        isInstalled: vi.fn().mockReturnValue(false),
        canInstall: vi.fn().mockReturnValue(true),
        triggerInstall: vi.fn().mockResolvedValue("accepted"),
      };
      const useCase = new InstallPwaUseCase({ pwaInstallGateway });

      const result = await useCase.triggerInstall();

      expect(pwaInstallGateway.triggerInstall).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        outcome: PWA_INSTALL_OUTCOMES.ACCEPTED,
        accepted: true,
        isInstalled: true,
        canInstall: false,
        shouldShowInstallButton: false,
      });
    });

    it("should reflect gateway state when user dismisses the install prompt", async () => {
      let canInstallFlag = true;
      const pwaInstallGateway = {
        isInstalled: vi.fn(() => false),
        canInstall: vi.fn(() => canInstallFlag),
        promptInstall: vi.fn(async () => {
          canInstallFlag = false;
          return { outcome: "dismissed" };
        }),
      };
      const useCase = new InstallPwaUseCase({ pwaInstallGateway });

      const result = await useCase.triggerInstall();

      expect(result).toEqual({
        outcome: PWA_INSTALL_OUTCOMES.DISMISSED,
        accepted: false,
        isInstalled: false,
        canInstall: false,
        shouldShowInstallButton: false,
      });
    });

    it("should throw PWA_ALREADY_INSTALLED or PWA_INSTALL_NOT_AVAILABLE when prompt cannot be triggered", async () => {
      const alreadyInstalledGateway = {
        isInstalled: () => true,
        canInstall: () => false,
        promptInstall: vi.fn(),
      };
      await expect(
        new InstallPwaUseCase({
          pwaInstallGateway: alreadyInstalledGateway,
        }).triggerInstall(),
      ).rejects.toMatchObject({
        name: "PwaInstallError",
        code: PWA_INSTALL_ERROR_CODES.PWA_ALREADY_INSTALLED,
        field: "isInstalled",
      });

      const notAvailableGateway = {
        isInstalled: () => false,
        canInstall: () => false,
        promptInstall: vi.fn(),
      };
      await expect(
        new InstallPwaUseCase({
          pwaInstallGateway: notAvailableGateway,
        }).triggerInstall(),
      ).rejects.toMatchObject({
        name: "PwaInstallError",
        code: PWA_INSTALL_ERROR_CODES.PWA_INSTALL_NOT_AVAILABLE,
        field: "canInstall",
      });

      const missingPromptMethodGateway = {
        isInstalled: () => false,
        canInstall: () => true,
      };
      await expect(
        new InstallPwaUseCase({
          pwaInstallGateway: missingPromptMethodGateway,
        }).triggerInstall(),
      ).rejects.toMatchObject({
        code: PWA_INSTALL_ERROR_CODES.MISSING_PWA_INSTALL_GATEWAY,
      });
    });

    it("should wrap promptInstall errors into PwaInstallError (PWA_INSTALL_PROMPT_FAILED)", async () => {
      const failingGateway = {
        isInstalled: () => false,
        canInstall: () => true,
        promptInstall: vi
          .fn()
          .mockRejectedValue(new Error("User gesture required")),
      };
      await expect(
        new InstallPwaUseCase({
          pwaInstallGateway: failingGateway,
        }).triggerInstall(),
      ).rejects.toMatchObject({
        name: "PwaInstallError",
        code: PWA_INSTALL_ERROR_CODES.PWA_INSTALL_PROMPT_FAILED,
        message: "User gesture required",
      });

      const emptyErrorGateway = {
        isInstalled: () => false,
        canInstall: () => true,
        promptInstall: vi.fn().mockRejectedValue({}),
      };
      await expect(
        new InstallPwaUseCase({
          pwaInstallGateway: emptyErrorGateway,
        }).triggerInstall(),
      ).rejects.toMatchObject({
        code: PWA_INSTALL_ERROR_CODES.PWA_INSTALL_PROMPT_FAILED,
        message: "Não foi possível acionar a instalação do aplicativo.",
      });
    });
  });

  describe("subscribe() & execute() Dispatcher", () => {
    it("should subscribe to gateway changes and emit normalized RN06 state", () => {
      let registeredCallback = null;
      const unsubscribeSpy = vi.fn();
      const pwaInstallGateway = {
        isInstalled: () => false,
        canInstall: () => true,
        subscribe: vi.fn((cb) => {
          registeredCallback = cb;
          return unsubscribeSpy;
        }),
      };
      const useCase = new InstallPwaUseCase({ pwaInstallGateway });
      const listener = vi.fn();

      const unsubscribe = useCase.subscribe(listener);

      registeredCallback({ isInstalled: false, canInstall: true });
      expect(listener).toHaveBeenLastCalledWith({
        isInstalled: false,
        canInstall: true,
        shouldShowInstallButton: true,
      });

      registeredCallback({ isInstalled: true, canInstall: true });
      expect(listener).toHaveBeenLastCalledWith({
        isInstalled: true,
        canInstall: false,
        shouldShowInstallButton: false,
      });

      registeredCallback();
      expect(listener).toHaveBeenLastCalledWith({
        isInstalled: false,
        canInstall: false,
        shouldShowInstallButton: false,
      });

      unsubscribe();
      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });

    it("should return a no-op unsubscribe when gateway does not implement subscribe and validate listener function", () => {
      const gatewayWithoutSubscribe = {
        isInstalled: () => false,
        canInstall: () => false,
      };
      const useCase = new InstallPwaUseCase({
        pwaInstallGateway: gatewayWithoutSubscribe,
      });

      const unsubscribe = useCase.subscribe(() => {});
      expect(typeof unsubscribe).toBe("function");
      expect(unsubscribe()).toBeUndefined();

      const gatewayWithNonFunctionUnsubscribe = {
        isInstalled: () => false,
        canInstall: () => false,
        subscribe: () => null,
      };
      const unsubscribeFallback = new InstallPwaUseCase({
        pwaInstallGateway: gatewayWithNonFunctionUnsubscribe,
      }).subscribe(() => {});
      expect(unsubscribeFallback()).toBeUndefined();

      expect(() => useCase.subscribe(null)).toThrowError(
        expect.objectContaining({
          code: PWA_INSTALL_ERROR_CODES.INVALID_PWA_INSTALL_LISTENER,
          field: "listener",
        }),
      );
    });

    it("should dispatch GET_STATE and TRIGGER_INSTALL via execute() and executeInstallPwa()", async () => {
      const pwaInstallGateway = {
        isInstalled: vi.fn().mockReturnValue(false),
        canInstall: vi.fn().mockReturnValue(true),
        promptInstall: vi.fn().mockResolvedValue({ outcome: "accepted" }),
      };

      const defaultState = await executeInstallPwa(undefined, {
        pwaInstallGateway,
      });
      expect(defaultState.shouldShowInstallButton).toBe(true);

      const explicitGetState = await executeInstallPwa(
        { action: PWA_INSTALL_ACTIONS.GET_STATE },
        { pwaInstallGateway },
      );
      expect(explicitGetState.shouldShowInstallButton).toBe(true);

      const triggerResult = await executeInstallPwa(
        { action: PWA_INSTALL_ACTIONS.TRIGGER_INSTALL },
        { pwaInstallGateway },
      );
      expect(triggerResult.accepted).toBe(true);

      await expect(
        executeInstallPwa({ action: "UNKNOWN" }, { pwaInstallGateway }),
      ).rejects.toMatchObject({
        code: PWA_INSTALL_ERROR_CODES.INVALID_PWA_INSTALL_ACTION,
        field: "action",
      });

      await expect(new InstallPwaUseCase().execute(null)).rejects.toMatchObject(
        {
          code: PWA_INSTALL_ERROR_CODES.MISSING_PWA_INSTALL_GATEWAY,
        },
      );
    });
  });
});

