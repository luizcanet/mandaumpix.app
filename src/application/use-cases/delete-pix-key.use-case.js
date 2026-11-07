import {
  PIX_KEY_MANAGEMENT_ERROR_CODES,
  PixKeyManagementError,
  assertPixKeyRepository,
  hydrateChaveContaList,
} from "./save-pix-key.use-case.js";
import { resolveRequiredPixKeyId } from "./select-pix-key.use-case.js";

export class DeletePixKeyUseCase {
  constructor({ pixKeyRepository = null } = {}) {
    this.pixKeyRepository = pixKeyRepository;
  }

  static create(dependencies) {
    return new DeletePixKeyUseCase(dependencies);
  }

  async execute(input) {
    const repository = assertPixKeyRepository(this.pixKeyRepository, [
      "findAll",
      "deleteById",
      "getSelectedKeyId",
      "setSelectedKeyId",
    ]);

    const targetId = resolveRequiredPixKeyId(input);
    const existingKeys = hydrateChaveContaList(await repository.findAll());
    const deletedKey =
      existingKeys.find((item) => item.id === targetId) || null;

    if (!deletedKey) {
      throw new PixKeyManagementError(
        "Chave PIX não encontrada no repositório.",
        {
          code: PIX_KEY_MANAGEMENT_ERROR_CODES.PIX_KEY_NOT_FOUND,
          field: "id",
        },
      );
    }

    await repository.deleteById(targetId);

    const remainingItems = Object.freeze(
      existingKeys.filter((item) => item.id !== targetId),
    );
    const currentSelectedKeyId = await repository.getSelectedKeyId();

    if (remainingItems.length === 0) {
      if (currentSelectedKeyId !== null) {
        await repository.setSelectedKeyId(null);
      }

      return Object.freeze({
        deletedKeyId: targetId,
        deletedKey,
        items: remainingItems,
        keys: remainingItems,
        selectedKeyId: null,
        selectedKey: null,
      });
    }

    const activeKey =
      remainingItems.find((item) => item.id === currentSelectedKeyId) || null;

    if (activeKey) {
      return Object.freeze({
        deletedKeyId: targetId,
        deletedKey,
        items: remainingItems,
        keys: remainingItems,
        selectedKeyId: activeKey.id,
        selectedKey: activeKey,
      });
    }

    const fallbackKey = remainingItems[0];
    await repository.setSelectedKeyId(fallbackKey.id);

    return Object.freeze({
      deletedKeyId: targetId,
      deletedKey,
      items: remainingItems,
      keys: remainingItems,
      selectedKeyId: fallbackKey.id,
      selectedKey: fallbackKey,
    });
  }
}

export function executeDeletePixKey(input, dependencies) {
  return new DeletePixKeyUseCase(dependencies).execute(input);
}
