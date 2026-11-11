import {
  assertPixKeyRepository,
  hydrateChaveContaList,
} from "./save-pix-key.use-case.js";

export class ListPixKeysUseCase {
  constructor({ pixKeyRepository = null } = {}) {
    this.pixKeyRepository = pixKeyRepository;
  }

  static create(dependencies) {
    return new ListPixKeysUseCase(dependencies);
  }

  async execute() {
    const repository = assertPixKeyRepository(this.pixKeyRepository, [
      "findAll",
      "getSelectedKeyId",
      "setSelectedKeyId",
    ]);

    const items = Object.freeze(
      hydrateChaveContaList(await repository.findAll()),
    );
    const currentSelectedKeyId = await repository.getSelectedKeyId();

    if (items.length === 0) {
      if (currentSelectedKeyId !== null) {
        await repository.setSelectedKeyId(null);
      }

      return Object.freeze({
        items,
        keys: items,
        selectedKeyId: null,
        selectedKey: null,
      });
    }

    const matchedKey =
      items.find((item) => item.id === currentSelectedKeyId) || null;

    if (matchedKey) {
      return Object.freeze({
        items,
        keys: items,
        selectedKeyId: matchedKey.id,
        selectedKey: matchedKey,
      });
    }

    const fallbackKey = items[0];
    await repository.setSelectedKeyId(fallbackKey.id);

    return Object.freeze({
      items,
      keys: items,
      selectedKeyId: fallbackKey.id,
      selectedKey: fallbackKey,
    });
  }
}

export function executeListPixKeys(dependencies) {
  return new ListPixKeysUseCase(dependencies).execute();
}
