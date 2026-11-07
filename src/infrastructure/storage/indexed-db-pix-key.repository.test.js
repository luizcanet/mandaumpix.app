import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_DB_NAME,
  DEFAULT_DB_VERSION,
  OBJECT_STORES,
  PIX_KEY_INDEXES,
  PIX_KEY_STORAGE_ERROR_CODES,
  PixKeyStorageError,
  SELECTED_KEY_SETTING_KEY,
  assertIndexedDbFactory,
  mapStorageDomException,
  openPixKeyDatabase,
  upgradePixKeyDatabaseSchema,
} from "./indexed-db-pix-key.repository.js";

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
});
