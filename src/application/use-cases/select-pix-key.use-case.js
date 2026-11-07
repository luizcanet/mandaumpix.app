import {
  PIX_KEY_MANAGEMENT_ERROR_CODES,
  PixKeyManagementError,
  assertPixKeyRepository,
  hydrateChaveContaList,
} from "./save-pix-key.use-case.js";

export function resolveRequiredPixKeyId(input) {
  let rawId = "";

  if (typeof input === "string") {
    rawId = input;
  } else if (input && typeof input === "object") {
    if (typeof input.id === "string") {
      rawId = input.id;
    } else if (typeof input.selectedKeyId === "string") {
      rawId = input.selectedKeyId;
    } else if (typeof input.id_chave_conta === "string") {
      rawId = input.id_chave_conta;
    }
  }

  const normalizedId = rawId.trim();

  if (!normalizedId) {
    throw new PixKeyManagementError(
      "O identificador da chave PIX é obrigatório.",
      {
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.MISSING_PIX_KEY_ID,
        field: "id",
      },
    );
  }

  return normalizedId;
}

export class SelectPixKeyUseCase {
  constructor({ pixKeyRepository = null } = {}) {
    this.pixKeyRepository = pixKeyRepository;
  }

  static create(dependencies) {
    return new SelectPixKeyUseCase(dependencies);
  }

  async execute(input) {
    const repository = assertPixKeyRepository(this.pixKeyRepository, [
      "findAll",
      "setSelectedKeyId",
    ]);

    const targetId = resolveRequiredPixKeyId(input);
    const items = hydrateChaveContaList(await repository.findAll());
    const selectedKey = items.find((item) => item.id === targetId) || null;

    if (!selectedKey) {
      throw new PixKeyManagementError(
        "Chave PIX não encontrada no repositório.",
        {
          code: PIX_KEY_MANAGEMENT_ERROR_CODES.PIX_KEY_NOT_FOUND,
          field: "id",
        },
      );
    }

    await repository.setSelectedKeyId(selectedKey.id);

    return Object.freeze({
      selectedKeyId: selectedKey.id,
      selectedKey,
      chave_conta: selectedKey,
      chaveConta: selectedKey,
    });
  }
}

export function executeSelectPixKey(input, dependencies) {
  return new SelectPixKeyUseCase(dependencies).execute(input);
}

