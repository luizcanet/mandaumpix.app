import { describe, expect, it, vi } from "vitest";
import {
  ChaveConta,
  PIX_KEY_TYPES,
} from "../../domain/entities/pix-key.entity.js";
import { PIX_KEY_MANAGEMENT_ERROR_CODES } from "./save-pix-key.use-case.js";
import {
  SelectPixKeyUseCase,
  executeSelectPixKey,
  resolveRequiredPixKeyId,
} from "./select-pix-key.use-case.js";

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

describe("select-pix-key.use-case.js — SelectPixKeyUseCase (TASK-02.4.3)", () => {
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

  describe("Explicit Active Key Selection (Scenario 03 & INV-05 — RN02)", () => {
    it("should select an existing ChaveConta by id object and persist setSelectedKeyId", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey, rawSecondKey],
        initialSelectedKeyId: "key-01",
      });
      const useCase = SelectPixKeyUseCase.create({ pixKeyRepository });

      // Act
      const result = await useCase.execute({ id: "  key-02 " });

      // Assert
      expect(Object.isFrozen(result)).toBe(true);
      expect(result.selectedKeyId).toBe("key-02");
      expect(result.selectedKey).toBeInstanceOf(ChaveConta);
      expect(result.selectedKey.id).toBe("key-02");
      expect(result.chaveConta).toBe(result.selectedKey);
      expect(result.chave_conta).toBe(result.selectedKey);
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledTimes(1);
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledWith("key-02");
    });

    it("should accept direct string id, selectedKeyId, or id_chave_conta aliases via executeSelectPixKey", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [ChaveConta.create(rawFirstKey), rawSecondKey],
        initialSelectedKeyId: "key-01",
      });

      // Act & Assert
      expect(resolveRequiredPixKeyId(" key-01 ")).toBe("key-01");
      expect(resolveRequiredPixKeyId({ selectedKeyId: "key-02" })).toBe(
        "key-02",
      );
      expect(resolveRequiredPixKeyId({ id_chave_conta: "key-01" })).toBe(
        "key-01",
      );

      const fromString = await executeSelectPixKey("key-02", {
        pixKeyRepository,
      });
      expect(fromString.selectedKeyId).toBe("key-02");

      const fromAlias = await executeSelectPixKey(
        { selectedKeyId: "key-01" },
        { pixKeyRepository },
      );
      expect(fromAlias.selectedKeyId).toBe("key-01");
    });
  });

  describe("Validation & Error Handling (INV-01, INV-05)", () => {
    it.each([[undefined], [null], [""], ["   "], [{}], [{ id: "   " }]])(
      "should reject with MISSING_PIX_KEY_ID when input id is %p",
      async (invalidInput) => {
        const pixKeyRepository = createInMemoryPixKeyRepository({
          initialKeys: [rawFirstKey],
        });
        const useCase = new SelectPixKeyUseCase({ pixKeyRepository });

        await expect(useCase.execute(invalidInput)).rejects.toMatchObject({
          name: "PixKeyManagementError",
          code: PIX_KEY_MANAGEMENT_ERROR_CODES.MISSING_PIX_KEY_ID,
          field: "id",
        });

        expect(pixKeyRepository.setSelectedKeyId).not.toHaveBeenCalled();
      },
    );

    it("should reject with PIX_KEY_NOT_FOUND when the requested key id does not exist in repository", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey],
        initialSelectedKeyId: "key-01",
      });
      const useCase = new SelectPixKeyUseCase({ pixKeyRepository });

      // Act & Assert
      await expect(
        useCase.execute({ id: "non-existent-id" }),
      ).rejects.toMatchObject({
        name: "PixKeyManagementError",
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.PIX_KEY_NOT_FOUND,
        field: "id",
      });

      expect(pixKeyRepository.setSelectedKeyId).not.toHaveBeenCalled();
    });

    it("should reject with MISSING_PIX_KEY_REPOSITORY when repository is missing or lacks required port methods", async () => {
      const useCaseWithoutRepo = new SelectPixKeyUseCase();
      const useCaseWithIncompleteRepo = new SelectPixKeyUseCase({
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
