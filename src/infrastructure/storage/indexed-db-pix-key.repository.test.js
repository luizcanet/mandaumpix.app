import { describe, expect, it, vi } from "vitest";
import { DeletePixKeyUseCase } from "../../application/use-cases/delete-pix-key.use-case.js";
import { GeneratePixChargeUseCase } from "../../application/use-cases/generate-pix-charge.use-case.js";
import { ListPixKeysUseCase } from "../../application/use-cases/list-pix-keys.use-case.js";
import {
  PIX_KEY_MANAGEMENT_ERROR_CODES,
  SavePixKeyUseCase,
} from "../../application/use-cases/save-pix-key.use-case.js";
import { SelectPixKeyUseCase } from "../../application/use-cases/select-pix-key.use-case.js";
import {
  ChaveConta,
  PixKeyValidationError,
} from "../../domain/entities/pix-key.entity.js";
import {
  DEFAULT_DB_NAME,
  DEFAULT_DB_VERSION,
  IndexedDbPixKeyRepository,
  OBJECT_STORES,
  PIX_KEY_INDEXES,
  PIX_KEY_STORAGE_ERROR_CODES,
  PixKeyStorageError,
  SELECTED_KEY_SETTING_KEY,
  assertIndexedDbFactory,
  createIndexedDbPixKeyRepository,
  mapStorageDomException,
  openPixKeyDatabase,
  upgradePixKeyDatabaseSchema,
} from "./indexed-db-pix-key.repository.js";

function createInMemoryIndexedDb({ failMode = null } = {}) {
  const databases = new Map();

  function createObjectStoreState(keyPath) {
    return {
      keyPath,
      records: new Map(),
      indexes: new Map(),
    };
  }

  function createObjectStoreHandle(storeState, txState) {
    function runRequest(operationFn) {
      if (failMode === "sync-store-throw") {
        throw new Error("Store operation synchronous failure");
      }

      const request = {
        result: undefined,
        error: null,
        onsuccess: null,
        onerror: null,
      };

      queueMicrotask(() => {
        if (failMode === "quota-exceeded") {
          const quotaError = {
            name: "QuotaExceededError",
            message: "Storage quota exceeded",
          };
          request.error = quotaError;
          txState.error = quotaError;
          request.onerror?.({ target: request });
          txState.onerror?.({ target: txState });
          return;
        }

        if (failMode === "request-error") {
          const reqError = new Error("IDBRequest execution failed");
          request.error = reqError;
          request.onerror?.({ target: request });
          return;
        }

        if (failMode === "tx-abort") {
          const abortError = new Error("Transaction aborted");
          abortError.name = "AbortError";
          txState.error = abortError;
          txState.onabort?.({ target: txState });
          return;
        }

        if (failMode === "tx-error-without-request-error") {
          const txError = new Error("Transaction level failure");
          txState.error = txError;
          txState.onerror?.({ target: txState });
          return;
        }

        request.result = operationFn();
        request.onsuccess?.({ target: request });
        queueMicrotask(() => {
          txState.oncomplete?.({ target: txState });
        });
      });

      return request;
    }

    return {
      indexNames: {
        contains: (name) => storeState.indexes.has(name),
      },
      createIndex: vi.fn((name, keyPath, options) => {
        storeState.indexes.set(name, { name, keyPath, options });
        return { name, keyPath, options };
      }),
      getAll: vi.fn(() =>
        runRequest(() =>
          Array.from(storeState.records.values()).map((item) => ({ ...item })),
        ),
      ),
      get: vi.fn((key) =>
        runRequest(() => {
          const record = storeState.records.get(key);
          return record ? { ...record } : undefined;
        }),
      ),
      put: vi.fn((value) =>
        runRequest(() => {
          const key = value[storeState.keyPath];
          storeState.records.set(key, { ...value });
          return key;
        }),
      ),
      delete: vi.fn((key) =>
        runRequest(() => {
          storeState.records.delete(key);
          return undefined;
        }),
      ),
      clear: vi.fn(() =>
        runRequest(() => {
          storeState.records.clear();
          return undefined;
        }),
      ),
    };
  }

  return {
    open: vi.fn((dbName, version) => {
      const request = {
        result: null,
        transaction: null,
        error: null,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null,
      };

      queueMicrotask(() => {
        let dbEntry = databases.get(dbName);
        const isUpgrade = !dbEntry || dbEntry.version < version;

        if (!dbEntry) {
          const stores = new Map();
          const db = {
            name: dbName,
            version,
            closed: false,
            onversionchange: null,
            objectStoreNames: {
              contains: (name) => stores.has(name),
            },
            createObjectStore: vi.fn((name, options = { keyPath: "id" }) => {
              const storeState = createObjectStoreState(options.keyPath);
              stores.set(name, storeState);
              return createObjectStoreHandle(storeState, {});
            }),
            transaction: vi.fn((storeNames, mode = "readonly") => {
              if (failMode === "sync-tx-throw") {
                throw new Error("Transaction creation failed");
              }

              const txState = {
                mode,
                error: null,
                oncomplete: null,
                onerror: null,
                onabort: null,
                objectStore: vi.fn((name) => {
                  const storeState = stores.get(name);
                  return createObjectStoreHandle(storeState, txState);
                }),
              };
              return txState;
            }),
            close: vi.fn(() => {
              db.closed = true;
            }),
          };

          dbEntry = { db, stores, version };
          databases.set(dbName, dbEntry);
        }

        request.result = dbEntry.db;
        request.transaction = {
          objectStore: (name) =>
            createObjectStoreHandle(dbEntry.stores.get(name), {}),
        };

        if (isUpgrade) {
          request.onupgradeneeded?.({ target: request });
        }

        request.onsuccess?.({ target: request });
      });

      return request;
    }),
  };
}

