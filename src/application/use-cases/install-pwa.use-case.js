export const PWA_INSTALL_ACTIONS = Object.freeze({
  GET_STATE: "GET_STATE",
  TRIGGER_INSTALL: "TRIGGER_INSTALL",
});

export const PWA_INSTALL_OUTCOMES = Object.freeze({
  ACCEPTED: "accepted",
  DISMISSED: "dismissed",
});

export const PWA_INSTALL_ERROR_CODES = Object.freeze({
  MISSING_PWA_INSTALL_GATEWAY: "MISSING_PWA_INSTALL_GATEWAY",
  PWA_ALREADY_INSTALLED: "PWA_ALREADY_INSTALLED",
  PWA_INSTALL_NOT_AVAILABLE: "PWA_INSTALL_NOT_AVAILABLE",
  INVALID_PWA_INSTALL_ACTION: "INVALID_PWA_INSTALL_ACTION",
  INVALID_PWA_INSTALL_LISTENER: "INVALID_PWA_INSTALL_LISTENER",
  PWA_INSTALL_PROMPT_FAILED: "PWA_INSTALL_PROMPT_FAILED",
});

export class PwaInstallError extends Error {
  constructor(
    message,
    { code = "PWA_INSTALL_ERROR", field = null, cause = null } = {},
  ) {
    super(message);
    this.name = "PwaInstallError";
    this.code = code;
    this.field = field;
    this.cause = cause;
  }
}

export function assertPwaInstallGateway(
  gateway,
  requiredMethods = ["isInstalled", "canInstall"],
) {
  const isValidObject = Boolean(gateway) && typeof gateway === "object";
  const hasRequiredMethods =
    isValidObject &&
    requiredMethods.every(
      (methodName) => typeof gateway[methodName] === "function",
    );

  if (!hasRequiredMethods) {
    throw new PwaInstallError(
      "Porta de instalação do PWA ausente ou inválida.",
      {
        code: PWA_INSTALL_ERROR_CODES.MISSING_PWA_INSTALL_GATEWAY,
        field: "pwaInstallGateway",
      },
    );
  }

  return gateway;
}

export function normalizePwaInstallState({
  isInstalled = false,
  canInstall = false,
} = {}) {
  const normalizedInstalled = Boolean(isInstalled);
  const normalizedCanInstall = normalizedInstalled
    ? false
    : Boolean(canInstall);
  const shouldShowInstallButton = !normalizedInstalled && normalizedCanInstall;

  return Object.freeze({
    isInstalled: normalizedInstalled,
    canInstall: normalizedCanInstall,
    shouldShowInstallButton,
  });
}

export function normalizePwaInstallOutcome(rawResult) {
  if (typeof rawResult === "string") {
    return rawResult.trim().toLowerCase() === PWA_INSTALL_OUTCOMES.ACCEPTED
      ? PWA_INSTALL_OUTCOMES.ACCEPTED
      : PWA_INSTALL_OUTCOMES.DISMISSED;
  }

  if (rawResult && typeof rawResult === "object") {
    if (rawResult.accepted === true) {
      return PWA_INSTALL_OUTCOMES.ACCEPTED;
    }

    if (
      typeof rawResult.outcome === "string" &&
      rawResult.outcome.trim().toLowerCase() === PWA_INSTALL_OUTCOMES.ACCEPTED
    ) {
      return PWA_INSTALL_OUTCOMES.ACCEPTED;
    }
  }

  return PWA_INSTALL_OUTCOMES.DISMISSED;
}

function resolvePromptInstallHandler(gateway) {
  const validatedGateway = assertPwaInstallGateway(gateway, [
    "isInstalled",
    "canInstall",
  ]);

  if (typeof validatedGateway.promptInstall === "function") {
    return () => validatedGateway.promptInstall();
  }

  if (typeof validatedGateway.triggerInstall === "function") {
    return () => validatedGateway.triggerInstall();
  }

  return assertPwaInstallGateway(null, ["promptInstall"]);
}

