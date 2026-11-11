import { describe, expect, it, vi } from "vitest";
import {
  ChaveConta,
  PIX_KEY_ERROR_CODES,
  PIX_KEY_TYPES,
  PixKeyValidationError,
} from "../../domain/entities/pix-key.entity.js";
import {
  PIX_KEY_MANAGEMENT_ERROR_CODES,
  PixKeyManagementError,
  SavePixKeyUseCase,
  assertPixKeyRepository,
  executeSavePixKey,
  hydrateChaveContaList,
} from "./save-pix-key.use-case.js";

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
    save: vi.fn(async (chaveConta) => {
      keys.set(chaveConta.id, chaveConta);
      return chaveConta;
    }),
    deleteById: vi.fn(async (id) => {
      keys.delete(id);
    }),
    getSelectedKeyId: vi.fn(async () => selectedKeyId),
    setSelectedKeyId: vi.fn(async (id) => {
      selectedKeyId = id;
    }),
  };
}

describe("save-pix-key.use-case.js — SavePixKeyUseCase (TASK-02.4.1)", () => {
  const rawFirstKey = {
    id: "key-01",
    rotulo: "Conta Principal",
    tipo_chave: PIX_KEY_TYPES.EMAIL,
    valor_chave: "  EU@LUIZCA.NET ",
    nome_recebedor: "Luiz Henrique Canet Filho",
    cidade_recebedor: "Brasília",
    criado_em: "2026-11-07T16:00:00.000Z",
  };

  const rawSecondKey = {
    id: "key-02",
    rotulo: "Conta Secundária",
    tipo_chave: PIX_KEY_TYPES.CPF,
    valor_chave: "123.456.789-09",
    nome_recebedor: "Luiz Henrique Canet Filho",
    cidade_recebedor: "Brasília",
    criado_em: "2026-11-07T16:05:00.000Z",
  };

  describe("Error Classes & Constants", () => {
    it("should expose frozen PIX_KEY_MANAGEMENT_ERROR_CODES and instantiate PixKeyManagementError with defaults and custom metadata", () => {
      expect(Object.isFrozen(PIX_KEY_MANAGEMENT_ERROR_CODES)).toBe(true);
      expect(PIX_KEY_MANAGEMENT_ERROR_CODES).toEqual({
        MISSING_PIX_KEY_REPOSITORY: "MISSING_PIX_KEY_REPOSITORY",
        DUPLICATE_PIX_KEY: "DUPLICATE_PIX_KEY",
        MISSING_PIX_KEY_ID: "MISSING_PIX_KEY_ID",
        PIX_KEY_NOT_FOUND: "PIX_KEY_NOT_FOUND",
      });

      const defaultError = new PixKeyManagementError("Erro padrão");
      expect(defaultError).toBeInstanceOf(Error);
      expect(defaultError).toBeInstanceOf(PixKeyManagementError);
      expect(defaultError.name).toBe("PixKeyManagementError");
      expect(defaultError.message).toBe("Erro padrão");
      expect(defaultError.code).toBe("PIX_KEY_MANAGEMENT_ERROR");
      expect(defaultError.field).toBeNull();

      const customError = new PixKeyManagementError("Chave duplicada", {
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.DUPLICATE_PIX_KEY,
        field: "valor_chave",
      });
      expect(customError.code).toBe("DUPLICATE_PIX_KEY");
      expect(customError.field).toBe("valor_chave");
    });
  });

  describe("First Key Registration & Auto-Selection (Scenario 01 — RN01, RN02)", () => {
    it("should validate, persist, and automatically select the first registered ChaveConta", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository();
      const useCase = SavePixKeyUseCase.create({ pixKeyRepository });

      // Act
      const result = await useCase.execute(rawFirstKey);

      // Assert
      expect(Object.isFrozen(result)).toBe(true);
      expect(result.chaveConta).toBeInstanceOf(ChaveConta);
      expect(result.chave_conta).toBe(result.chaveConta);
      expect(result.chaveConta.id).toBe("key-01");
      expect(result.chaveConta.valor_chave).toBe("eu@luizca.net");
      expect(result.selectedKeyId).toBe("key-01");
      expect(result.isSelected).toBe(true);

      expect(pixKeyRepository.save).toHaveBeenCalledTimes(1);
      expect(pixKeyRepository.save).toHaveBeenCalledWith(result.chaveConta);
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledTimes(1);
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledWith("key-01");
    });

    it("should auto-select newly saved key when existing repository has keys but selectedKeyId is null or orphan", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey],
        initialSelectedKeyId: "orphan-key-id",
      });

      // Act
      const result = await executeSavePixKey(
        { chaveConta: ChaveConta.create(rawSecondKey) },
        { pixKeyRepository },
      );

      // Assert
      expect(result.chaveConta.id).toBe("key-02");
      expect(result.selectedKeyId).toBe("key-02");
      expect(result.isSelected).toBe(true);
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledWith("key-02");
    });
  });

  describe("Multiple Keys & selectAsActive Flag (Scenario 02 — RN01, RN02)", () => {
    it("should preserve current active key when registering an additional key with selectAsActive omitted or false", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey],
        initialSelectedKeyId: "key-01",
      });
      const useCase = new SavePixKeyUseCase({ pixKeyRepository });

      // Act
      const result = await useCase.execute({
        chave_conta: rawSecondKey,
      });

      // Assert
      expect(result.chaveConta.id).toBe("key-02");
      expect(result.selectedKeyId).toBe("key-01");
      expect(result.isSelected).toBe(false);
      expect(pixKeyRepository.setSelectedKeyId).not.toHaveBeenCalled();
    });

    it("should switch active key to the newly saved key when selectAsActive is true", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey],
        initialSelectedKeyId: "key-01",
      });
      const useCase = new SavePixKeyUseCase({ pixKeyRepository });

      // Act
      const result = await useCase.execute({
        ...rawSecondKey,
        selectAsActive: true,
      });

      // Assert
      expect(result.chaveConta.id).toBe("key-02");
      expect(result.selectedKeyId).toBe("key-02");
      expect(result.isSelected).toBe(true);
      expect(pixKeyRepository.setSelectedKeyId).toHaveBeenCalledWith("key-02");
    });

    it("should allow updating an existing key with the same id without throwing DUPLICATE_PIX_KEY", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey],
        initialSelectedKeyId: "key-01",
      });
      const useCase = new SavePixKeyUseCase({ pixKeyRepository });
      const updatedKeyInstance = ChaveConta.create({
        ...rawFirstKey,
        rotulo: "Conta Atualizada",
      });

      // Act
      const result = await useCase.execute(updatedKeyInstance);

      // Assert
      expect(result.chaveConta.id).toBe("key-01");
      expect(result.chaveConta.rotulo).toBe("Conta Atualizada");
      expect(result.selectedKeyId).toBe("key-01");
      expect(result.isSelected).toBe(true);
    });
  });

  describe("Duplicate Prevention & Validation Errors (Scenario 03 — INV-01, INV-02)", () => {
    it("should reject with PixKeyManagementError (DUPLICATE_PIX_KEY) when another key has the same normalized tipo_chave and valor_chave", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository({
        initialKeys: [rawFirstKey.toJSON ? rawFirstKey.toJSON() : rawFirstKey],
        initialSelectedKeyId: "key-01",
      });
      const useCase = new SavePixKeyUseCase({ pixKeyRepository });

      // Act & Assert
      await expect(
        useCase.execute({
          id: "key-99",
          rotulo: "Duplicada",
          tipo_chave: "email",
          valor_chave: "eu@luizca.net",
          nome_recebedor: "Outro Nome",
          cidade_recebedor: "Sao Paulo",
        }),
      ).rejects.toMatchObject({
        name: "PixKeyManagementError",
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.DUPLICATE_PIX_KEY,
        field: "valor_chave",
      });

      expect(pixKeyRepository.save).not.toHaveBeenCalled();
    });

    it("should propagate PixKeyValidationError when input key data is invalid", async () => {
      // Arrange
      const pixKeyRepository = createInMemoryPixKeyRepository();
      const useCase = new SavePixKeyUseCase({ pixKeyRepository });

      // Act & Assert
      await expect(
        useCase.execute({
          tipo_chave: PIX_KEY_TYPES.CPF,
          valor_chave: "111.111.111-11",
          nome_recebedor: "Luiz",
          cidade_recebedor: "Brasilia",
        }),
      ).rejects.toThrowError(PixKeyValidationError);

      await expect(useCase.execute(null)).rejects.toMatchObject({
        name: "PixKeyValidationError",
        code: PIX_KEY_ERROR_CODES.INVALID_KEY_TYPE,
      });

      expect(pixKeyRepository.save).not.toHaveBeenCalled();
    });

    it("should reject with MISSING_PIX_KEY_REPOSITORY when repository is missing or lacks required port methods", async () => {
      const useCaseWithoutRepo = new SavePixKeyUseCase();
      const useCaseWithIncompleteRepo = new SavePixKeyUseCase({
        pixKeyRepository: { findAll: () => [] },
      });

      await expect(
        useCaseWithoutRepo.execute(rawFirstKey),
      ).rejects.toMatchObject({
        name: "PixKeyManagementError",
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.MISSING_PIX_KEY_REPOSITORY,
        field: "pixKeyRepository",
      });

      await expect(
        useCaseWithIncompleteRepo.execute(rawFirstKey),
      ).rejects.toMatchObject({
        name: "PixKeyManagementError",
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.MISSING_PIX_KEY_REPOSITORY,
        field: "pixKeyRepository",
      });
    });

    it("should handle repository returning non-array, null, or plain JSON items in findAll gracefully", async () => {
      const customRepo = {
        findAll: vi.fn().mockResolvedValue([rawFirstKey]),
        save: vi.fn(async (key) => key),
        getSelectedKeyId: vi.fn().mockResolvedValue("key-01"),
        setSelectedKeyId: vi.fn().mockResolvedValue(undefined),
      };

      expect(assertPixKeyRepository(customRepo)).toBe(customRepo);
      expect(hydrateChaveContaList(null)).toEqual([]);
      expect(hydrateChaveContaList([rawFirstKey])[0]).toBeInstanceOf(
        ChaveConta,
      );

      const result = await executeSavePixKey(rawSecondKey, {
        pixKeyRepository: customRepo,
      });

      expect(result.chaveConta.id).toBe("key-02");
      expect(result.selectedKeyId).toBe("key-01");
      expect(result.isSelected).toBe(false);

      customRepo.findAll.mockResolvedValueOnce(null);
      customRepo.getSelectedKeyId.mockResolvedValueOnce(null);
      const emptyResult = await new SavePixKeyUseCase({
        pixKeyRepository: customRepo,
      }).execute(rawFirstKey);
      expect(emptyResult.isSelected).toBe(true);
      await expect(
        new SavePixKeyUseCase({ pixKeyRepository: customRepo }).execute(),
      ).rejects.toThrowError(PixKeyValidationError);
    });
  });
});
