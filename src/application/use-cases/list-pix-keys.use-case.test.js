import { describe, expect, it, vi } from "vitest";
import {
  ChaveConta,
  PIX_KEY_TYPES,
} from "../../domain/entities/pix-key.entity.js";
import { PIX_KEY_MANAGEMENT_ERROR_CODES } from "./save-pix-key.use-case.js";
import {
  ListPixKeysUseCase,
  executeListPixKeys,
} from "./list-pix-keys.use-case.js";

function createInMemoryPixKeyRepository({
  initialKeys = [],
  initialSelectedKeyId = null,
} = {}) {
  const keys = [...initialKeys];
  let selectedKeyId = initialSelectedKeyId;

  return {
    findAll: vi.fn(async () => [...keys]),
    getSelectedKeyId: vi.fn(async () => selectedKeyId),
    setSelectedKeyId: vi.fn(async (id) => {
      selectedKeyId = id;
    }),
  };
}

describe("list-pix-keys.use-case.js — ListPixKeysUseCase (TASK-02.4.2)", () => {
  const rawFirstKey = {
    id: "key-01",
    rotulo: "Conta Principal",
    tipo_chave: PIX_KEY_TYPES.EMAIL,
    valor_chave: "eu@luizca.net",
    nome_recebedor: "Luiz Henrique Canet Filho",
    cidade_recebedor: "Brasília",
    criado_em: "2026-11-07T16:00:00.000Z",
  };

  const rawSecondKey = {
    id: "key-02",
    rotulo: "Conta Reserva",
    tipo_chave: PIX_KEY_TYPES.CPF,
    valor_chave: "123.456.789-09",
    nome_recebedor: "Luiz Henrique Canet Filho",
    cidade_recebedor: "Brasília",
    criado_em: "2026-11-07T16:05:00.000Z",
  };

  describe("Empty State Listing (INV-04)", () => {
    it("should return frozen empty items list and null selection when repository has no keys", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository();
      const useCase = ListPixKeysUseCase.create({ pixKeyRepository });

      // Act
      const result = await useCase.execute();

      // Assert
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.items)).toBe(true);
      expect(result.items).toEqual([]);
      expect(result.keys).toBe(result.items);
      expect(result.selectedKeyId).toBeNull();
      expect(result.selectedKey).toBeNull();
      expect(pixKeyRepository.setSelectedKeyId).not.toHaveBeenCalled();
    });

    it("should clear orphan selectedKeyId to null when repository has no keys", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [],
        initialSelectedKeyId: "orphan-id",
      });
      const useCase = new ListPixKeysUseCase({ pixKeyRepository });

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.items).toEqual([]);
      expect(result.selectedKeyId).toBeNull();
      expect(result.selectedKey).toBeNull();
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledTimes(1);
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledWith(null);
    });
  });

  describe("Populated Listing & Hydration (Scenario 03 & INV-04 — RN01, RN02)", () => {
    it("should hydrate plain objects into ChaveConta instances and resolve the currently active selectedKey", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey, ChaveConta.create(rawSecondKey)],
        initialSelectedKeyId: "key-02",
      });

      // Act
      const result = await executeListPixKeys({ pixKeyRepository });

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toBeInstanceOf(ChaveConta);
      expect(result.items[1]).toBeInstanceOf(ChaveConta);
      expect(result.selectedKeyId).toBe("key-02");
      expect(result.selectedKey).toBe(result.items[1]);
      expect(result.selectedKey.id).toBe("key-02");
      expect(pixKeyRepository.setSelectedKeyId).not.toHaveBeenCalled();
    });

    it("should auto-recover selection to the first available key when selectedKeyId is null or orphan", async () => {
      // Arrange
      const repoWithNullSelected = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey, rawSecondKey],
        initialSelectedKeyId: null,
      });
      const repoWithOrphanSelected = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey, rawSecondKey],
        initialSelectedKeyId: "deleted-key-id",
      });

      // Act
      const resultFromNull = await executeListPixKeys({
        pixKeyRepository: repoWithNullSelected,
      });
      const resultFromOrphan = await new ListPixKeysUseCase({
        pixKeyRepository: repoWithOrphanSelected,
      }).execute();

      // Assert
      expect(resultFromNull.selectedKeyId).toBe("key-01");
      expect(resultFromNull.selectedKey).toBe(resultFromNull.items[0]);
      expect(repoWithNullSelected.setSelectedKeyId).toHaveBeenCalledWith(
        "key-01",
      );

      expect(resultFromOrphan.selectedKeyId).toBe("key-01");
      expect(resultFromOrphan.selectedKey).toBe(resultFromOrphan.items[0]);
      expect(repoWithOrphanSelected.setSelectedKeyId).toHaveBeenCalledWith(
        "key-01",
      );
    });
  });

  describe("Repository Validation (INV-01)", () => {
    it("should reject with PixKeyManagementError (MISSING_PIX_KEY_REPOSITORY) when repository is missing or incomplete", async () => {
      const useCaseWithoutRepo = new ListPixKeysUseCase();
      const useCaseWithIncompleteRepo = new ListPixKeysUseCase({
        pixKeyRepository: { findAll: () => [] },
      });

      await expect(useCaseWithoutRepo.execute()).rejects.toMatchObject({
        name: "PixKeyManagementError",
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.MISSING_PIX_KEY_REPOSITORY,
        field: "pixKeyRepository",
      });

      await expect(executeListPixKeys()).rejects.toMatchObject({
        name: "PixKeyManagementError",
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.MISSING_PIX_KEY_REPOSITORY,
      });

      await expect(useCaseWithIncompleteRepo.execute()).rejects.toMatchObject({
        name: "PixKeyManagementError",
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.MISSING_PIX_KEY_REPOSITORY,
        field: "pixKeyRepository",
      });
    });
  });
});