export class InstallPwaUseCase {
  constructor({ pwaInstallGateway = null, installAdapter = null } = {}) {
    this.pwaInstallGateway = pwaInstallGateway || installAdapter || null;
  }

  static create(dependencies) {
    return new InstallPwaUseCase(dependencies);
  }

  async getInstallState() {
    const gateway = assertPwaInstallGateway(this.pwaInstallGateway, [
      "isInstalled",
      "canInstall",
    ]);

    const [rawInstalled, rawCanInstall] = await Promise.all([
      gateway.isInstalled(),
      gateway.canInstall(),
    ]);

    return normalizePwaInstallState({
      isInstalled: rawInstalled,
      canInstall: rawCanInstall,
    });
  }

  async triggerInstall() {
    const promptHandler = resolvePromptInstallHandler(this.pwaInstallGateway);
    const currentState = await this.getInstallState();

    if (currentState.isInstalled) {
      throw new PwaInstallError(
        "O aplicativo já está instalado neste dispositivo.",
        {
          code: PWA_INSTALL_ERROR_CODES.PWA_ALREADY_INSTALLED,
          field: "isInstalled",
        },
      );
    }

    if (!currentState.canInstall) {
      throw new PwaInstallError(
        "O prompt nativo de instalação não está disponível no momento.",
        {
          code: PWA_INSTALL_ERROR_CODES.PWA_INSTALL_NOT_AVAILABLE,
          field: "canInstall",
        },
      );
    }

    let rawResult;
    try {
      rawResult = await promptHandler();
    } catch (error) {
      throw new PwaInstallError(
        error?.message ||
          "Não foi possível acionar a instalação do aplicativo.",
        {
          code: PWA_INSTALL_ERROR_CODES.PWA_INSTALL_PROMPT_FAILED,
          field: "pwaInstallGateway",
          cause: error,
        },
      );
    }

    const outcome = normalizePwaInstallOutcome(rawResult);
    const accepted = outcome === PWA_INSTALL_OUTCOMES.ACCEPTED;
    const updatedState = await this.getInstallState();
    const finalState = accepted
      ? normalizePwaInstallState({ isInstalled: true, canInstall: false })
      : updatedState;

    return Object.freeze({
      outcome,
      accepted,
      isInstalled: finalState.isInstalled,
      canInstall: finalState.canInstall,
      shouldShowInstallButton: finalState.shouldShowInstallButton,
    });
  }

  subscribe(listener) {
    const gateway = assertPwaInstallGateway(this.pwaInstallGateway, [
      "isInstalled",
      "canInstall",
    ]);

    if (typeof listener !== "function") {
      throw new PwaInstallError(
        "Listener de estado de instalação inválido (esperada uma função).",
        {
          code: PWA_INSTALL_ERROR_CODES.INVALID_PWA_INSTALL_LISTENER,
          field: "listener",
        },
      );
    }

    if (typeof gateway.subscribe !== "function") {
      return () => {};
    }

    const unsubscribe = gateway.subscribe((rawState = {}) => {
      listener(normalizePwaInstallState(rawState));
    });

    return typeof unsubscribe === "function" ? unsubscribe : () => {};
  }

  async execute(input = {}) {
    const safeInput = input && typeof input === "object" ? input : {};
    const action =
      safeInput.action === undefined || safeInput.action === null
        ? PWA_INSTALL_ACTIONS.GET_STATE
        : String(safeInput.action).trim().toUpperCase();

    switch (action) {
      case PWA_INSTALL_ACTIONS.GET_STATE:
        return this.getInstallState();
      case PWA_INSTALL_ACTIONS.TRIGGER_INSTALL:
        return this.triggerInstall();
      default:
        throw new PwaInstallError(
          "Ação de instalação do PWA inválida (esperado GET_STATE ou TRIGGER_INSTALL).",
          {
            code: PWA_INSTALL_ERROR_CODES.INVALID_PWA_INSTALL_ACTION,
            field: "action",
          },
        );
    }
  }
}

export function executeInstallPwa(input, dependencies) {
  return new InstallPwaUseCase(dependencies).execute(input);
}