function createFakeUpgradeDb({
  existingStores = [],
  existingIndexes = [],
} = {}) {
  const createdStores = [];
  const createdIndexes = [];
  const storeNameSet = new Set(existingStores);
  const indexNameSet = new Set(existingIndexes);

  const pixKeysStore = {
    indexNames: {
      contains: (indexName) => indexNameSet.has(indexName),
    },
    createIndex: vi.fn((indexName, keyPath, options) => {
      indexNameSet.add(indexName);
      createdIndexes.push({ indexName, keyPath, options });
      return { name: indexName, keyPath, options };
    }),
  };

  const userSettingsStore = {
    indexNames: {
      contains: () => false,
    },
    createIndex: vi.fn(),
  };

  const db = {
    objectStoreNames: {
      contains: (storeName) => storeNameSet.has(storeName),
    },
    createObjectStore: vi.fn((storeName, options) => {
      storeNameSet.add(storeName);
      createdStores.push({ storeName, options });
      return storeName === OBJECT_STORES.PIX_KEYS
        ? pixKeysStore
        : userSettingsStore;
    }),
    close: vi.fn(),
    onversionchange: null,
  };

  const upgradeTransaction = {
    objectStore: vi.fn((storeName) =>
      storeName === OBJECT_STORES.PIX_KEYS ? pixKeysStore : userSettingsStore,
    ),
  };

  return {
    db,
    pixKeysStore,
    userSettingsStore,
    upgradeTransaction,
    createdStores,
    createdIndexes,
  };
}

