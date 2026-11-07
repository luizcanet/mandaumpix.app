import { ChaveConta } from "../../domain/entities/pix-key.entity.js";

export const PIX_KEY_MANAGEMENT_ERROR_CODES = Object.freeze({
  MISSING_PIX_KEY_REPOSITORY: "MISSING_PIX_KEY_REPOSITORY",
  DUPLICATE_PIX_KEY: "DUPLICATE_PIX_KEY",
  MISSING_PIX_KEY_ID: "MISSING_PIX_KEY_ID",
  PIX_KEY_NOT_FOUND: "PIX_KEY_NOT_FOUND",
});

export class PixKeyManagementError extends Error {
  constructor(
    message,
    { code = "PIX_KEY_MANAGEMENT_ERROR", field = null } = {},
  ) {
    super(message);
    this.name = "PixKeyManagementError";
    this.code = code;
    this.field = field;
  }
}

export function assertPixKeyRepository(
  pixKeyRepository,
  requiredMethods = ["findAll", "save", "getSelectedKeyId", "setSelectedKeyId"],
) {
  const isValidObject =
    Boolean(pixKeyRepository) && typeof pixKeyRepository === "object";
  const hasAllRequiredMethods =
    isValidObject &&
    requiredMethods.every(
      (methodName) => typeof pixKeyRepository[methodName] === "function",
    );

  if (!hasAllRequiredMethods) {
    throw new PixKeyManagementError(
      "Repositório de chaves PIX ausente ou inválido.",
      {
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.MISSING_PIX_KEY_REPOSITORY,
        field: "pixKeyRepository",
      },
    );
  }

  return pixKeyRepository;
}

export function hydrateChaveContaList(rawItems) {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.map((item) =>
    item instanceof ChaveConta ? item : ChaveConta.fromJSON(item),
  );
}

function extractSaveInput(input) {
  if (input instanceof ChaveConta) {
    return {
      chaveConta: input,
      selectAsActive: false,
    };
  }

  const safeInput = input && typeof input === "object" ? input : {};
  const rawKeyCandidate =
    safeInput.chave_conta !== undefined
      ? safeInput.chave_conta
      : safeInput.chaveConta !== undefined
        ? safeInput.chaveConta
        : safeInput;

  const chaveConta =
    rawKeyCandidate instanceof ChaveConta
      ? rawKeyCandidate
      : ChaveConta.create(rawKeyCandidate);

  return {
    chaveConta,
    selectAsActive: Boolean(safeInput.selectAsActive),
  };
}

function assertNotDuplicatePixKey(existingKeys, candidateKey) {
  const hasConflict = existingKeys.some(
    (existing) =>
      existing.id !== candidateKey.id &&
      existing.tipo_chave === candidateKey.tipo_chave &&
      existing.valor_chave === candidateKey.valor_chave,
  );

  if (hasConflict) {
    throw new PixKeyManagementError(
      "Esta chave PIX já está cadastrada em outra conta.",
      {
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.DUPLICATE_PIX_KEY,
        field: "valor_chave",
      },
    );
  }
}

export class SavePixKeyUseCase {
  constructor({ pixKeyRepository = null } = {}) {
    this.pixKeyRepository = pixKeyRepository;
  }

  static create(dependencies) {
    return new SavePixKeyUseCase(dependencies);
  }

  async execute(input = {}) {
    const repository = assertPixKeyRepository(this.pixKeyRepository, [
      "findAll",
      "save",
      "getSelectedKeyId",
      "setSelectedKeyId",
    ]);

    const { chaveConta, selectAsActive } = extractSaveInput(input);
    const existingKeys = hydrateChaveContaList(await repository.findAll());

    assertNotDuplicatePixKey(existingKeys, chaveConta);

    await repository.save(chaveConta);

    const currentSelectedKeyId = await repository.getSelectedKeyId();
    const hasValidSelectedKey =
      Boolean(currentSelectedKeyId) &&
      (currentSelectedKeyId === chaveConta.id ||
        existingKeys.some((item) => item.id === currentSelectedKeyId));

    const shouldSelect =
      selectAsActive || existingKeys.length === 0 || !hasValidSelectedKey;

    const selectedKeyId = shouldSelect ? chaveConta.id : currentSelectedKeyId;

    if (shouldSelect) {
      await repository.setSelectedKeyId(chaveConta.id);
    }

    return Object.freeze({
      chave_conta: chaveConta,
      chaveConta,
      selectedKeyId,
      isSelected: selectedKeyId === chaveConta.id,
    });
  }
}

export function executeSavePixKey(input, dependencies) {
  return new SavePixKeyUseCase(dependencies).execute(input);
}
