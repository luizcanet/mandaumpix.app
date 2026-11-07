export const DEFAULT_DB_NAME = "mandaumpix_db";
export const DEFAULT_DB_VERSION = 1;
export const SELECTED_KEY_SETTING_KEY = "selectedKeyId";

export const OBJECT_STORES = Object.freeze({
  PIX_KEYS: "pix_keys",
  USER_SETTINGS: "user_settings",
});

export const PIX_KEY_INDEXES = Object.freeze({
  BY_TIPO_CHAVE: "by_tipo_chave",
  BY_CRIADO_EM: "by_criado_em",
});

export const PIX_KEY_STORAGE_ERROR_CODES = Object.freeze({
  INDEXED_DB_UNSUPPORTED: "INDEXED_DB_UNSUPPORTED",
  DATABASE_OPEN_FAILED: "DATABASE_OPEN_FAILED",
  DATABASE_BLOCKED: "DATABASE_BLOCKED",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  INVALID_STORAGE_LISTENER: "INVALID_STORAGE_LISTENER",
});

const QUOTA_EXCEEDED_LEGACY_CODE = 22;

export class PixKeyStorageError extends Error {
  constructor(
    message,
    { code = "PIX_KEY_STORAGE_ERROR", field = null, cause = null } = {},
  ) {
    super(message);
    this.name = "PixKeyStorageError";
    this.code = code;
    this.field = field;
    this.cause = cause;
  }
}

export function assertIndexedDbFactory(indexedDb) {
  const isValidFactory =
    Boolean(indexedDb) &&
    typeof indexedDb === "object" &&
    typeof indexedDb.open === "function";

  if (!isValidFactory) {
    throw new PixKeyStorageError(
      "O armazenamento local IndexedDB não está disponível neste navegador.",
      {
        code: PIX_KEY_STORAGE_ERROR_CODES.INDEXED_DB_UNSUPPORTED,
        field: "indexedDb",
      },
    );
  }

  return indexedDb;
}

function isQuotaExceededError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (
    error.name === "QuotaExceededError" ||
    error.code === QUOTA_EXCEEDED_LEGACY_CODE
  );
}

export function mapStorageDomException(
  error,
  {
    fallbackCode = PIX_KEY_STORAGE_ERROR_CODES.TRANSACTION_FAILED,
    fallbackMessage = "Falha na operação de armazenamento no IndexedDB.",
    field = null,
  } = {},
) {
  if (error instanceof PixKeyStorageError) {
    return error;
  }

  if (isQuotaExceededError(error)) {
    return new PixKeyStorageError(
      error?.message ||
        "O limite de armazenamento local do navegador foi atingido.",
      {
        code: PIX_KEY_STORAGE_ERROR_CODES.QUOTA_EXCEEDED,
        field,
        cause: error,
      },
    );
  }

  return new PixKeyStorageError(error?.message || fallbackMessage, {
    code: fallbackCode,
    field,
    cause: error || null,
  });
}

function ensureStoreIndex(store, indexName, keyPath) {
  const hasIndex =
    Boolean(store?.indexNames) &&
    typeof store.indexNames.contains === "function" &&
    store.indexNames.contains(indexName);

  if (!hasIndex && typeof store?.createIndex === "function") {
    store.createIndex(indexName, keyPath, { unique: false });
  }
}

export function upgradePixKeyDatabaseSchema(db, upgradeTransaction = null) {
  const hasPixKeysStore = db.objectStoreNames.contains(OBJECT_STORES.PIX_KEYS);
  const pixKeysStore = hasPixKeysStore
    ? upgradeTransaction?.objectStore?.(OBJECT_STORES.PIX_KEYS) || null
    : db.createObjectStore(OBJECT_STORES.PIX_KEYS, { keyPath: "id" });

  if (pixKeysStore) {
    ensureStoreIndex(pixKeysStore, PIX_KEY_INDEXES.BY_TIPO_CHAVE, "tipo_chave");
    ensureStoreIndex(pixKeysStore, PIX_KEY_INDEXES.BY_CRIADO_EM, "criado_em");
  }

  if (!db.objectStoreNames.contains(OBJECT_STORES.USER_SETTINGS)) {
    db.createObjectStore(OBJECT_STORES.USER_SETTINGS, { keyPath: "key" });
  }
}

export function openPixKeyDatabase({
  indexedDb = globalThis.indexedDB,
  dbName = DEFAULT_DB_NAME,
  version = DEFAULT_DB_VERSION,
  onVersionChange = null,
} = {}) {
  return new Promise((resolve, reject) => {
    let factory;
    try {
      factory = assertIndexedDbFactory(indexedDb);
    } catch (error) {
      reject(error);
      return;
    }

    let request;
    try {
      request = factory.open(dbName, version);
    } catch (error) {
      reject(
        mapStorageDomException(error, {
          fallbackCode: PIX_KEY_STORAGE_ERROR_CODES.DATABASE_OPEN_FAILED,
          fallbackMessage: `Não foi possível abrir o banco local "${dbName}".`,
          field: dbName,
        }),
      );
      return;
    }

    request.onupgradeneeded = () => {
      try {
        upgradePixKeyDatabaseSchema(request.result, request.transaction);
      } catch (error) {
        reject(
          mapStorageDomException(error, {
            fallbackCode: PIX_KEY_STORAGE_ERROR_CODES.DATABASE_OPEN_FAILED,
            fallbackMessage: `Falha ao migrar o esquema do banco "${dbName}".`,
            field: dbName,
          }),
        );
      }
    };

    request.onsuccess = () => {
      const database = request.result;

      if (database && typeof database === "object") {
        database.onversionchange = () => {
          if (typeof database.close === "function") {
            database.close();
          }
          if (typeof onVersionChange === "function") {
            onVersionChange(database);
          }
        };
      }

      resolve(database);
    };

    request.onerror = () => {
      reject(
        mapStorageDomException(request.error, {
          fallbackCode: PIX_KEY_STORAGE_ERROR_CODES.DATABASE_OPEN_FAILED,
          fallbackMessage: `Falha ao abrir o banco local "${dbName}".`,
          field: dbName,
        }),
      );
    };

    request.onblocked = () => {
      reject(
        new PixKeyStorageError(
          `A abertura do banco local "${dbName}" foi bloqueada por outra conexão ativa.`,
          {
            code: PIX_KEY_STORAGE_ERROR_CODES.DATABASE_BLOCKED,
            field: dbName,
          },
        ),
      );
    };
  });
}
