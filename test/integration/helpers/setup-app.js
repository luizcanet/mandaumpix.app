import { vi } from "vitest";
import "../../../src/main.js";
import { bootstrapApp } from "../../../src/presentation/bootstrap/bootstrap-app.js";
import { IndexedDbPixKeyRepository } from "../../../src/infrastructure/storage/indexed-db-pix-key.repository.js";
import { ChaveConta } from "../../../src/domain/entities/pix-key.entity.js";

/**
 * Cria uma implementação em memória da factory IndexedDB para isolamento hermético nos testes.
 *
 * @param {Object} [options={}]
 * @param {string|null} [options.failMode=null]
 * @returns {IDBFactory}
 */
export function createInMemoryIndexedDb({ failMode = null } = {}) {
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

/**
 * Dados de amostra para testes de integração.
 */
export const SAMPLE_PIX_KEYS = Object.freeze({
  CPF: Object.freeze({
    id: "key-cpf-123",
    tipo_chave: "CPF",
    valor_chave: "123.456.789-09",
    rotulo: "Banco do Brasil",
    nome_recebedor: "Luiz Henrique Canet",
    cidade_recebedor: "Curitiba",
  }),
  EMAIL: Object.freeze({
    id: "key-email-456",
    tipo_chave: "EMAIL",
    valor_chave: "pix@luizca.net",
    rotulo: "Nubank Pessoal",
    nome_recebedor: "Luiz H Canet",
    cidade_recebedor: "Curitiba",
  }),
  EVP: Object.freeze({
    id: "key-evp-789",
    tipo_chave: "EVP",
    valor_chave: "123e4567-e89b-12d3-a456-426614174000",
    rotulo: "Inter PJ",
    nome_recebedor: "Luiz Canet",
    cidade_recebedor: "Curitiba",
  }),
});

/**
 * Aguarda a resolução da fila de microtasks e timers imediatos.
 *
 * @param {number} [ms=0]
 * @returns {Promise<void>}
 */
export async function flushMicrotasks(ms = 0) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Monta e inicializa a aplicação completa Manda um PIX em ambiente JSDOM para testes de integração.
 *
 * @param {Object} [options={}]
 * @param {string} [options.initialPath="/"] - Caminho de rota inicial
 * @param {Array<Object>} [options.initialKeys=[]] - Chaves pré-carregadas no repositório
 * @param {string|null} [options.selectedKeyId=null] - ID da chave ativa inicial
 * @param {boolean} [options.isStandalone=false] - Simula aplicativo rodando em modo PWA standalone
 * @param {boolean} [options.autoRegisterServiceWorker=false]
 * @param {Object} [options.overrides={}] - Serviços injetados alternativos
 * @returns {Promise<Object>} Contexto montado para interações de teste
 */
export async function mountTestApp({
  initialPath = "/",
  initialKeys = [],
  selectedKeyId = null,
  isStandalone = false,
  autoRegisterServiceWorker = false,
  overrides = {},
} = {}) {
  window.history.replaceState(null, "", initialPath);

  // Mocks do Navegador
  let clipboardText = "";
  const clipboardMock = {
    writeText: vi.fn(async (text) => {
      clipboardText = String(text);
    }),
    readText: vi.fn(async () => clipboardText),
    get text() {
      return clipboardText;
    },
  };

  const originalClipboard = navigator.clipboard;
  Object.defineProperty(navigator, "clipboard", {
    value: clipboardMock,
    configurable: true,
    writable: true,
  });

  const shareMock = vi.fn(async () => {});
  const originalShare = navigator.share;
  Object.defineProperty(navigator, "share", {
    value: shareMock,
    configurable: true,
    writable: true,
  });

  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const createObjectURLMock = vi.fn(
    () => "blob:http://localhost/mock-uuid.png",
  );
  const revokeObjectURLMock = vi.fn();
  URL.createObjectURL = createObjectURLMock;
  URL.revokeObjectURL = revokeObjectURLMock;

  const originalMatchMedia = window.matchMedia;
  const matchMediaMock = vi.fn((query) => ({
    matches: isStandalone && String(query).includes("display-mode: standalone"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  window.matchMedia = matchMediaMock;

  const originalOpen = window.open;
  const windowOpenMock = vi.fn();
  window.open = windowOpenMock;

  // Repositório IndexedDB em memória
  const memoryIdb = createInMemoryIndexedDb();
  const originalIndexedDB = globalThis.indexedDB;
  globalThis.indexedDB = memoryIdb;
  if (typeof window !== "undefined") {
    window.indexedDB = memoryIdb;
  }

  const repository = new IndexedDbPixKeyRepository({
    indexedDb: memoryIdb,
    dbName: `test-db-${Date.now()}-${Math.random()}`,
  });

  if (Array.isArray(initialKeys) && initialKeys.length > 0) {
    for (const key of initialKeys) {
      const entity = key instanceof ChaveConta ? key : new ChaveConta(key);
      await repository.save(entity);
    }
    if (selectedKeyId) {
      await repository.setSelectedKeyId(selectedKeyId);
    } else {
      await repository.setSelectedKeyId(initialKeys[0].id);
    }
  }

  // Estrutura Semântica da Casca idêntica a index.html
  document.body.replaceChildren();

  const rootElement = document.createElement("main");
  rootElement.id = "app";
  rootElement.className = "app-root";

  rootElement.innerHTML = `
    <app-header class="app-header">
      <div class="app-header__brand">
        <img
          class="app-header__logo"
          src="./src/assets/icons/icon.svg"
          alt="Logotipo do Manda um PIX"
          width="42"
          height="42"
        />
        <div>
          <span class="app-header__title">Manda um PIX</span>
          <span class="app-header__subtitle">Cobrança rápida via PIX</span>
        </div>
      </div>
      <div class="app-header__actions">
        <button
          type="button"
          class="app-header__install-btn hidden"
          aria-label="Instalar aplicativo"
        >
          <vector-icon name="download"></vector-icon>
          <span>Instalar</span>
        </button>
        <a
          href="/sobre"
          class="app-header__about-link"
          aria-label="Sobre o aplicativo"
        >
          <vector-icon name="circle-info"></vector-icon>
          <span>Sobre</span>
        </a>
      </div>
    </app-header>

    <div
      id="router-outlet"
      class="app-main"
      role="region"
      aria-label="Conteúdo Principal"
    >
      <div class="charge-page charge-page--split">
        <!-- Coluna Esquerda: Formulário e Chaves -->
        <!-- Coluna Direita: Cartão do QR Code e Compartilhamento -->
      </div>
    </div>

    <footer class="app-footer">
      <div class="app-footer__status">
        <span class="app-footer__dot" aria-hidden="true"></span>
        <span>100% Local &amp; Offline-Ready</span>
      </div>
      <div class="app-footer__info">
        <a href="/sobre" class="app-footer__link">Sobre</a>
        <span aria-hidden="true">·</span>
        <span class="app-footer__license">AGPL-3.0-only</span>
      </div>
    </footer>

    <pix-key-dialog></pix-key-dialog>
  `;

  document.body.appendChild(rootElement);

  // Inicializa o aplicativo
  bootstrapApp(rootElement, {
    autoRegisterServiceWorker,
    pixKeyRepository: repository,
    ...overrides,
  });

  await flushMicrotasks(20);

  const outletElement = rootElement.querySelector("#router-outlet");
  const headerElement = rootElement.querySelector("app-header");
  const dialogElement = rootElement.querySelector("pix-key-dialog");
  const emptyElement = () => rootElement.querySelector("pix-key-empty");
  const selectorElement = () => rootElement.querySelector("pix-key-selector");
  const formElement = () => rootElement.querySelector("pix-charge-form");
  const resultElement = () => rootElement.querySelector("pix-charge-result");
  const chargeDialogElement = () =>
    rootElement.querySelector("pix-charge-dialog");

  const cleanup = () => {
    document.body.replaceChildren();
    window.history.replaceState(null, "", "/");

    if (originalClipboard) {
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        configurable: true,
      });
    }
    if (originalShare) {
      Object.defineProperty(navigator, "share", {
        value: originalShare,
        configurable: true,
      });
    }
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    window.matchMedia = originalMatchMedia;
    window.open = originalOpen;
    globalThis.indexedDB = originalIndexedDB;
    if (typeof window !== "undefined") {
      window.indexedDB = originalIndexedDB;
    }
  };

  return {
    rootElement,
    outletElement,
    headerElement,
    dialogElement,
    get emptyElement() {
      return emptyElement();
    },
    get selectorElement() {
      return selectorElement();
    },
    get formElement() {
      return formElement();
    },
    get resultElement() {
      return resultElement();
    },
    get chargeDialogElement() {
      return chargeDialogElement();
    },
    repository,
    mocks: {
      clipboard: clipboardMock,
      share: shareMock,
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
      matchMedia: matchMediaMock,
      windowOpen: windowOpenMock,
    },
    flushMicrotasks,
    cleanup,
  };
}