describe("TASK-03.1.1 — IndexedDB Constants, Errors & Connection Manager", () => {
  describe("Constants & PixKeyStorageError", () => {
    it("should expose immutable schema constants aligned with ADR 0004", () => {
      expect(DEFAULT_DB_NAME).toBe("mandaumpix_db");
      expect(DEFAULT_DB_VERSION).toBe(1);
      expect(SELECTED_KEY_SETTING_KEY).toBe("selectedKeyId");

      expect(OBJECT_STORES).toEqual({
        PIX_KEYS: "pix_keys",
        USER_SETTINGS: "user_settings",
      });
      expect(Object.isFrozen(OBJECT_STORES)).toBe(true);

      expect(PIX_KEY_INDEXES).toEqual({
        BY_TIPO_CHAVE: "by_tipo_chave",
        BY_CRIADO_EM: "by_criado_em",
      });
      expect(Object.isFrozen(PIX_KEY_INDEXES)).toBe(true);

      expect(PIX_KEY_STORAGE_ERROR_CODES).toEqual({
        INDEXED_DB_UNSUPPORTED: "INDEXED_DB_UNSUPPORTED",
        DATABASE_OPEN_FAILED: "DATABASE_OPEN_FAILED",
        DATABASE_BLOCKED: "DATABASE_BLOCKED",
        TRANSACTION_FAILED: "TRANSACTION_FAILED",
        QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
        INVALID_STORAGE_LISTENER: "INVALID_STORAGE_LISTENER",
      });
      expect(Object.isFrozen(PIX_KEY_STORAGE_ERROR_CODES)).toBe(true);
    });

    it("should instantiate PixKeyStorageError with default and custom metadata", () => {
      const defaultError = new PixKeyStorageError("Falha de armazenamento.");
      expect(defaultError).toBeInstanceOf(Error);
      expect(defaultError).toBeInstanceOf(PixKeyStorageError);
      expect(defaultError.name).toBe("PixKeyStorageError");
      expect(defaultError.message).toBe("Falha de armazenamento.");
      expect(defaultError.code).toBe("PIX_KEY_STORAGE_ERROR");
      expect(defaultError.field).toBeNull();
      expect(defaultError.cause).toBeNull();

      const rootCause = new Error("Disk full");
      const customError = new PixKeyStorageError("Cota excedida.", {
        code: PIX_KEY_STORAGE_ERROR_CODES.QUOTA_EXCEEDED,
        field: "pix_keys",
        cause: rootCause,
      });
      expect(customError.code).toBe("QUOTA_EXCEEDED");
      expect(customError.field).toBe("pix_keys");
      expect(customError.cause).toBe(rootCause);
    });

    it("should validate IndexedDB factory presence via assertIndexedDbFactory", () => {
      const validFactory = { open: vi.fn() };
      expect(assertIndexedDbFactory(validFactory)).toBe(validFactory);

      expect(() => assertIndexedDbFactory(null)).toThrowError(
        PixKeyStorageError,
      );
      expect(() => assertIndexedDbFactory({})).toThrowError(
        expect.objectContaining({
          code: PIX_KEY_STORAGE_ERROR_CODES.INDEXED_DB_UNSUPPORTED,
          field: "indexedDb",
        }),
      );
    });

    it("should map QuotaExceededError and generic DOMExceptions into PixKeyStorageError", () => {
      const existingStorageError = new PixKeyStorageError("Já mapeado", {
        code: PIX_KEY_STORAGE_ERROR_CODES.DATABASE_BLOCKED,
      });
      expect(mapStorageDomException(existingStorageError)).toBe(
        existingStorageError,
      );

      const quotaErrorByName = {
        name: "QuotaExceededError",
        message: "Storage quota exceeded",
      };
      const mappedQuota = mapStorageDomException(quotaErrorByName, {
        field: "pix_keys",
      });
      expect(mappedQuota).toBeInstanceOf(PixKeyStorageError);
      expect(mappedQuota.code).toBe(PIX_KEY_STORAGE_ERROR_CODES.QUOTA_EXCEEDED);
      expect(mappedQuota.field).toBe("pix_keys");
      expect(mappedQuota.cause).toBe(quotaErrorByName);

      const quotaErrorByCode = { code: 22 };
      const mappedQuotaByCode = mapStorageDomException(quotaErrorByCode);
      expect(mappedQuotaByCode.code).toBe(
        PIX_KEY_STORAGE_ERROR_CODES.QUOTA_EXCEEDED,
      );
      expect(mappedQuotaByCode.message).toBe(
        "O limite de armazenamento local do navegador foi atingido.",
      );

      const abortError = new Error("The transaction was aborted");
      abortError.name = "AbortError";
      const mappedAbort = mapStorageDomException(abortError, {
        fallbackCode: PIX_KEY_STORAGE_ERROR_CODES.TRANSACTION_FAILED,
        fallbackMessage: "Transação abortada.",
        field: "user_settings",
      });
      expect(mappedAbort.code).toBe(
        PIX_KEY_STORAGE_ERROR_CODES.TRANSACTION_FAILED,
      );
      expect(mappedAbort.message).toBe("The transaction was aborted");
      expect(mappedAbort.field).toBe("user_settings");

      const emptyError = mapStorageDomException(null, {
        fallbackMessage: "Erro padrão de banco.",
      });
      expect(emptyError.code).toBe(
        PIX_KEY_STORAGE_ERROR_CODES.TRANSACTION_FAILED,
      );
      expect(emptyError.message).toBe("Erro padrão de banco.");
    });
  });

  describe("upgradePixKeyDatabaseSchema & openPixKeyDatabase", () => {
    it("should create pix_keys (with indexes) and user_settings stores on initial upgrade", () => {
      const { db, createdStores, createdIndexes } = createFakeUpgradeDb();

      upgradePixKeyDatabaseSchema(db);

      expect(createdStores).toEqual([
        {
          storeName: "pix_keys",
          options: { keyPath: "id" },
        },
        {
          storeName: "user_settings",
          options: { keyPath: "key" },
        },
      ]);

      expect(createdIndexes).toEqual([
        {
          indexName: "by_tipo_chave",
          keyPath: "tipo_chave",
          options: { unique: false },
        },
        {
          indexName: "by_criado_em",
          keyPath: "criado_em",
          options: { unique: false },
        },
      ]);
    });

    it("should be idempotent when stores and indexes already exist during upgrade", () => {
      const { db, pixKeysStore, upgradeTransaction } = createFakeUpgradeDb({
        existingStores: ["pix_keys", "user_settings"],
        existingIndexes: ["by_tipo_chave", "by_criado_em"],
      });

      upgradePixKeyDatabaseSchema(db, upgradeTransaction);

      expect(db.createObjectStore).not.toHaveBeenCalled();
      expect(upgradeTransaction.objectStore).toHaveBeenCalledWith("pix_keys");
      expect(pixKeysStore.createIndex).not.toHaveBeenCalled();
    });

    it("should handle upgrade when pix_keys exists without upgradeTransaction or without indexNames", () => {
      const dbWithoutTx = {
        objectStoreNames: {
          contains: () => true,
        },
        createObjectStore: vi.fn(),
      };
      expect(() =>
        upgradePixKeyDatabaseSchema(dbWithoutTx, null),
      ).not.toThrow();

      const storeWithoutIndexNames = {
        createIndex: vi.fn(),
      };
      const dbWithMinimalStore = {
        objectStoreNames: {
          contains: () => false,
        },
        createObjectStore: vi.fn(() => storeWithoutIndexNames),
      };
      upgradePixKeyDatabaseSchema(dbWithMinimalStore);
      expect(storeWithoutIndexNames.createIndex).toHaveBeenCalledTimes(2);
    });

    it("should open database, run onupgradeneeded, and configure onversionchange handler", async () => {
      const { db, upgradeTransaction, createdStores } = createFakeUpgradeDb();
      const onVersionChangeSpy = vi.fn();

      const indexedDb = {
        open: vi.fn(() => {
          const request = {
            result: db,
            transaction: upgradeTransaction,
            error: null,
            onupgradeneeded: null,
            onsuccess: null,
            onerror: null,
            onblocked: null,
          };

          queueMicrotask(() => {
            if (request.onupgradeneeded) {
              request.onupgradeneeded({ target: request });
            }
            if (request.onsuccess) {
              request.onsuccess({ target: request });
            }
          });

          return request;
        }),
      };

      const openedDb = await openPixKeyDatabase({
        indexedDb,
        onVersionChange: onVersionChangeSpy,
      });

      expect(indexedDb.open).toHaveBeenCalledWith("mandaumpix_db", 1);
      expect(openedDb).toBe(db);
      expect(createdStores).toHaveLength(2);
      expect(typeof db.onversionchange).toBe("function");

      db.onversionchange();
      expect(db.close).toHaveBeenCalledTimes(1);
      expect(onVersionChangeSpy).toHaveBeenCalledWith(db);
    });

    it("should reject with INDEXED_DB_UNSUPPORTED when indexedDb is unavailable", async () => {
      await expect(openPixKeyDatabase()).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.INDEXED_DB_UNSUPPORTED,
      });

      await expect(
        openPixKeyDatabase({ indexedDb: null }),
      ).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.INDEXED_DB_UNSUPPORTED,
      });
    });

    it("should handle onversionchange gracefully when close or onVersionChange are omitted and when result is null", async () => {
      const dbWithoutClose = {};
      const indexedDbWithMinimalResult = {
        open: vi.fn(() => {
          const request = { result: dbWithoutClose };
          queueMicrotask(() => {
            request.onsuccess?.();
          });
          return request;
        }),
      };

      const opened = await openPixKeyDatabase({
        indexedDb: indexedDbWithMinimalResult,
      });
      expect(opened).toBe(dbWithoutClose);
      expect(() => opened.onversionchange()).not.toThrow();

      const indexedDbWithNullResult = {
        open: vi.fn(() => {
          const request = { result: null };
          queueMicrotask(() => {
            request.onsuccess?.();
          });
          return request;
        }),
      };

      await expect(
        openPixKeyDatabase({ indexedDb: indexedDbWithNullResult }),
      ).resolves.toBeNull();
    });

    it("should reject with DATABASE_BLOCKED when open request triggers onblocked", async () => {
      const indexedDb = {
        open: vi.fn(() => {
          const request = {};
          queueMicrotask(() => {
            request.onblocked?.({ target: request });
          });
          return request;
        }),
      };

      await expect(openPixKeyDatabase({ indexedDb })).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.DATABASE_BLOCKED,
        field: "mandaumpix_db",
      });
    });

    it("should reject with DATABASE_OPEN_FAILED or QUOTA_EXCEEDED when open request fails", async () => {
      const genericFailIndexedDb = {
        open: vi.fn(() => {
          const request = {
            error: new Error("Unknown IDB error"),
          };
          queueMicrotask(() => {
            request.onerror?.({ target: request });
          });
          return request;
        }),
      };

      await expect(
        openPixKeyDatabase({ indexedDb: genericFailIndexedDb }),
      ).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.DATABASE_OPEN_FAILED,
        message: "Unknown IDB error",
      });

      const quotaFailIndexedDb = {
        open: vi.fn(() => {
          const request = {
            error: { name: "QuotaExceededError", message: "Quota reached" },
          };
          queueMicrotask(() => {
            request.onerror?.({ target: request });
          });
          return request;
        }),
      };

      await expect(
        openPixKeyDatabase({ indexedDb: quotaFailIndexedDb }),
      ).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.QUOTA_EXCEEDED,
      });
    });

    it("should reject with DATABASE_OPEN_FAILED when open() throws synchronously or schema upgrade throws", async () => {
      const syncThrowIndexedDb = {
        open: vi.fn(() => {
          throw new Error("SecurityError: indexedDB disabled");
        }),
      };

      await expect(
        openPixKeyDatabase({ indexedDb: syncThrowIndexedDb }),
      ).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.DATABASE_OPEN_FAILED,
      });

      const upgradeThrowIndexedDb = {
        open: vi.fn(() => {
          const brokenDb = {
            objectStoreNames: {
              contains: () => false,
            },
            createObjectStore: () => {
              throw new Error("Failed to create store");
            },
          };
          const request = {
            result: brokenDb,
            transaction: null,
          };
          queueMicrotask(() => {
            request.onupgradeneeded?.({ target: request });
          });
          return request;
        }),
      };

      await expect(
        openPixKeyDatabase({ indexedDb: upgradeThrowIndexedDb }),
      ).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.DATABASE_OPEN_FAILED,
        message: "Failed to create store",
      });
    });
  });

  describe("TASK-03.1.2 — IndexedDbPixKeyRepository Transactional Operations", () => {
    it("should create repository via constructor, static create(), and factory createIndexedDbPixKeyRepository()", async () => {
      const indexedDb = createInMemoryIndexedDb();
      const repoA = new IndexedDbPixKeyRepository({ indexedDb });
      const repoB = IndexedDbPixKeyRepository.create({ indexedDb });
      const repoC = createIndexedDbPixKeyRepository({ indexedDb });

      expect(repoA).toBeInstanceOf(IndexedDbPixKeyRepository);
      expect(repoB).toBeInstanceOf(IndexedDbPixKeyRepository);
      expect(repoC).toBeInstanceOf(IndexedDbPixKeyRepository);

      const emptyList = await repoA.findAll();
      expect(emptyList).toEqual([]);
      expect(Object.isFrozen(emptyList)).toBe(true);

      const nonArrayGetAllIndexedDb = {
        open: vi.fn(() => {
          const request = {};
          queueMicrotask(() => {
            request.result = {
              transaction: () => ({
                objectStore: () => ({
                  getAll: () => {
                    const getAllReq = { result: null };
                    queueMicrotask(() => getAllReq.onsuccess?.());
                    return getAllReq;
                  },
                }),
              }),
            };
            request.onsuccess?.();
          });
          return request;
        }),
      };

      const nonArrayRepo = createIndexedDbPixKeyRepository({
        indexedDb: nonArrayGetAllIndexedDb,
      });
      await expect(nonArrayRepo.findAll()).resolves.toEqual([]);
    });

    it("should save, findById, findAll (sorted by criado_em and id), and deleteById ChaveConta records", async () => {
      const indexedDb = createInMemoryIndexedDb();
      const repository = createIndexedDbPixKeyRepository({ indexedDb });

      const keyLater = ChaveConta.create({
        id: "key-b",
        rotulo: "Conta Secundária",
        tipo_chave: "EMAIL",
        valor_chave: "secundaria@mandaumpix.app",
        nome_recebedor: "Maria Souza",
        cidade_recebedor: "Sao Paulo",
        criado_em: "2026-11-07T12:00:00.000Z",
      });

      const keyEarlierB = {
        id: "key-a-2",
        rotulo: "Conta Principal B",
        tipo_chave: "CPF",
        valor_chave: "12345678909",
        nome_recebedor: "Maria Souza",
        cidade_recebedor: "Sao Paulo",
        criado_em: "2026-11-07T10:00:00.000Z",
      };

      const keyEarlierA = ChaveConta.create({
        id: "key-a-1",
        rotulo: "Conta Principal A",
        tipo_chave: "CNPJ",
        valor_chave: "11222333000181",
        nome_recebedor: "Maria Souza",
        cidade_recebedor: "Sao Paulo",
        criado_em: "2026-11-07T10:00:00.000Z",
      });

      const savedLater = await repository.save(keyLater);
      const savedEarlierB = await repository.save(keyEarlierB);
      const savedEarlierA = await repository.save(keyEarlierA);

      expect(savedLater).toBeInstanceOf(ChaveConta);
      expect(savedEarlierB).toBeInstanceOf(ChaveConta);
      expect(savedEarlierA).toBeInstanceOf(ChaveConta);

      const allKeys = await repository.findAll();
      expect(allKeys.map((item) => item.id)).toEqual([
        "key-a-1",
        "key-a-2",
        "key-b",
      ]);
      expect(Object.isFrozen(allKeys)).toBe(true);

      const foundById = await repository.findById("  key-a-2  ");
      expect(foundById).toBeInstanceOf(ChaveConta);
      expect(foundById.valor_chave).toBe("12345678909");

      expect(await repository.findById("non-existent")).toBeNull();
      expect(await repository.findById("")).toBeNull();
      expect(await repository.findById(null)).toBeNull();

      expect(await repository.deleteById("")).toBe(false);
      expect(await repository.deleteById(null)).toBe(false);

      const deleted = await repository.deleteById("key-a-2");
      expect(deleted).toBe(true);
      expect(await repository.findById("key-a-2")).toBeNull();

      const remaining = await repository.findAll();
      expect(remaining.map((item) => item.id)).toEqual(["key-a-1", "key-b"]);
    });

    it("should reject save() with PixKeyValidationError when input is an invalid ChaveConta", async () => {
      const indexedDb = createInMemoryIndexedDb();
      const repository = createIndexedDbPixKeyRepository({ indexedDb });

      await expect(
        repository.save({
          tipo_chave: "CPF",
          valor_chave: "111.111.111-11",
          nome_recebedor: "Titular",
          cidade_recebedor: "Brasilia",
        }),
      ).rejects.toThrowError(PixKeyValidationError);
    });

    it("should persist and retrieve selectedKeyId and resolve getSelectedKey()", async () => {
      const indexedDb = createInMemoryIndexedDb();
      const repository = createIndexedDbPixKeyRepository({ indexedDb });

      expect(await repository.getSelectedKeyId()).toBeNull();
      expect(await repository.getSelectedKey()).toBeNull();

      const key = await repository.save({
        id: "key-selected",
        tipo_chave: "EMAIL",
        valor_chave: "ativa@mandaumpix.app",
        nome_recebedor: "Luiz Canet",
        cidade_recebedor: "Brasilia",
      });

      const persistedId = await repository.setSelectedKeyId("  key-selected  ");
      expect(persistedId).toBe("key-selected");
      expect(await repository.getSelectedKeyId()).toBe("key-selected");

      const selectedEntity = await repository.getSelectedKey();
      expect(selectedEntity).toBeInstanceOf(ChaveConta);
      expect(selectedEntity.id).toBe(key.id);

      const clearedId = await repository.setSelectedKeyId("   ");
      expect(clearedId).toBeNull();
      expect(await repository.getSelectedKeyId()).toBeNull();
      expect(await repository.getSelectedKey()).toBeNull();

      await repository.setSelectedKeyId("orphan-id");
      expect(await repository.getSelectedKeyId()).toBe("orphan-id");
      expect(await repository.getSelectedKey()).toBeNull();

      await repository.setSelectedKeyId(null);
      expect(await repository.getSelectedKeyId()).toBeNull();
    });

    it("should clear all stores via clear() and manage connection cache across close() and versionchange", async () => {
      const indexedDb = createInMemoryIndexedDb();
      const repository = createIndexedDbPixKeyRepository({ indexedDb });

      await repository.save({
        id: "key-1",
        tipo_chave: "EMAIL",
        valor_chave: "teste@mandaumpix.app",
        nome_recebedor: "Luiz Canet",
        cidade_recebedor: "Brasilia",
      });
      await repository.setSelectedKeyId("key-1");

      expect(indexedDb.open).toHaveBeenCalledTimes(1);

      await repository.clear();
      expect(await repository.findAll()).toEqual([]);
      expect(await repository.getSelectedKeyId()).toBeNull();

      repository.close();
      expect(() => repository.close()).not.toThrow();

      await repository.findAll();
      expect(indexedDb.open).toHaveBeenCalledTimes(2);

      const activeDb = await repository.getDatabase();
      activeDb.onversionchange();

      await repository.findAll();
      expect(indexedDb.open).toHaveBeenCalledTimes(3);
    });

    it("should reset cached database promise when openPixKeyDatabase fails so subsequent calls can retry", async () => {
      let shouldFailOpen = true;
      const baseIndexedDb = createInMemoryIndexedDb();
      const flakyIndexedDb = {
        open: vi.fn((dbName, version) => {
          if (shouldFailOpen) {
            throw new Error("Temporary open failure");
          }
          return baseIndexedDb.open(dbName, version);
        }),
      };

      const repository = createIndexedDbPixKeyRepository({
        indexedDb: flakyIndexedDb,
      });

      await expect(repository.findAll()).rejects.toMatchObject({
        code: PIX_KEY_STORAGE_ERROR_CODES.DATABASE_OPEN_FAILED,
      });

      shouldFailOpen = false;
      await expect(repository.findAll()).resolves.toEqual([]);
    });

    it("should map QuotaExceededError, AbortError, request errors, and sync throws into PixKeyStorageError", async () => {
      const quotaRepo = createIndexedDbPixKeyRepository({
        indexedDb: createInMemoryIndexedDb({ failMode: "quota-exceeded" }),
      });

      await expect(
        quotaRepo.save({
          tipo_chave: "EMAIL",
          valor_chave: "quota@mandaumpix.app",
          nome_recebedor: "Luiz Canet",
          cidade_recebedor: "Brasilia",
        }),
      ).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.QUOTA_EXCEEDED,
      });

      const abortRepo = createIndexedDbPixKeyRepository({
        indexedDb: createInMemoryIndexedDb({ failMode: "tx-abort" }),
      });

      await expect(abortRepo.findAll()).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.TRANSACTION_FAILED,
        message: "Transaction aborted",
      });

      const reqErrorRepo = createIndexedDbPixKeyRepository({
        indexedDb: createInMemoryIndexedDb({ failMode: "request-error" }),
      });

      await expect(reqErrorRepo.getSelectedKeyId()).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.TRANSACTION_FAILED,
        message: "IDBRequest execution failed",
      });

      const txErrorRepo = createIndexedDbPixKeyRepository({
        indexedDb: createInMemoryIndexedDb({
          failMode: "tx-error-without-request-error",
        }),
      });

      await expect(txErrorRepo.setSelectedKeyId("id-1")).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.TRANSACTION_FAILED,
        message: "Transaction level failure",
      });

      const syncStoreThrowRepo = createIndexedDbPixKeyRepository({
        indexedDb: createInMemoryIndexedDb({ failMode: "sync-store-throw" }),
      });

      await expect(syncStoreThrowRepo.deleteById("id-1")).rejects.toMatchObject(
        {
          name: "PixKeyStorageError",
          code: PIX_KEY_STORAGE_ERROR_CODES.TRANSACTION_FAILED,
          message: "Store operation synchronous failure",
        },
      );

      const syncTxThrowRepo = createIndexedDbPixKeyRepository({
        indexedDb: createInMemoryIndexedDb({ failMode: "sync-tx-throw" }),
      });

      await expect(syncTxThrowRepo.clear()).rejects.toMatchObject({
        name: "PixKeyStorageError",
        code: PIX_KEY_STORAGE_ERROR_CODES.TRANSACTION_FAILED,
        message: "Transaction creation failed",
      });
    });
  });

  describe("TASK-03.1.3 — Reactive State (@modnes/data-controller) & Use Cases Integration", () => {
    it("should initialize reactive state with DataController and notify subscribers on state changes", async () => {
      const indexedDb = createInMemoryIndexedDb();
      const repository = createIndexedDbPixKeyRepository({ indexedDb });

      expect(repository.getState()).toEqual({
        items: [],
        keys: [],
        selectedKeyId: null,
        selectedKey: null,
      });
      expect(Object.isFrozen(repository.getState())).toBe(true);

      const events = [];
      const unsubscribe = repository.subscribe((state, detail) => {
        events.push({ state, detail });
      });

      const savedKey1 = await repository.save({
        id: "key-reactive-1",
        tipo_chave: "EMAIL",
        valor_chave: "reativo1@mandaumpix.app",
        nome_recebedor: "Luiz Canet",
        cidade_recebedor: "Brasilia",
        criado_em: "2026-11-07T10:00:00.000Z",
      });

      expect(events).toHaveLength(1);
      expect(events[0].detail.property).toBe("items");
      expect(events[0].state.items).toEqual([savedKey1]);

      await repository.setSelectedKeyId("key-reactive-1");
      expect(events).toHaveLength(2);
      expect(events[1].detail.property).toBe("selectedKeyId");
      expect(events[1].state.selectedKeyId).toBe("key-reactive-1");
      expect(events[1].state.selectedKey).toEqual(savedKey1);

      const updatedKey1 = await repository.save({
        id: "key-reactive-1",
        rotulo: "Conta Atualizada",
        tipo_chave: "EMAIL",
        valor_chave: "reativo1@mandaumpix.app",
        nome_recebedor: "Luiz Canet",
        cidade_recebedor: "Brasilia",
        criado_em: "2026-11-07T10:00:00.000Z",
      });
      expect(repository.getState().selectedKey.rotulo).toBe("Conta Atualizada");
      expect(repository.getState().items).toEqual([updatedKey1]);

      await repository.deleteById("key-reactive-1");
      expect(repository.getState().items).toEqual([]);
      expect(repository.getState().selectedKey).toBeNull();

      await repository.clear();
      expect(repository.getState()).toEqual({
        items: [],
        keys: [],
        selectedKeyId: null,
        selectedKey: null,
      });

      const countBeforeUnsubscribe = events.length;
      unsubscribe();

      await repository.save({
        id: "key-reactive-2",
        tipo_chave: "CPF",
        valor_chave: "12345678909",
        nome_recebedor: "Luiz Canet",
        cidade_recebedor: "Brasilia",
      });
      expect(events).toHaveLength(countBeforeUnsubscribe);
    });

    it("should expose DataHandler and ArrayHandler proxies on repository.data and validate subscribe listener", () => {
      const indexedDb = createInMemoryIndexedDb();
      const repository = createIndexedDbPixKeyRepository({ indexedDb });

      expect(() => repository.subscribe(null)).toThrowError(
        expect.objectContaining({
          name: "PixKeyStorageError",
          code: PIX_KEY_STORAGE_ERROR_CODES.INVALID_STORAGE_LISTENER,
          field: "listener",
        }),
      );

      const arrayMutations = [];
      repository.subscribe((state, detail) => {
        arrayMutations.push({ state, detail });
      });

      const sampleKey = ChaveConta.create({
        id: "key-proxy",
        tipo_chave: "EMAIL",
        valor_chave: "proxy@mandaumpix.app",
        nome_recebedor: "Luiz Canet",
        cidade_recebedor: "Brasilia",
      });

      repository.data.items.push(sampleKey);
      expect(arrayMutations.length).toBeGreaterThanOrEqual(1);
      expect(arrayMutations[0].detail.property).toBe("items");
      expect(repository.getState().items).toEqual([sampleKey]);
    });

    it("should integrate seamlessly with SavePixKeyUseCase, ListPixKeysUseCase, SelectPixKeyUseCase, DeletePixKeyUseCase, and GeneratePixChargeUseCase", async () => {
      const indexedDb = createInMemoryIndexedDb();
      const pixKeyRepository = createIndexedDbPixKeyRepository({ indexedDb });

      const saveUseCase = SavePixKeyUseCase.create({ pixKeyRepository });
      const listUseCase = ListPixKeysUseCase.create({ pixKeyRepository });
      const selectUseCase = SelectPixKeyUseCase.create({ pixKeyRepository });
      const deleteUseCase = DeletePixKeyUseCase.create({ pixKeyRepository });
      const generateChargeUseCase = GeneratePixChargeUseCase.create({
        pixKeyRepository,
      });

      const firstSaved = await saveUseCase.execute({
        id: "conta-1",
        rotulo: "Nubank",
        tipo_chave: "EMAIL",
        valor_chave: "receber@mandaumpix.app",
        nome_recebedor: "Luiz Henrique Canet Filho",
        cidade_recebedor: "Brasilia",
        criado_em: "2026-11-07T08:00:00.000Z",
      });

      expect(firstSaved.isSelected).toBe(true);
      expect(firstSaved.selectedKeyId).toBe("conta-1");
      expect(pixKeyRepository.getState().selectedKeyId).toBe("conta-1");

      const secondSaved = await saveUseCase.execute({
        id: "conta-2",
        rotulo: "Itaú",
        tipo_chave: "CPF",
        valor_chave: "123.456.789-09",
        nome_recebedor: "Luiz Henrique Canet Filho",
        cidade_recebedor: "Brasilia",
        criado_em: "2026-11-07T09:00:00.000Z",
      });

      expect(secondSaved.isSelected).toBe(false);
      expect(secondSaved.selectedKeyId).toBe("conta-1");

      await expect(
        saveUseCase.execute({
          tipo_chave: "EMAIL",
          valor_chave: "RECEBER@MANDAUMPIX.APP",
          nome_recebedor: "Outro Nome",
          cidade_recebedor: "Brasilia",
        }),
      ).rejects.toMatchObject({
        code: PIX_KEY_MANAGEMENT_ERROR_CODES.DUPLICATE_PIX_KEY,
      });

      await selectUseCase.execute({ id: "conta-2" });
      expect(await pixKeyRepository.getSelectedKeyId()).toBe("conta-2");

      const chargeFixed = await generateChargeUseCase.execute({
        valor_opcional: "50,00",
      });
      expect(chargeFixed.id_chave_conta).toBe("conta-2");
      expect(chargeFixed.valor_opcional).toBe(50);
      expect(chargeFixed.valor_dinamico).toBe(false);
      expect(chargeFixed.chave_cobranca).toContain("12345678909");

      const afterDeleteActive = await deleteUseCase.execute({ id: "conta-2" });
      expect(afterDeleteActive.selectedKeyId).toBe("conta-1");
      expect(afterDeleteActive.items).toHaveLength(1);

      await pixKeyRepository.setSelectedKeyId("id-orfao");
      const listed = await listUseCase.execute();
      expect(listed.selectedKeyId).toBe("conta-1");
      expect(listed.selectedKey.id).toBe("conta-1");

      const afterDeleteLast = await deleteUseCase.execute({ id: "conta-1" });
      expect(afterDeleteLast.items).toEqual([]);
      expect(afterDeleteLast.selectedKeyId).toBeNull();
    });
  });
});
