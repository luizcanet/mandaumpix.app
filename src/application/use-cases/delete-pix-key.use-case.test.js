import { describe, expect, it, vi } from "vitest";
import {
  ChaveConta,
  PIX_KEY_TYPES,
} from "../../domain/entities/pix-key.entity.js";
import { PIX_KEY_MANAGEMENT_ERROR_CODES } from "./save-pix-key.use-case.js";
import {
  DeletePixKeyUseCase,
  executeDeletePixKey,
} from "./delete-pix-key.use-case.js";

function createInMemoryPixKeyRepository({
  initialKeys = [],
  initialSelectedKeyId = null,
} = {}) {
  const keys = new Map(
    initialKeys.map((item) => {
      const entity =
        item instanceof ChaveConta ? item : ChaveConta.create(item);
      return [entity.id, entity];
    }),
  );
  let selectedKeyId = initialSelectedKeyId;

  return {
    findAll: vi.fn(async () => Array.from(keys.values())),
    deleteById: vi.fn(async (id) => {
      keys.delete(id);
    }),
    getSelectedKeyId: vi.fn(async () => selectedKeyId),
    setSelectedKeyId: vi.fn(async (id) => {
      selectedKeyId = id;
    }),
  };
}

describe("delete-pix-key.use-case.js — DeletePixKeyUseCase (TASK-02.4.4)", () => {
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

  describe("Deletion & Active Key Reassignment (Scenario 04 & INV-06 — RN01, RN02)", () => {
    it("should delete an inactive key and keep the currently active selectedKey unchanged", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey, rawSecondKey],
        initialSelectedKeyId: "key-01",
      });
      const useCase = DeletePixKeyUseCase.create({ pixKeyRepository });

      // Act
      const result = await useCase.execute({ id: "key-02" });

      // Assert
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.items)).toBe(true);
      expect(result.deletedKeyId).toBe("key-02");
      expect(result.deletedKey).toBeInstanceOf(ChaveConta);
      expect(result.deletedKey.id).toBe("key-02");
      expect(result.items).toHaveLength(1);
      expect(result.keys).toBe(result.items);
      expect(result.selectedKeyId).toBe("key-01");
      expect(result.selectedKey.id).toBe("key-01");
      expect(pixKeyRepository.deleteById).toHaveBeenCalledTimes(1);
      expect(pixKeyRepository.deleteById).toHaveBeenCalledWith("key-02");
      expect(pixKeyRepository.setSelectedKeyId).not.toHaveBeenCalled();
    });

    it("should delete the active key and automatically reassign selection to the first remaining key", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey, rawSecondKey],
        initialSelectedKeyId: "key-01",
      });

      // Act
      const result = await executeDeletePixKey("key-01", { pixKeyRepository });

      // Assert
      expect(result.deletedKeyId).toBe("key-01");
      expect(result.items).toHaveLength(1);
      expect(result.selectedKeyId).toBe("key-02");
      expect(result.selectedKey.id).toBe("key-02");
      expect(pixKeyRepository.deleteById).toHaveBeenCalledWith("key-01");
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledTimes(1);
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledWith("key-02");
    });

    it("should delete the last remaining key and clear selectedKeyId to null", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey],
        initialSelectedKeyId: "key-01",
      });
      const useCase = new DeletePixKeyUseCase({ pixKeyRepository });

      // Act
      const result = await useCase.execute({ id: "key-01" });

      // Assert
      expect(result.deletedKeyId).toBe("key-01");
      expect(result.items).toEqual([]);
      expect(result.selectedKeyId).toBeNull();
      expect(result.selectedKey).toBeNull();
      expect(pixKeyRepository.deleteById).toHaveBeenCalledWith("key-01");
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledTimes(1);
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledWith(null);
    });

    it("should not call setSelectedKeyId(null) when deleting the last key if selectedKeyId was already null", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey],
        initialSelectedKeyId: null,
      });
      const useCase = new DeletePixKeyUseCase({ pixKeyRepository });

      // Act
      const result = await useCase.execute("key-01");

      // Assert
      expect(result.items).toEqual([]);
      expect(result.selectedKeyId).toBeNull();
      expect(result.selectedKey).toBeNull();
      expect(pixKeyRepository.setSelectedKeyId).not.toHaveBeenCalled();
    });
  });

  describe("Validation & Error Handling (INV-01, INV-06)", () => {
    it.each([[undefined], [null], [""], ["   "], [{}]])(
      "should reject with MISSING_PIX_KEY_ID when input id is %p",
      async (invalidInput) => {
        const pixKeyRepository = createInMemoryPixKeyRepository({
          initialKeys: [rawFirstKey],
        });
        const useCase = new DeletePixKeyUseCase({ pixKeyRepository });

        await expect(useCase.execute(invalidInput)).rejects.toMatchObject({
          name: "PixKeyManagementError",
          code: PIX_KEY_MANAGEMENT_ERROR_CODES.MISSING_PIX_KEY_ID,
          field: "id",
        });

        expect(pixKeyRepository.deleteById).not.toHaveBeenCalled();
      },
    );

    it("should reject with PIX_KEY_NOT_FOUND when the target key id does not exist in repository", async () => {
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey],
        initialSelectedKeyId: "key-01",
      });
      const useCase = new DeletePixKeyUseCase({ pixKeyRepository });

      await expect(
        useCase.execute({ id: "non-existent-id" }),
      ).rejects.toMatchObject({
        name: "PixKeyManagementError",
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.PIX_KEY_NOT_FOUND,
        field: "id",
      });

      expect(pixKeyRepository.deleteById).not.toHaveBeenCalled();
    });

    it("should reject with MISSING_PIX_KEY_REPOSITORY when repository is missing or lacks required port methods", async () => {
      const useCaseWithoutRepo = new DeletePixKeyUseCase();
      const useCaseWithIncompleteRepo = new DeletePixKeyUseCase({
        pixKeyRepository: { findAll: () => [] },
      });

      await expect(
        useCaseWithoutRepo.execute({ id: "key-01" }),
      ).rejects.toMatchObject({
        name: "PixKeyManagementError",
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.MISSING_PIX_KEY_REPOSITORY,
        field: "pixKeyRepository",
      });

      await expect(
        useCaseWithIncompleteRepo.execute({ id: "key-01" }),
      ).rejects.toMatchObject({
        name: "PixKeyManagementError",
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.MISSING_PIX_KEY_REPOSITORY,
        field: "pixKeyRepository",
      });
    });
  });
});

