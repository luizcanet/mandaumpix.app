import { describe, expect, it, vi } from "vitest";
import {
  InstallPwaUseCase,
  PWA_INSTALL_ACTIONS,
  PwaInstallError,
  executeInstallPwa,
} from "../../application/use-cases/install-pwa.use-case.js";
import {
  PWA_INSTALL_ADAPTER_ERROR_CODES,
  PwaInstallAdapter,
  PwaInstallAdapterError,
  STANDALONE_MEDIA_QUERY,
  createPwaInstallAdapter,
  detectStandaloneMode,
} from "./pwa-install.adapter.js";

function createMockBrowserTargets({
  standalone = false,
  matchesStandalone = false,
  useLegacyMediaQueryListener = false,
} = {}) {
  const windowListeners = new Map();
  const mediaQueryListeners = new Map();

  const mediaQueryList = {
    matches: matchesStandalone,
    media: STANDALONE_MEDIA_QUERY,
  };

  if (useLegacyMediaQueryListener) {
    mediaQueryList.addListener = vi.fn((callback) => {
      const current = mediaQueryListeners.get("change") || new Set();
      current.add(callback);
      mediaQueryListeners.set("change", current);
    });
    mediaQueryList.removeListener = vi.fn((callback) => {
      const current = mediaQueryListeners.get("change");
      if (current) {
        current.delete(callback);
      }
    });
  } else {
    mediaQueryList.addEventListener = vi.fn((event, callback) => {
      const current = mediaQueryListeners.get(event) || new Set();
      current.add(callback);
      mediaQueryListeners.set(event, current);
    });
    mediaQueryList.removeEventListener = vi.fn((event, callback) => {
      const current = mediaQueryListeners.get(event);
      if (current) {
        current.delete(callback);
      }
    });
  }

  mediaQueryList.dispatchChange = (matches) => {
    mediaQueryList.matches = matches;
    const callbacks = mediaQueryListeners.get("change") || [];
    for (const callback of callbacks) {
      callback({ matches, media: STANDALONE_MEDIA_QUERY });
    }
  };

  const windowTarget = {
    addEventListener: vi.fn((event, callback) => {
      const current = windowListeners.get(event) || new Set();
      current.add(callback);
      windowListeners.set(event, current);
    }),
    removeEventListener: vi.fn((event, callback) => {
      const current = windowListeners.get(event);
      if (current) {
        current.delete(callback);
      }
    }),
    dispatchEvent: (event) => {
      const callbacks = windowListeners.get(event.type) || [];
      for (const callback of callbacks) {
        callback(event);
      }
      return !event.defaultPrevented;
    },
    matchMedia: vi.fn().mockImplementation((query) => {
      if (query === STANDALONE_MEDIA_QUERY) {
        return mediaQueryList;
      }
      return {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }),
  };

  const navigatorTarget = {
    standalone,
  };

  return { windowTarget, navigatorTarget, mediaQueryList };
}

function createBeforeInstallPromptEvent({
  outcome = "accepted",
  reject = false,
  userChoicePromise = null,
} = {}) {
  let defaultPrevented = false;
  const promptMock = vi.fn().mockImplementation(async () => {
    if (reject) {
      throw new Error("Simulated prompt failure");
    }
    return { outcome };
  });

  return {
    type: "beforeinstallprompt",
    preventDefault: vi.fn(() => {
      defaultPrevented = true;
    }),
    get defaultPrevented() {
      return defaultPrevented;
    },
    prompt: promptMock,
    userChoice: userChoicePromise || Promise.resolve({ outcome }),
  };
}

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

describe("pwa-install.adapter.js — TASK-03.2.2: PwaInstallAdapter & Browser Lifecycle", () => {
  it("should create adapter instance using createPwaInstallAdapter factory", () => {
    const { windowTarget, navigatorTarget } = createMockBrowserTargets();
    const adapter = createPwaInstallAdapter({ windowTarget, navigatorTarget });

    expect(adapter).toBeInstanceOf(PwaInstallAdapter);
    expect(adapter).toBeInstanceOf(EventTarget);
    expect(adapter.isInstalled()).toBe(false);
    expect(adapter.canInstall()).toBe(false);
  });

  it("should register event listeners on windowTarget and mediaQueryList upon initialization", () => {
    const { windowTarget, mediaQueryList, navigatorTarget } =
      createMockBrowserTargets();
    createPwaInstallAdapter({ windowTarget, navigatorTarget });

    expect(windowTarget.addEventListener).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function),
    );
    expect(windowTarget.addEventListener).toHaveBeenCalledWith(
      "appinstalled",
      expect.any(Function),
    );
    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("should support legacy addListener for mediaQueryList when addEventListener is missing", () => {
    const { windowTarget, mediaQueryList, navigatorTarget } =
      createMockBrowserTargets({ useLegacyMediaQueryListener: true });
    createPwaInstallAdapter({ windowTarget, navigatorTarget });

    expect(mediaQueryList.addListener).toHaveBeenCalledWith(
      expect.any(Function),
    );
  });

  it("should return correct initial state when browser is not in standalone mode", () => {
    const { windowTarget, navigatorTarget } = createMockBrowserTargets();
    const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

    expect(adapter.isInstalled()).toBe(false);
    expect(adapter.canInstall()).toBe(false);
    expect(adapter.getState()).toEqual({
      isInstalled: false,
      canInstall: false,
      shouldShowInstallButton: false,
    });
    expect(Object.isFrozen(adapter.getState())).toBe(true);
  });

  it("should return isInstalled = true and canInstall = false if launched in standalone mode (RN06)", () => {
    const { windowTarget, navigatorTarget } = createMockBrowserTargets({
      matchesStandalone: true,
    });
    const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

    expect(adapter.isInstalled()).toBe(true);
    expect(adapter.canInstall()).toBe(false);
    expect(adapter.getState()).toEqual({
      isInstalled: true,
      canInstall: false,
      shouldShowInstallButton: false,
    });
  });

  it("should capture beforeinstallprompt, call preventDefault, and enable canInstall and install button", () => {
    const { windowTarget, navigatorTarget } = createMockBrowserTargets();
    const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

    const promptEvent = createBeforeInstallPromptEvent();
    windowTarget.dispatchEvent(promptEvent);

    expect(promptEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(adapter.isInstalled()).toBe(false);
    expect(adapter.canInstall()).toBe(true);
    expect(adapter.getState()).toEqual({
      isInstalled: false,
      canInstall: true,
      shouldShowInstallButton: true,
    });
  });

  it("should handle appinstalled event by setting isInstalled = true and clearing canInstall", () => {
    const { windowTarget, navigatorTarget } = createMockBrowserTargets();
    const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

    const promptEvent = createBeforeInstallPromptEvent();
    windowTarget.dispatchEvent(promptEvent);
    expect(adapter.canInstall()).toBe(true);

    windowTarget.dispatchEvent({ type: "appinstalled" });

    expect(adapter.isInstalled()).toBe(true);
    expect(adapter.canInstall()).toBe(false);
    expect(adapter.getState()).toEqual({
      isInstalled: true,
      canInstall: false,
      shouldShowInstallButton: false,
    });
  });

  it("should handle mediaQuery change to standalone mode", () => {
    const { windowTarget, navigatorTarget, mediaQueryList } =
      createMockBrowserTargets();
    const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

    const promptEvent = createBeforeInstallPromptEvent();
    windowTarget.dispatchEvent(promptEvent);
    expect(adapter.canInstall()).toBe(true);

    mediaQueryList.dispatchChange(true);

    expect(adapter.isInstalled()).toBe(true);
    expect(adapter.canInstall()).toBe(false);
    expect(adapter.getState().shouldShowInstallButton).toBe(false);
  });

  describe("promptInstall() & triggerInstall()", () => {
    it("should successfully execute promptInstall() with outcome 'accepted'", async () => {
      const { windowTarget, navigatorTarget } = createMockBrowserTargets();
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      const promptEvent = createBeforeInstallPromptEvent({
        outcome: "accepted",
      });
      windowTarget.dispatchEvent(promptEvent);

      const result = await adapter.promptInstall();

      expect(promptEvent.prompt).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        outcome: "accepted",
        accepted: true,
        isInstalled: true,
        canInstall: false,
        shouldShowInstallButton: false,
      });
      expect(Object.isFrozen(result)).toBe(true);
      expect(adapter.isInstalled()).toBe(true);
      expect(adapter.canInstall()).toBe(false);
      expect(adapter.getState().shouldShowInstallButton).toBe(false);
    });

    it("should successfully execute triggerInstall() as an alias to promptInstall()", async () => {
      const { windowTarget, navigatorTarget } = createMockBrowserTargets();
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      const promptEvent = createBeforeInstallPromptEvent({
        outcome: "accepted",
      });
      windowTarget.dispatchEvent(promptEvent);

      const result = await adapter.triggerInstall();

      expect(promptEvent.prompt).toHaveBeenCalledTimes(1);
      expect(result.accepted).toBe(true);
    });

    it("should successfully execute promptInstall() when user dismisses the prompt", async () => {
      const { windowTarget, navigatorTarget } = createMockBrowserTargets();
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      const promptEvent = createBeforeInstallPromptEvent({
        outcome: "dismissed",
      });
      windowTarget.dispatchEvent(promptEvent);

      const result = await adapter.promptInstall();

      expect(promptEvent.prompt).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        outcome: "dismissed",
        accepted: false,
        isInstalled: false,
        canInstall: false,
        shouldShowInstallButton: false,
      });
      expect(adapter.isInstalled()).toBe(false);
      expect(adapter.canInstall()).toBe(false);
    });

    it("should handle prompt return when userChoice is not present", async () => {
      const { windowTarget, navigatorTarget } = createMockBrowserTargets();
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      const promptEvent = {
        type: "beforeinstallprompt",
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue({ outcome: "accepted" }),
      };
      windowTarget.dispatchEvent(promptEvent);

      const result = await adapter.promptInstall();
      expect(result.outcome).toBe("accepted");
      expect(result.accepted).toBe(true);
    });

    it("should handle prompt returning string outcome directly", async () => {
      const { windowTarget, navigatorTarget } = createMockBrowserTargets();
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      const promptEvent = {
        type: "beforeinstallprompt",
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue("accepted"),
      };
      windowTarget.dispatchEvent(promptEvent);

      const result = await adapter.promptInstall();
      expect(result.outcome).toBe("accepted");
      expect(result.accepted).toBe(true);
    });

    it("should throw PWA_ALREADY_INSTALLED if promptInstall() is called when app is already installed", async () => {
      const { windowTarget, navigatorTarget } = createMockBrowserTargets({
        matchesStandalone: true,
      });
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      await expect(adapter.promptInstall()).rejects.toThrowError(
        expect.objectContaining({
          name: "PwaInstallAdapterError",
          code: PWA_INSTALL_ADAPTER_ERROR_CODES.PWA_ALREADY_INSTALLED,
          field: "isInstalled",
        }),
      );
    });

    it("should throw INSTALL_PROMPT_UNAVAILABLE if promptInstall() is called before beforeinstallprompt", async () => {
      const { windowTarget, navigatorTarget } = createMockBrowserTargets();
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      await expect(adapter.promptInstall()).rejects.toThrowError(
        expect.objectContaining({
          name: "PwaInstallAdapterError",
          code: PWA_INSTALL_ADAPTER_ERROR_CODES.INSTALL_PROMPT_UNAVAILABLE,
          field: "canInstall",
        }),
      );
    });

    it("should throw INSTALL_PROMPT_EXECUTION_FAILED if native prompt() throws or rejects", async () => {
      const { windowTarget, navigatorTarget } = createMockBrowserTargets();
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      const promptEvent = createBeforeInstallPromptEvent({ reject: true });
      windowTarget.dispatchEvent(promptEvent);

      await expect(adapter.promptInstall()).rejects.toThrowError(
        expect.objectContaining({
          name: "PwaInstallAdapterError",
          code: PWA_INSTALL_ADAPTER_ERROR_CODES.INSTALL_PROMPT_EXECUTION_FAILED,
          field: "deferredPrompt",
        }),
      );
    });
  });

  describe("destroy()", () => {
    it("should remove all registered event listeners and clear deferred prompt", () => {
      const { windowTarget, mediaQueryList, navigatorTarget } =
        createMockBrowserTargets();
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      const promptEvent = createBeforeInstallPromptEvent();
      windowTarget.dispatchEvent(promptEvent);
      expect(adapter.canInstall()).toBe(true);

      adapter.destroy();

      expect(windowTarget.removeEventListener).toHaveBeenCalledWith(
        "beforeinstallprompt",
        expect.any(Function),
      );
      expect(windowTarget.removeEventListener).toHaveBeenCalledWith(
        "appinstalled",
        expect.any(Function),
      );
      expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
      expect(adapter.canInstall()).toBe(false);
    });

    it("should use removeListener for legacy mediaQueryList on destroy", () => {
      const { windowTarget, mediaQueryList, navigatorTarget } =
        createMockBrowserTargets({ useLegacyMediaQueryListener: true });
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      adapter.destroy();

      expect(mediaQueryList.removeListener).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it("should ignore new beforeinstallprompt and appinstalled events after being destroyed", () => {
      const { windowTarget, navigatorTarget } = createMockBrowserTargets();
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      adapter.destroy();

      const promptEvent = createBeforeInstallPromptEvent();
      windowTarget.dispatchEvent(promptEvent);
      expect(adapter.canInstall()).toBe(false);

      windowTarget.dispatchEvent({ type: "appinstalled" });
      expect(adapter.isInstalled()).toBe(false);

      // Explicitly test handlers when destroyed flag is active
      adapter.boundOnBeforeInstallPrompt(promptEvent);
      adapter.boundOnAppInstalled();
      adapter.boundOnMediaQueryChange({ matches: true });
      expect(adapter.canInstall()).toBe(false);
      expect(adapter.isInstalled()).toBe(false);
    });

    it("should return true in isInstalled when installedFlag is set", () => {
      const { windowTarget, navigatorTarget } = createMockBrowserTargets();
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      adapter.installedFlag = true;
      expect(adapter.isInstalled()).toBe(true);
    });

    it("should safely instantiate and destroy without windowTarget", () => {
      const adapter = new PwaInstallAdapter({ windowTarget: null });
      expect(adapter.isInstalled()).toBe(false);
      expect(adapter.canInstall()).toBe(false);
      expect(() => adapter.destroy()).not.toThrow();
    });

    it("should safely handle windowTarget whose matchMedia throws in initialize", () => {
      const windowTarget = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        matchMedia: vi.fn().mockImplementation(() => {
          throw new Error("matchMedia restricted");
        }),
      };
      const adapter = new PwaInstallAdapter({ windowTarget });
      expect(adapter.isInstalled()).toBe(false);
    });

    it("should ignore mediaQuery changes when matches is false", () => {
      const { windowTarget, navigatorTarget, mediaQueryList } =
        createMockBrowserTargets();
      const adapter = new PwaInstallAdapter({ windowTarget, navigatorTarget });

      mediaQueryList.dispatchChange(false);
      expect(adapter.isInstalled()).toBe(false);
    });
  });

  describe("TASK-03.2.3 — Reactive State (@modnes/data-controller) & InstallPwaUseCase Integration", () => {
    describe("subscribe() and DataController reactivity", () => {
      it("should throw INVALID_INSTALL_LISTENER if subscribe is called with non-function", () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets();
        const adapter = new PwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });

        expect(() => adapter.subscribe(null)).toThrowError(
          expect.objectContaining({
            name: "PwaInstallAdapterError",
            code: PWA_INSTALL_ADAPTER_ERROR_CODES.INVALID_INSTALL_LISTENER,
            field: "listener",
          }),
        );
        expect(() => adapter.subscribe("invalid")).toThrowError(
          expect.objectContaining({
            code: PWA_INSTALL_ADAPTER_ERROR_CODES.INVALID_INSTALL_LISTENER,
          }),
        );
      });

      it("should notify subscriber when beforeinstallprompt event arrives", () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets();
        const adapter = new PwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });

        const notifications = [];
        const unsubscribe = adapter.subscribe((state, detail) => {
          notifications.push({ state, detail });
        });

        const promptEvent = createBeforeInstallPromptEvent();
        windowTarget.dispatchEvent(promptEvent);

        expect(notifications.length).toBeGreaterThanOrEqual(1);
        const lastNotification = notifications[notifications.length - 1];
        expect(lastNotification.state).toEqual({
          isInstalled: false,
          canInstall: true,
          shouldShowInstallButton: true,
        });

        unsubscribe();
      });

      it("should notify subscriber when appinstalled event arrives", () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets();
        const adapter = new PwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });

        const promptEvent = createBeforeInstallPromptEvent();
        windowTarget.dispatchEvent(promptEvent);

        const notifications = [];
        const unsubscribe = adapter.subscribe((state) => {
          notifications.push(state);
        });

        windowTarget.dispatchEvent({ type: "appinstalled" });

        expect(notifications.length).toBeGreaterThanOrEqual(1);
        expect(notifications[notifications.length - 1]).toEqual({
          isInstalled: true,
          canInstall: false,
          shouldShowInstallButton: false,
        });

        unsubscribe();
      });

      it("should notify subscriber when mediaQuery changes to standalone", () => {
        const { windowTarget, navigatorTarget, mediaQueryList } =
          createMockBrowserTargets();
        const adapter = new PwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });

        const notifications = [];
        const unsubscribe = adapter.subscribe((state) => {
          notifications.push(state);
        });

        mediaQueryList.dispatchChange(true);

        expect(notifications.length).toBeGreaterThanOrEqual(1);
        expect(notifications[notifications.length - 1]).toEqual({
          isInstalled: true,
          canInstall: false,
          shouldShowInstallButton: false,
        });

        unsubscribe();
      });

      it("should notify subscriber when promptInstall succeeds and then stop after unsubscribe", async () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets();
        const adapter = new PwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });

        const promptEvent = createBeforeInstallPromptEvent({
          outcome: "accepted",
        });
        windowTarget.dispatchEvent(promptEvent);

        const notifications = [];
        const unsubscribe = adapter.subscribe((state) => {
          notifications.push(state);
        });

        await adapter.promptInstall();

        expect(notifications.length).toBeGreaterThanOrEqual(1);
        expect(notifications[notifications.length - 1]).toEqual({
          isInstalled: true,
          canInstall: false,
          shouldShowInstallButton: false,
        });

        unsubscribe();

        // Dispatches after unsubscribe should not notify listener
        const countBefore = notifications.length;
        windowTarget.dispatchEvent({ type: "appinstalled" });
        expect(notifications.length).toBe(countBefore);
      });
    });

    describe("Integration with InstallPwaUseCase", () => {
      it("should integrate with InstallPwaUseCase.getInstallState() before and after beforeinstallprompt", async () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets();
        const adapter = createPwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });
        const useCase = new InstallPwaUseCase({ pwaInstallGateway: adapter });

        const initialState = await useCase.getInstallState();
        expect(initialState).toEqual({
          isInstalled: false,
          canInstall: false,
          shouldShowInstallButton: false,
        });

        const promptEvent = createBeforeInstallPromptEvent();
        windowTarget.dispatchEvent(promptEvent);

        const readyState = await useCase.getInstallState();
        expect(readyState).toEqual({
          isInstalled: false,
          canInstall: true,
          shouldShowInstallButton: true,
        });
      });

      it("should integrate with InstallPwaUseCase.getInstallState() when in standalone mode", async () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets({
          matchesStandalone: true,
        });
        const adapter = createPwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });
        const useCase = new InstallPwaUseCase({ pwaInstallGateway: adapter });

        const state = await useCase.getInstallState();
        expect(state).toEqual({
          isInstalled: true,
          canInstall: false,
          shouldShowInstallButton: false,
        });
      });

      it("should integrate with InstallPwaUseCase.triggerInstall() when user accepts", async () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets();
        const adapter = createPwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });
        const useCase = new InstallPwaUseCase({ pwaInstallGateway: adapter });

        const promptEvent = createBeforeInstallPromptEvent({
          outcome: "accepted",
        });
        windowTarget.dispatchEvent(promptEvent);

        const result = await useCase.triggerInstall();

        expect(result).toEqual({
          outcome: "accepted",
          accepted: true,
          isInstalled: true,
          canInstall: false,
          shouldShowInstallButton: false,
        });

        const finalState = await useCase.getInstallState();
        expect(finalState.isInstalled).toBe(true);
        expect(finalState.canInstall).toBe(false);
        expect(finalState.shouldShowInstallButton).toBe(false);
      });

      it("should integrate with InstallPwaUseCase.triggerInstall() when user dismisses", async () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets();
        const adapter = createPwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });
        const useCase = new InstallPwaUseCase({ pwaInstallGateway: adapter });

        const promptEvent = createBeforeInstallPromptEvent({
          outcome: "dismissed",
        });
        windowTarget.dispatchEvent(promptEvent);

        const result = await useCase.triggerInstall();

        expect(result).toEqual({
          outcome: "dismissed",
          accepted: false,
          isInstalled: false,
          canInstall: false,
          shouldShowInstallButton: false,
        });
      });

      it("should propagate PwaInstallError when triggerInstall is called when prompt is not available", async () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets();
        const adapter = createPwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });
        const useCase = new InstallPwaUseCase({ pwaInstallGateway: adapter });

        await expect(useCase.triggerInstall()).rejects.toThrowError(
          PwaInstallError,
        );
      });

      it("should propagate PwaInstallError when triggerInstall is called when already installed", async () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets({
          matchesStandalone: true,
        });
        const adapter = createPwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });
        const useCase = new InstallPwaUseCase({ pwaInstallGateway: adapter });

        await expect(useCase.triggerInstall()).rejects.toThrowError(
          PwaInstallError,
        );
      });

      it("should integrate with InstallPwaUseCase.subscribe() and notify normalized states", () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets();
        const adapter = createPwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });
        const useCase = new InstallPwaUseCase({ pwaInstallGateway: adapter });

        const observedStates = [];
        const unsubscribe = useCase.subscribe((state) => {
          observedStates.push(state);
        });

        const promptEvent = createBeforeInstallPromptEvent();
        windowTarget.dispatchEvent(promptEvent);

        expect(observedStates.length).toBeGreaterThanOrEqual(1);
        expect(observedStates[observedStates.length - 1]).toEqual({
          isInstalled: false,
          canInstall: true,
          shouldShowInstallButton: true,
        });

        windowTarget.dispatchEvent({ type: "appinstalled" });
        expect(observedStates[observedStates.length - 1]).toEqual({
          isInstalled: true,
          canInstall: false,
          shouldShowInstallButton: false,
        });

        unsubscribe();
      });

      it("should execute actions GET_STATE and TRIGGER_INSTALL via executeInstallPwa helper", async () => {
        const { windowTarget, navigatorTarget } = createMockBrowserTargets();
        const adapter = createPwaInstallAdapter({
          windowTarget,
          navigatorTarget,
        });

        const promptEvent = createBeforeInstallPromptEvent({
          outcome: "accepted",
        });
        windowTarget.dispatchEvent(promptEvent);

        const stateResult = await executeInstallPwa(
          { action: PWA_INSTALL_ACTIONS.GET_STATE },
          { pwaInstallGateway: adapter },
        );
        expect(stateResult.shouldShowInstallButton).toBe(true);

        const triggerResult = await executeInstallPwa(
          { action: PWA_INSTALL_ACTIONS.TRIGGER_INSTALL },
          { pwaInstallGateway: adapter },
        );
        expect(triggerResult.accepted).toBe(true);
      });
    });
  });
});
