import { describe, expect, it, vi } from "vitest";
import {
  APP_METADATA,
  APP_ROUTES,
  AccessController,
  AppHeaderComponent,
  BROWSER_SHARE_ADAPTER_ERROR_CODES,
  BrowserShareAdapter,
  BrowserShareAdapterError,
  CACHE_VERSION,
  ChaveConta,
  CobrancaPix,
  CustomElement,
  DEFAULT_DB_NAME,
  DEFAULT_DB_VERSION,
  DEFAULT_PIX_CHARGE_TXID,
  DEFAULT_PIX_KEY_LABELS,
  DEFAULT_QR_IMAGE_FILENAME,
  DEFAULT_QR_IMAGE_SIZE,
  DEFAULT_SHARE_TITLE,
  DEFAULT_SW_SCOPE,
  DEFAULT_SW_SCRIPT_URL,
  DEFAULT_SW_TYPE,
  DataController,
  DeletePixKeyUseCase,
  DistributePixChargeUseCase,
  GeneratePixChargeUseCase,
  IndexedDbPixKeyRepository,
  InstallPwaUseCase,
  ListPixKeysUseCase,
  MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH,
  MAX_PIX_CHARGE_AMOUNT,
  MAX_PIX_CHARGE_TXID_LENGTH,
  OBJECT_STORES,
  PIX_CHARGE_DISTRIBUTION_ACTIONS,
  PIX_CHARGE_DISTRIBUTION_CHANNELS,
  PIX_CHARGE_DISTRIBUTION_ERROR_CODES,
  PIX_CHARGE_ERROR_CODES,
  PIX_KEY_ERROR_CODES,
  PIX_KEY_INDEXES,
  PIX_KEY_MANAGEMENT_ERROR_CODES,
  PIX_KEY_STORAGE_ERROR_CODES,
  PIX_KEY_TYPES,
  PWA_INSTALL_ACTIONS,
  PWA_INSTALL_ADAPTER_ERROR_CODES,
  PWA_INSTALL_ERROR_CODES,
  PWA_INSTALL_OUTCOMES,
  PRECACHE_NAME,
  PixChargeDistributionError,
  PixChargeEntity,
  PixChargeValidationError,
  PixKeyEntity,
  PixKeyManagementError,
  PixKeyStorageError,
  PixKeyValidationError,
  PwaInstallAdapter,
  PwaInstallAdapterError,
  PwaInstallError,
  RUNTIME_CACHE_NAME,
  Router,
  SELECTED_KEY_SETTING_KEY,
  STANDALONE_MEDIA_QUERY,
  SERVICE_WORKER_ADAPTER_ERROR_CODES,
  SERVICE_WORKER_STATUS,
  SavePixKeyUseCase,
  SelectPixKeyUseCase,
  ServiceWorkerAdapter,
  ServiceWorkerAdapterError,
  VectorIconComponent,
  assertChargeDistributionGateway,
  assertIndexedDbFactory,
  assertPixKeyRepository,
  assertPwaInstallGateway,
  bootstrapApp,
  buildWhatsAppShareUrl,
  createBrowserShareAdapter,
  createIndexedDbPixKeyRepository,
  createPwaInstallAdapter,
  createServiceWorkerAdapter,
  detectStandaloneMode,
  executeDeletePixKey,
  executeDistributePixCharge,
  executeGeneratePixCharge,
  executeInstallPwa,
  executeListPixKeys,
  executeSavePixKey,
  executeSelectPixKey,
  extractChargeDistributionTarget,
  generatePixCharge,
  hydrateChaveContaList,
  isOnline,
  isServiceWorkerSupported,
  mapStorageDomException,
  normalizeAdditionalInfo,
  normalizeMerchantCity,
  normalizeMerchantName,
  normalizePwaInstallOutcome,
  normalizePwaInstallState,
  normalizeQrDimensions,
  normalizeQrDownloadFileName,
  normalizeTransactionAmount,
  normalizeTxid,
  openPixKeyDatabase,
  parsePixCharge,
  resolveChaveConta,
  resolveRequiredPixKeyId,
  upgradePixKeyDatabaseSchema,
  validateAndNormalizePixKey,
} from "./main.js";

describe("main.js", () => {
  describe("APP_METADATA", () => {
    it("should expose frozen application metadata", () => {
      expect(Object.isFrozen(APP_METADATA)).toBe(true);
      expect(APP_METADATA).toEqual({
        name: "Manda um PIX",
        packageName: "mandaumpix.app",
        version: "1.0.0",
        license: "AGPL-3.0-only",
      });
    });
  });

  describe("generatePixCharge & parsePixCharge", () => {
    it("should generate a valid static PIX charge with a fixed transaction amount", () => {
      // Arrange
      const chargeInput = {
        pixKey: "contato@mandaumpix.app",
        merchantName: "Manda um PIX",
        merchantCity: "Brasilia",
        transactionAmount: 42.5,
        txid: "PEDIDO123",
      };

      // Act
      const result = generatePixCharge(chargeInput);
      const parsedResult = parsePixCharge(result.brCode);

      // Assert
      expect(result.brCode).toMatch(/^000201/);
      expect(result.qrSvg).toContain("<svg");
      expect(result.qrDataUrl).toMatch(/^data:image\/gif;base64,/);
      expect(result.qrGifBytes).toBeInstanceOf(Uint8Array);
      expect(parsedResult.isStatic).toBe(true);
      expect(parsedResult.parsed.pixKey).toBe("contato@mandaumpix.app");
      expect(parsedResult.parsed.transactionAmount).toBe(42.5);
    });

    it("should generate a valid static PIX charge with dynamic/open amount when omitted", () => {
      // Arrange
      const chargeInput = {
        pixKey: "contato@mandaumpix.app",
      };

      // Act
      const result = generatePixCharge(chargeInput);
      const parsedResult = parsePixCharge(result.brCode);

      // Assert
      expect(result.brCode).toMatch(/^000201/);
      expect(parsedResult.isStatic).toBe(true);
      expect(parsedResult.parsed.pixKey).toBe("contato@mandaumpix.app");
      expect(parsedResult.parsed.transactionAmount).toBe(0);
    });

    it("should throw an error when parsing an invalid BR Code", () => {
      expect(() => parsePixCharge("INVALID_BR_CODE")).toThrow();
    });
  });

  describe("bootstrapApp", () => {
    it("should mark the root element as initialized when present", () => {
      // Arrange
      const rootElement = document.createElement("div");

      // Act
      const initialized = bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
      });

      // Assert
      expect(initialized).toBe(rootElement);
      expect(rootElement.dataset.initialized).toBe("true");
    });

    it("should return null when root element is not found", () => {
      expect(bootstrapApp(null)).toBeNull();
    });

    it("should auto-register service worker on load event or immediately if document is complete", async () => {
      const rootElement = document.createElement("div");
      const mockRegister = vi.fn().mockResolvedValue({ isRegistered: true });
      const mockAdapter = {
        register: mockRegister,
      };

      const windowTarget = new EventTarget();
      windowTarget.document = { readyState: "complete" };

      const initialized = bootstrapApp(rootElement, {
        windowTarget,
        serviceWorkerAdapter: mockAdapter,
        autoRegisterServiceWorker: true,
      });

      expect(initialized).toBe(rootElement);
      expect(mockRegister).toHaveBeenCalled();
      expect(rootElement.__serviceWorkerAdapter).toBe(mockAdapter);
    });

    it("should register service worker when load event fires if readyState is loading", async () => {
      const rootElement = document.createElement("div");
      const mockRegister = vi.fn().mockResolvedValue({ isRegistered: true });
      const mockAdapter = {
        register: mockRegister,
      };

      const windowTarget = new EventTarget();
      windowTarget.document = { readyState: "loading" };

      bootstrapApp(rootElement, {
        windowTarget,
        serviceWorkerAdapter: mockAdapter,
        autoRegisterServiceWorker: true,
      });

      expect(mockRegister).not.toHaveBeenCalled();

      windowTarget.dispatchEvent(new Event("load"));
      expect(mockRegister).toHaveBeenCalled();
    });

    it("should tolerate service worker registration failure without throwing", async () => {
      const rootElement = document.createElement("div");
      const mockRegister = vi.fn().mockRejectedValue(new Error("SW failed"));
      const mockAdapter = {
        register: mockRegister,
      };

      const windowTarget = new EventTarget();
      windowTarget.document = { readyState: "complete" };

      expect(() =>
        bootstrapApp(rootElement, {
          windowTarget,
          serviceWorkerAdapter: mockAdapter,
          autoRegisterServiceWorker: true,
        }),
      ).not.toThrow();
    });
  });

  describe("@modnes exports", () => {
    it("should re-export core modnes classes", () => {
      expect(AccessController).toBeDefined();
      expect(CustomElement).toBeDefined();
      expect(DataController).toBeDefined();
      expect(Router).toBeDefined();
    });
  });

  describe("domain exports (US-02.2)", () => {
    it("should re-export ChaveConta entity, constants, error class, and validators", () => {
      expect(ChaveConta).toBeDefined();
      expect(PixKeyEntity).toBe(ChaveConta);
      expect(PIX_KEY_TYPES).toBeDefined();
      expect(DEFAULT_PIX_KEY_LABELS).toBeDefined();
      expect(PIX_KEY_ERROR_CODES).toBeDefined();
      expect(PixKeyValidationError).toBeDefined();
      expect(validateAndNormalizePixKey).toBeTypeOf("function");
      expect(normalizeMerchantName).toBeTypeOf("function");
      expect(normalizeMerchantCity).toBeTypeOf("function");
    });
  });

  describe("domain & application exports (US-02.3)", () => {
    it("should re-export CobrancaPix entity, GeneratePixChargeUseCase, constants, errors, and sanitizers", () => {
      expect(CobrancaPix).toBeDefined();
      expect(PixChargeEntity).toBe(CobrancaPix);
      expect(PixChargeValidationError).toBeDefined();
      expect(PIX_CHARGE_ERROR_CODES).toBeDefined();
      expect(DEFAULT_PIX_CHARGE_TXID).toBe("***");
      expect(MAX_PIX_CHARGE_AMOUNT).toBe(999999999.99);
      expect(MAX_PIX_CHARGE_TXID_LENGTH).toBe(25);
      expect(MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH).toBe(72);
      expect(normalizeTransactionAmount).toBeTypeOf("function");
      expect(normalizeTxid).toBeTypeOf("function");
      expect(normalizeAdditionalInfo).toBeTypeOf("function");
      expect(resolveChaveConta).toBeTypeOf("function");
      expect(GeneratePixChargeUseCase).toBeDefined();
      expect(executeGeneratePixCharge).toBeTypeOf("function");
    });

    it("should generate a complete CobrancaPix from a ChaveConta via main.js exports", () => {
      // Arrange
      const pixKey = ChaveConta.create({
        tipo_chave: PIX_KEY_TYPES.EMAIL,
        valor_chave: "eu@luizca.net",
        nome_recebedor: "Luiz Henrique Canet Filho",
        cidade_recebedor: "Brasília",
      });

      // Act
      const charge = executeGeneratePixCharge({
        chaveConta: pixKey,
        valor_opcional: 25.5,
      });

      // Assert
      expect(charge).toBeInstanceOf(CobrancaPix);
      expect(charge.id_chave_conta).toBe(pixKey.id);
      expect(charge.valor_opcional).toBe(25.5);
      expect(charge.valor_dinamico).toBe(false);
      expect(charge.chave_cobranca).toContain("540525.50");
      expect(charge.imagem_qrcode.svg).toContain("<svg");
    });
  });

  describe("application exports & lifecycle integration (US-02.4)", () => {
    it("should re-export PIX key management use cases, error class, error codes, and helpers", () => {
      expect(SavePixKeyUseCase).toBeDefined();
      expect(ListPixKeysUseCase).toBeDefined();
      expect(SelectPixKeyUseCase).toBeDefined();
      expect(DeletePixKeyUseCase).toBeDefined();
      expect(executeSavePixKey).toBeTypeOf("function");
      expect(executeListPixKeys).toBeTypeOf("function");
      expect(executeSelectPixKey).toBeTypeOf("function");
      expect(executeDeletePixKey).toBeTypeOf("function");
      expect(PixKeyManagementError).toBeDefined();
      expect(PIX_KEY_MANAGEMENT_ERROR_CODES).toBeDefined();
      expect(assertPixKeyRepository).toBeTypeOf("function");
      expect(hydrateChaveContaList).toBeTypeOf("function");
      expect(resolveRequiredPixKeyId).toBeTypeOf("function");
    });

    it("should orchestrate full PIX key management lifecycle and charge generation via main.js exports", async () => {
      // Arrange
      const store = new Map();
      let selectedKeyId = null;
      const pixKeyRepository = {
        findAll: async () => Array.from(store.values()),
        save: async (key) => {
          store.set(key.id, key);
          return key;
        },
        deleteById: async (id) => {
          store.delete(id);
        },
        getSelectedKeyId: async () => selectedKeyId,
        setSelectedKeyId: async (id) => {
          selectedKeyId = id;
        },
      };

      // Act 1: Save first key (auto-selected) and second key
      const savedFirst = await executeSavePixKey(
        {
          id: "key-01",
          rotulo: "Conta Principal",
          tipo_chave: PIX_KEY_TYPES.EMAIL,
          valor_chave: "eu@luizca.net",
          nome_recebedor: "Luiz Henrique Canet Filho",
          cidade_recebedor: "Brasília",
        },
        { pixKeyRepository },
      );
      const savedSecond = await executeSavePixKey(
        {
          id: "key-02",
          rotulo: "Conta Celular",
          tipo_chave: PIX_KEY_TYPES.TELEFONE,
          valor_chave: "(61) 99999-8888",
          nome_recebedor: "Luiz Henrique Canet Filho",
          cidade_recebedor: "Brasília",
        },
        { pixKeyRepository },
      );

      // Assert 1
      expect(savedFirst.isSelected).toBe(true);
      expect(savedSecond.isSelected).toBe(false);

      // Act 2: Select second key and generate charge from repository active key
      await executeSelectPixKey("key-02", { pixKeyRepository });
      const listedAfterSelect = await executeListPixKeys({ pixKeyRepository });
      const charge = await executeGeneratePixCharge(
        { valor_opcional: 100 },
        { pixKeyRepository },
      );

      // Assert 2
      expect(listedAfterSelect.items).toHaveLength(2);
      expect(listedAfterSelect.selectedKeyId).toBe("key-02");
      expect(charge.id_chave_conta).toBe("key-02");
      expect(charge.chave_cobranca).toContain("+5561999998888");

      // Act 3: Delete active key (key-02) -> auto-reassigns to key-01
      const afterDeleteActive = await executeDeletePixKey("key-02", {
        pixKeyRepository,
      });

      // Assert 3
      expect(afterDeleteActive.selectedKeyId).toBe("key-01");
      expect(afterDeleteActive.items).toHaveLength(1);
    });
  });

  describe("application exports & distribution/install integration (US-02.5)", () => {
    it("should re-export DistributePixChargeUseCase, InstallPwaUseCase, constants, error classes, and helpers", () => {
      expect(DistributePixChargeUseCase).toBeDefined();
      expect(InstallPwaUseCase).toBeDefined();
      expect(executeDistributePixCharge).toBeTypeOf("function");
      expect(executeInstallPwa).toBeTypeOf("function");
      expect(PixChargeDistributionError).toBeDefined();
      expect(PwaInstallError).toBeDefined();
      expect(PIX_CHARGE_DISTRIBUTION_ACTIONS).toBeDefined();
      expect(PIX_CHARGE_DISTRIBUTION_CHANNELS).toBeDefined();
      expect(PIX_CHARGE_DISTRIBUTION_ERROR_CODES).toBeDefined();
      expect(PWA_INSTALL_ACTIONS).toBeDefined();
      expect(PWA_INSTALL_OUTCOMES).toBeDefined();
      expect(PWA_INSTALL_ERROR_CODES).toBeDefined();
      expect(DEFAULT_QR_IMAGE_FILENAME).toBe("mandaumpix-qrcode.png");
      expect(DEFAULT_QR_IMAGE_SIZE).toBe(512);
      expect(DEFAULT_SHARE_TITLE).toBe("Manda um PIX");
      expect(assertChargeDistributionGateway).toBeTypeOf("function");
      expect(assertPwaInstallGateway).toBeTypeOf("function");
      expect(buildWhatsAppShareUrl).toBeTypeOf("function");
      expect(extractChargeDistributionTarget).toBeTypeOf("function");
      expect(normalizeQrDownloadFileName).toBeTypeOf("function");
      expect(normalizeQrDimensions).toBeTypeOf("function");
      expect(normalizePwaInstallState).toBeTypeOf("function");
      expect(normalizePwaInstallOutcome).toBeTypeOf("function");
    });

    it("should orchestrate charge distribution (copy, share, download) and PWA installation via main.js exports", async () => {
      // Arrange
      const pixKey = ChaveConta.create({
        tipo_chave: PIX_KEY_TYPES.EMAIL,
        valor_chave: "eu@luizca.net",
        nome_recebedor: "Luiz Henrique Canet Filho",
        cidade_recebedor: "Brasília",
      });
      const charge = executeGeneratePixCharge({
        chaveConta: pixKey,
        valor_opcional: 15,
      });

      const chargeDistributionGateway = {
        copyText: vi.fn().mockResolvedValue(undefined),
        canShare: vi.fn().mockReturnValue(false),
        shareViaWhatsApp: vi.fn().mockResolvedValue(undefined),
        downloadQrCodePng: vi.fn().mockResolvedValue(undefined),
      };

      let installed = false;
      const pwaInstallGateway = {
        isInstalled: () => installed,
        canInstall: () => !installed,
        promptInstall: async () => {
          installed = true;
          return { outcome: "accepted" };
        },
      };

      // Act
      const copyResult = await executeDistributePixCharge(
        { action: PIX_CHARGE_DISTRIBUTION_ACTIONS.COPY, cobranca: charge },
        { chargeDistributionGateway },
      );
      const shareResult = await executeDistributePixCharge(
        { action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE, cobranca: charge },
        { chargeDistributionGateway },
      );
      const downloadResult = await executeDistributePixCharge(
        {
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.DOWNLOAD_QR,
          cobranca: charge,
        },
        { chargeDistributionGateway },
      );

      const initialInstallState = await executeInstallPwa(
        { action: PWA_INSTALL_ACTIONS.GET_STATE },
        { pwaInstallGateway },
      );
      const triggerInstallResult = await executeInstallPwa(
        { action: PWA_INSTALL_ACTIONS.TRIGGER_INSTALL },
        { pwaInstallGateway },
      );

      // Assert
      expect(copyResult.copied).toBe(true);
      expect(shareResult.channel).toBe(
        PIX_CHARGE_DISTRIBUTION_CHANNELS.WHATSAPP,
      );
      expect(downloadResult.downloaded).toBe(true);
      expect(initialInstallState.shouldShowInstallButton).toBe(true);
      expect(triggerInstallResult.accepted).toBe(true);
      expect(triggerInstallResult.shouldShowInstallButton).toBe(false);
    });
  });

  describe("infrastructure exports & IndexedDB repository integration (US-03.1)", () => {
    it("should re-export IndexedDbPixKeyRepository, constants, error class, and helpers", () => {
      expect(IndexedDbPixKeyRepository).toBeDefined();
      expect(createIndexedDbPixKeyRepository).toBeTypeOf("function");
      expect(DEFAULT_DB_NAME).toBe("mandaumpix_db");
      expect(DEFAULT_DB_VERSION).toBe(1);
      expect(SELECTED_KEY_SETTING_KEY).toBe("selectedKeyId");
      expect(OBJECT_STORES).toEqual({
        PIX_KEYS: "pix_keys",
        USER_SETTINGS: "user_settings",
      });
      expect(PIX_KEY_INDEXES).toEqual({
        BY_TIPO_CHAVE: "by_tipo_chave",
        BY_CRIADO_EM: "by_criado_em",
      });
      expect(PIX_KEY_STORAGE_ERROR_CODES).toBeDefined();
      expect(PixKeyStorageError).toBeDefined();
      expect(assertIndexedDbFactory).toBeTypeOf("function");
      expect(mapStorageDomException).toBeTypeOf("function");
      expect(upgradePixKeyDatabaseSchema).toBeTypeOf("function");
      expect(openPixKeyDatabase).toBeTypeOf("function");
    });

    it("should persist and manage PIX keys with IndexedDbPixKeyRepository via main.js exports", async () => {
      // Arrange: lightweight in-memory IDBFactory
      const stores = new Map([
        ["pix_keys", { keyPath: "id", data: new Map() }],
        ["user_settings", { keyPath: "key", data: new Map() }],
      ]);

      const fakeIndexedDb = {
        open: () => {
          const req = {};
          queueMicrotask(() => {
            req.result = {
              objectStoreNames: { contains: (name) => stores.has(name) },
              createObjectStore: vi.fn(),
              transaction: () => {
                const tx = {};
                tx.objectStore = (name) => {
                  const store = stores.get(name);
                  const wrap = (fn) => {
                    const r = {};
                    queueMicrotask(() => {
                      r.result = fn();
                      r.onsuccess?.();
                      queueMicrotask(() => tx.oncomplete?.());
                    });
                    return r;
                  };
                  return {
                    getAll: () => wrap(() => Array.from(store.data.values())),
                    get: (k) => wrap(() => store.data.get(k)),
                    put: (v) =>
                      wrap(() => {
                        store.data.set(v[store.keyPath], v);
                        return v[store.keyPath];
                      }),
                    delete: (k) => wrap(() => store.data.delete(k)),
                  };
                };
                return tx;
              },
            };
            req.onsuccess?.();
          });
          return req;
        },
      };

      const pixKeyRepository = createIndexedDbPixKeyRepository({
        indexedDb: fakeIndexedDb,
      });

      // Act
      const saved = await executeSavePixKey(
        {
          id: "idb-key-1",
          rotulo: "Conta IndexedDB",
          tipo_chave: PIX_KEY_TYPES.EMAIL,
          valor_chave: "idb@mandaumpix.app",
          nome_recebedor: "Luiz Canet",
          cidade_recebedor: "Brasilia",
        },
        { pixKeyRepository },
      );

      const listed = await executeListPixKeys({ pixKeyRepository });
      const charge = await executeGeneratePixCharge(
        { valor_opcional: 19.9 },
        { pixKeyRepository },
      );

      // Assert
      expect(saved.isSelected).toBe(true);
      expect(listed.items).toHaveLength(1);
      expect(listed.selectedKeyId).toBe("idb-key-1");
      expect(charge.id_chave_conta).toBe("idb-key-1");
      expect(charge.chave_cobranca).toContain("idb@mandaumpix.app");
    });
  });

  describe("infrastructure exports & PWA installation adapter integration (US-03.2)", () => {
    it("should re-export PwaInstallAdapter, factory, constants, error class, and standalone detector", () => {
      expect(PwaInstallAdapter).toBeDefined();
      expect(createPwaInstallAdapter).toBeTypeOf("function");
      expect(STANDALONE_MEDIA_QUERY).toBe("(display-mode: standalone)");
      expect(PWA_INSTALL_ADAPTER_ERROR_CODES).toBeDefined();
      expect(PwaInstallAdapterError).toBeDefined();
      expect(detectStandaloneMode).toBeTypeOf("function");
    });

    it("should integrate createPwaInstallAdapter with InstallPwaUseCase via main.js exports", async () => {
      // Arrange
      const listeners = new Map();
      const windowTarget = {
        addEventListener: vi.fn((event, cb) => {
          const set = listeners.get(event) || new Set();
          set.add(cb);
          listeners.set(event, set);
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: (event) => {
          const set = listeners.get(event.type) || [];
          for (const cb of set) cb(event);
        },
        matchMedia: vi.fn().mockReturnValue({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
      };

      const adapter = createPwaInstallAdapter({
        windowTarget,
        navigatorTarget: { standalone: false },
      });

      // Act & Assert 1: before beforeinstallprompt
      const stateBefore = await executeInstallPwa(
        { action: PWA_INSTALL_ACTIONS.GET_STATE },
        { pwaInstallGateway: adapter },
      );
      expect(stateBefore.shouldShowInstallButton).toBe(false);

      // Act & Assert 2: dispatch beforeinstallprompt
      let promptDefaultPrevented = false;
      const promptEvent = {
        type: "beforeinstallprompt",
        preventDefault: vi.fn(() => {
          promptDefaultPrevented = true;
        }),
        prompt: vi.fn().mockResolvedValue({ outcome: "accepted" }),
        userChoice: Promise.resolve({ outcome: "accepted" }),
      };
      windowTarget.dispatchEvent(promptEvent);

      expect(promptDefaultPrevented).toBe(true);

      const stateAfterPrompt = await executeInstallPwa(
        { action: PWA_INSTALL_ACTIONS.GET_STATE },
        { pwaInstallGateway: adapter },
      );
      expect(stateAfterPrompt.shouldShowInstallButton).toBe(true);
      expect(stateAfterPrompt.canInstall).toBe(true);

      // Act & Assert 3: triggerInstall
      const installResult = await executeInstallPwa(
        { action: PWA_INSTALL_ACTIONS.TRIGGER_INSTALL },
        { pwaInstallGateway: adapter },
      );

      expect(installResult.accepted).toBe(true);
      expect(installResult.isInstalled).toBe(true);
      expect(installResult.shouldShowInstallButton).toBe(false);

      adapter.destroy();
    });
  });

  describe("infrastructure exports & BrowserShareAdapter integration (US-03.3)", () => {
    const SAMPLE_BR_CODE =
      "00020126350014br.gov.bcb.pix0113eu@luizca.net5204000053039865802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***63043C63";

    it("should re-export BrowserShareAdapter, factory, constants, and error class", () => {
      expect(BrowserShareAdapter).toBeDefined();
      expect(createBrowserShareAdapter).toBeTypeOf("function");
      expect(BROWSER_SHARE_ADAPTER_ERROR_CODES).toBeDefined();
      expect(BROWSER_SHARE_ADAPTER_ERROR_CODES.CLIPBOARD_UNAVAILABLE).toBe(
        "CLIPBOARD_UNAVAILABLE",
      );
      expect(BrowserShareAdapterError).toBeDefined();
    });

    it("should integrate createBrowserShareAdapter with DistributePixChargeUseCase for COPY, SHARE and DOWNLOAD_QR", async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      const openSpy = vi.fn().mockReturnValue({ closed: false });
      const fakeBlob = new Blob(["fake-png"], { type: "image/png" });
      const exportQrCodePngSpy = vi.fn().mockResolvedValue(fakeBlob);
      const revokedUrls = [];

      const windowTarget = {
        open: openSpy,
        URL: {
          createObjectURL: vi.fn(() => "blob:http://localhost/test-uuid"),
          revokeObjectURL: vi.fn((url) => revokedUrls.push(url)),
        },
      };

      const navigatorTarget = {
        clipboard: {
          writeText: writeTextSpy,
        },
        share: vi.fn().mockResolvedValue(undefined),
        canShare: vi.fn().mockReturnValue(false), // triggers WhatsApp fallback
      };

      const documentTarget = {
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
        createElement: vi.fn(() => ({
          tagName: "A",
          style: {},
          click: vi.fn(),
        })),
      };

      const adapter = createBrowserShareAdapter({
        windowTarget,
        navigatorTarget,
        documentTarget,
        exportQrCodePngFn: exportQrCodePngSpy,
      });

      // 1. COPY action
      const copyResult = await executeDistributePixCharge(
        {
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.COPY,
          chave_cobranca: SAMPLE_BR_CODE,
        },
        { chargeDistributionGateway: adapter },
      );
      expect(copyResult.copied).toBe(true);
      expect(writeTextSpy).toHaveBeenCalledWith(SAMPLE_BR_CODE);

      // 2. SHARE action (WhatsApp fallback)
      const shareResult = await executeDistributePixCharge(
        {
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
          chave_cobranca: SAMPLE_BR_CODE,
        },
        { chargeDistributionGateway: adapter },
      );
      expect(shareResult.shared).toBe(true);
      expect(shareResult.channel).toBe(
        PIX_CHARGE_DISTRIBUTION_CHANNELS.WHATSAPP,
      );
      expect(openSpy).toHaveBeenCalledWith(
        `https://wa.me/?text=${encodeURIComponent(SAMPLE_BR_CODE)}`,
        "_blank",
        "noopener,noreferrer",
      );

      // 3. DOWNLOAD_QR action
      const downloadResult = await executeDistributePixCharge(
        {
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.DOWNLOAD_QR,
          chave_cobranca: SAMPLE_BR_CODE,
          fileName: "meu-qr.png",
          width: 512,
          height: 512,
        },
        { chargeDistributionGateway: adapter },
      );
      expect(downloadResult.downloaded).toBe(true);
      expect(downloadResult.fileName).toBe("meu-qr.png");
      expect(exportQrCodePngSpy).toHaveBeenCalledWith(SAMPLE_BR_CODE, {
        width: 512,
        height: 512,
      });
      expect(revokedUrls).toContain("blob:http://localhost/test-uuid");
    });
  });

  describe("infrastructure exports & ServiceWorkerAdapter integration (US-03.4)", () => {
    it("should re-export ServiceWorkerAdapter, factory, constants, and error class", () => {
      expect(ServiceWorkerAdapter).toBeDefined();
      expect(createServiceWorkerAdapter).toBeTypeOf("function");
      expect(SERVICE_WORKER_STATUS).toBeDefined();
      expect(SERVICE_WORKER_STATUS.REGISTERED).toBe("REGISTERED");
      expect(SERVICE_WORKER_ADAPTER_ERROR_CODES).toBeDefined();
      expect(
        SERVICE_WORKER_ADAPTER_ERROR_CODES.SERVICE_WORKER_UNSUPPORTED,
      ).toBe("SERVICE_WORKER_UNSUPPORTED");
      expect(ServiceWorkerAdapterError).toBeDefined();
      expect(CACHE_VERSION).toBe("v1.0.1");
      expect(PRECACHE_NAME).toBe("mandaumpix-v1.0.1-precache");
      expect(RUNTIME_CACHE_NAME).toBe("mandaumpix-v1.0.1-runtime");
      expect(DEFAULT_SW_SCRIPT_URL).toBe("./sw.js");
      expect(DEFAULT_SW_SCOPE).toBe("./");
      expect(isOnline).toBeTypeOf("function");
      expect(isServiceWorkerSupported).toBeTypeOf("function");
    });

    it("should create and register ServiceWorkerAdapter with offline monitoring and state", async () => {
      const mockRegistration = new EventTarget();
      mockRegistration.scope = "./";
      mockRegistration.waiting = null;
      mockRegistration.update = vi.fn().mockResolvedValue(mockRegistration);
      mockRegistration.unregister = vi.fn().mockResolvedValue(true);

      const mockServiceWorker = new EventTarget();
      mockServiceWorker.register = vi.fn().mockResolvedValue(mockRegistration);

      const windowTarget = new EventTarget();
      const navigatorTarget = {
        serviceWorker: mockServiceWorker,
        onLine: true,
      };

      const adapter = createServiceWorkerAdapter({
        windowTarget,
        navigatorTarget,
      });

      expect(adapter.isSupported()).toBe(true);
      expect(adapter.isOnline()).toBe(true);
      expect(adapter.isRegistered()).toBe(false);

      const regResult = await adapter.register();
      expect(regResult.isRegistered).toBe(true);
      expect(adapter.isRegistered()).toBe(true);
      expect(adapter.getRegistration()).toBe(mockRegistration);

      // Offline event
      windowTarget.dispatchEvent(new Event("offline"));
      expect(adapter.isOnline()).toBe(false);

      // Online event
      windowTarget.dispatchEvent(new Event("online"));
      expect(adapter.isOnline()).toBe(true);

      adapter.destroy();
    });
  });

  describe("presentation components & bootstrapApp integration (TASK-04.2.4)", () => {
    it("should re-export AppHeaderComponent and VectorIconComponent", () => {
      expect(AppHeaderComponent).toBeDefined();
      expect(VectorIconComponent).toBeDefined();
      expect(DEFAULT_SW_TYPE).toBe("module");
    });

    it("should initialize PWA install adapter and use case on rootElement during bootstrapApp", () => {
      const rootElement = document.createElement("main");
      rootElement.id = "app";
      document.body.appendChild(rootElement);

      const header = document.createElement("app-header");
      rootElement.appendChild(header);

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
      });

      expect(rootElement.__pwaInstallAdapter).toBeDefined();
      expect(rootElement.__installPwaUseCase).toBeDefined();
      expect(header.installPwaUseCase).toBe(rootElement.__installPwaUseCase);

      rootElement.remove();
    });
  });

  describe("SPA routing with @modnes/router (TASK-04.3.1)", () => {
    it("should export canonical APP_ROUTES with /, /sobre and wildcard fallback", () => {
      expect(APP_ROUTES).toBeDefined();
      expect(Array.isArray(APP_ROUTES)).toBe(true);
      expect(Object.isFrozen(APP_ROUTES)).toBe(true);
      expect(APP_ROUTES).toHaveLength(3);

      expect(APP_ROUTES[0]).toEqual({
        path: "/",
        tagName: "div",
        classes: ["charge-page", "charge-page--split"],
      });

      expect(APP_ROUTES[1]).toEqual({
        path: "/sobre",
        tagName: "about-page",
        classes: ["about-page"],
      });

      expect(APP_ROUTES[2]).toEqual({
        path: "/*",
        tagName: "div",
        classes: ["charge-page", "charge-page--split"],
      });
    });

    it("should initialize Router on #router-outlet during bootstrapApp and expose __appRouter", () => {
      const rootElement = document.createElement("main");
      rootElement.id = "app";

      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      rootElement.appendChild(outlet);

      document.body.appendChild(rootElement);

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
      });

      expect(rootElement.__appRouter).toBeDefined();
      expect(rootElement.__appRouter).toBeInstanceOf(Router);
      expect(rootElement.__appRouter.wrapper).toBe(outlet);

      rootElement.remove();
    });

    it("should allow injecting a custom appRouter or routes during bootstrapApp", () => {
      const rootElement = document.createElement("main");
      rootElement.id = "app";
      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      rootElement.appendChild(outlet);
      document.body.appendChild(rootElement);

      const customRoutes = [{ path: "/", tagName: "custom-view" }];
      const customRouter = new Router(outlet, customRoutes);

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
        appRouter: customRouter,
      });

      expect(rootElement.__appRouter).toBe(customRouter);

      rootElement.remove();
    });

    it("should mount initial route cleanly without duplicating children in #router-outlet", () => {
      window.history.replaceState(null, "", "/");

      const rootElement = document.createElement("main");
      rootElement.id = "app";
      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      outlet.innerHTML = `<div class="charge-page charge-page--split"><!-- placeholder --></div>`;
      rootElement.appendChild(outlet);
      document.body.appendChild(rootElement);

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
      });

      expect(outlet.querySelectorAll(".charge-page")).toHaveLength(1);

      rootElement.remove();
    });

    it("should mount <about-page> directly when initial URL is /sobre without leaving placeholder", () => {
      window.history.replaceState(null, "", "/sobre");

      const rootElement = document.createElement("main");
      rootElement.id = "app";
      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      outlet.innerHTML = `<div class="charge-page charge-page--split"><!-- placeholder --></div>`;
      rootElement.appendChild(outlet);
      document.body.appendChild(rootElement);

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
      });

      expect(outlet.querySelector(".charge-page")).toBeNull();
      expect(outlet.querySelector("about-page")).not.toBeNull();

      window.history.replaceState(null, "", "/");
      rootElement.remove();
    });

    it("should navigate between / and /sobre and handle unknown paths via Router.goTo", async () => {
      window.history.replaceState(null, "", "/");

      const rootElement = document.createElement("main");
      rootElement.id = "app";
      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      rootElement.appendChild(outlet);
      document.body.appendChild(rootElement);

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
      });

      // Rota inicial "/"
      expect(outlet.querySelector(".charge-page")).not.toBeNull();
      expect(outlet.querySelector("about-page")).toBeNull();

      // Navegação para "/sobre"
      Router.goTo("/sobre");
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(window.location.pathname).toBe("/sobre");
      expect(outlet.querySelector("about-page")).not.toBeNull();
      expect(
        outlet.querySelector("about-page").classList.contains("about-page"),
      ).toBe(true);

      // Navegação de volta para "/"
      Router.goTo("/");
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(window.location.pathname).toBe("/");
      expect(outlet.querySelector(".charge-page")).not.toBeNull();
      expect(outlet.querySelector("about-page")).toBeNull();

      // Rota não mapeada (fallback "/*")
      Router.goTo("/desconhecido");
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(window.location.pathname).toBe("/desconhecido");
      expect(outlet.querySelector(".charge-page")).not.toBeNull();

      // Reset para a rota raiz
      window.history.replaceState(null, "", "/");
      rootElement.remove();
    });
  });

  describe("Dependency Injection container with SetInjectable (TASK-04.3.3)", () => {
    function resolveDependency(target, name) {
      let resolvedValue = null;
      target.dispatchEvent(
        new CustomEvent("request-provider", {
          bubbles: true,
          composed: true,
          detail: {
            name,
            inject: (val) => {
              resolvedValue = val;
            },
          },
        }),
      );
      return resolvedValue;
    }

    it("should register all core gateways, use cases and app-router via SetInjectable in ownerDocument", () => {
      const rootElement = document.createElement("main");
      rootElement.id = "app";
      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      rootElement.appendChild(outlet);
      document.body.appendChild(rootElement);

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
      });

      // Gateways
      expect(
        resolveDependency(rootElement, "pwa-install-gateway"),
      ).toBeInstanceOf(PwaInstallAdapter);
      expect(
        resolveDependency(rootElement, "service-worker-gateway"),
      ).toBeInstanceOf(ServiceWorkerAdapter);
      expect(
        resolveDependency(rootElement, "browser-share-gateway"),
      ).toBeInstanceOf(BrowserShareAdapter);
      expect(
        resolveDependency(rootElement, "pix-key-repository"),
      ).toBeInstanceOf(IndexedDbPixKeyRepository);

      // Casos de Uso
      expect(
        resolveDependency(rootElement, "install-pwa-use-case"),
      ).toBeInstanceOf(InstallPwaUseCase);
      expect(
        resolveDependency(rootElement, "generate-pix-charge-use-case"),
      ).toBeInstanceOf(GeneratePixChargeUseCase);
      expect(
        resolveDependency(rootElement, "distribute-pix-charge-use-case"),
      ).toBeInstanceOf(DistributePixChargeUseCase);
      expect(
        resolveDependency(rootElement, "save-pix-key-use-case"),
      ).toBeInstanceOf(SavePixKeyUseCase);
      expect(
        resolveDependency(rootElement, "list-pix-keys-use-case"),
      ).toBeInstanceOf(ListPixKeysUseCase);
      expect(
        resolveDependency(rootElement, "select-pix-key-use-case"),
      ).toBeInstanceOf(SelectPixKeyUseCase);
      expect(
        resolveDependency(rootElement, "delete-pix-key-use-case"),
      ).toBeInstanceOf(DeletePixKeyUseCase);

      // Router
      expect(resolveDependency(rootElement, "app-router")).toBe(
        rootElement.__appRouter,
      );

      rootElement.remove();
    });

    it("should resolve injectables in a CustomElement child via this.addInjectable() upon connection", () => {
      const rootElement = document.createElement("main");
      rootElement.id = "app";
      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      rootElement.appendChild(outlet);
      document.body.appendChild(rootElement);

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
      });

      const tagName = "test-consumer-element";
      if (!customElements.get(tagName)) {
        class TestConsumerElement extends CustomElement {
          constructor() {
            super();
            this.addInjectable("pix-key-repository", "keyRepo");
            this.addInjectable(
              "generate-pix-charge-use-case",
              "generateCharge",
            );
            this.addInjectable(
              "distribute-pix-charge-use-case",
              "distributeCharge",
            );
            this.addInjectable("app-router", "router");
          }
        }
        customElements.define(tagName, TestConsumerElement);
      }

      const consumer = document.createElement(tagName);
      rootElement.appendChild(consumer);

      expect(consumer.keyRepo).toBeInstanceOf(IndexedDbPixKeyRepository);
      expect(consumer.generateCharge).toBeInstanceOf(GeneratePixChargeUseCase);
      expect(consumer.distributeCharge).toBeInstanceOf(
        DistributePixChargeUseCase,
      );
      expect(consumer.router).toBe(rootElement.__appRouter);

      rootElement.remove();
    });

    it("should allow passing custom use case and gateway instances in bootstrapApp options", () => {
      const rootElement = document.createElement("main");
      rootElement.id = "app";
      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      rootElement.appendChild(outlet);
      document.body.appendChild(rootElement);

      const customKeyRepo = { findById: vi.fn(), findAll: vi.fn() };
      const customGenerateUseCase = { execute: vi.fn() };
      const customDistributeUseCase = { execute: vi.fn() };
      const customShareGateway = { share: vi.fn(), canShare: vi.fn() };

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
        pixKeyRepository: customKeyRepo,
        generatePixChargeUseCase: customGenerateUseCase,
        distributePixChargeUseCase: customDistributeUseCase,
        browserShareGateway: customShareGateway,
      });

      expect(resolveDependency(rootElement, "pix-key-repository")).toBe(
        customKeyRepo,
      );
      expect(
        resolveDependency(rootElement, "generate-pix-charge-use-case"),
      ).toBe(customGenerateUseCase);
      expect(
        resolveDependency(rootElement, "distribute-pix-charge-use-case"),
      ).toBe(customDistributeUseCase);
      expect(resolveDependency(rootElement, "browser-share-gateway")).toBe(
        customShareGateway,
      );

      rootElement.remove();
    });
  });

  describe("Dependency Injection container with SetInjectable (TASK-04.3.3)", () => {
    function resolveDependency(target, name) {
      let resolvedValue = null;
      target.dispatchEvent(
        new CustomEvent("request-provider", {
          bubbles: true,
          composed: true,
          detail: {
            name,
            inject: (val) => {
              resolvedValue = val;
            },
          },
        }),
      );
      return resolvedValue;
    }

    it("should register all core gateways, use cases and app-router via SetInjectable in ownerDocument", () => {
      const rootElement = document.createElement("main");
      rootElement.id = "app";
      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      rootElement.appendChild(outlet);
      document.body.appendChild(rootElement);

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
      });

      // Gateways
      expect(
        resolveDependency(rootElement, "pwa-install-gateway"),
      ).toBeInstanceOf(PwaInstallAdapter);
      expect(
        resolveDependency(rootElement, "service-worker-gateway"),
      ).toBeInstanceOf(ServiceWorkerAdapter);
      expect(
        resolveDependency(rootElement, "browser-share-gateway"),
      ).toBeInstanceOf(BrowserShareAdapter);
      expect(
        resolveDependency(rootElement, "pix-key-repository"),
      ).toBeInstanceOf(IndexedDbPixKeyRepository);

      // Casos de Uso
      expect(
        resolveDependency(rootElement, "install-pwa-use-case"),
      ).toBeInstanceOf(InstallPwaUseCase);
      expect(
        resolveDependency(rootElement, "generate-pix-charge-use-case"),
      ).toBeInstanceOf(GeneratePixChargeUseCase);
      expect(
        resolveDependency(rootElement, "distribute-pix-charge-use-case"),
      ).toBeInstanceOf(DistributePixChargeUseCase);
      expect(
        resolveDependency(rootElement, "save-pix-key-use-case"),
      ).toBeInstanceOf(SavePixKeyUseCase);
      expect(
        resolveDependency(rootElement, "list-pix-keys-use-case"),
      ).toBeInstanceOf(ListPixKeysUseCase);
      expect(
        resolveDependency(rootElement, "select-pix-key-use-case"),
      ).toBeInstanceOf(SelectPixKeyUseCase);
      expect(
        resolveDependency(rootElement, "delete-pix-key-use-case"),
      ).toBeInstanceOf(DeletePixKeyUseCase);

      // Router
      expect(resolveDependency(rootElement, "app-router")).toBe(
        rootElement.__appRouter,
      );

      rootElement.remove();
    });

    it("should resolve injectables in a CustomElement child via this.addInjectable() upon connection", () => {
      const rootElement = document.createElement("main");
      rootElement.id = "app";
      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      rootElement.appendChild(outlet);
      document.body.appendChild(rootElement);

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
      });

      const tagName = "test-consumer-element";
      if (!customElements.get(tagName)) {
        class TestConsumerElement extends CustomElement {
          constructor() {
            super();
            this.addInjectable("pix-key-repository", "keyRepo");
            this.addInjectable(
              "generate-pix-charge-use-case",
              "generateCharge",
            );
            this.addInjectable(
              "distribute-pix-charge-use-case",
              "distributeCharge",
            );
            this.addInjectable("app-router", "router");
          }
        }
        customElements.define(tagName, TestConsumerElement);
      }

      const consumer = document.createElement(tagName);
      rootElement.appendChild(consumer);

      expect(consumer.keyRepo).toBeInstanceOf(IndexedDbPixKeyRepository);
      expect(consumer.generateCharge).toBeInstanceOf(GeneratePixChargeUseCase);
      expect(consumer.distributeCharge).toBeInstanceOf(
        DistributePixChargeUseCase,
      );
      expect(consumer.router).toBe(rootElement.__appRouter);

      rootElement.remove();
    });

    it("should allow passing custom use case and gateway instances in bootstrapApp options", () => {
      const rootElement = document.createElement("main");
      rootElement.id = "app";
      const outlet = document.createElement("div");
      outlet.id = "router-outlet";
      rootElement.appendChild(outlet);
      document.body.appendChild(rootElement);

      const customKeyRepo = { findById: vi.fn(), findAll: vi.fn() };
      const customGenerateUseCase = { execute: vi.fn() };
      const customDistributeUseCase = { execute: vi.fn() };
      const customShareGateway = { share: vi.fn(), canShare: vi.fn() };

      bootstrapApp(rootElement, {
        autoRegisterServiceWorker: false,
        pixKeyRepository: customKeyRepo,
        generatePixChargeUseCase: customGenerateUseCase,
        distributePixChargeUseCase: customDistributeUseCase,
        browserShareGateway: customShareGateway,
      });

      expect(resolveDependency(rootElement, "pix-key-repository")).toBe(
        customKeyRepo,
      );
      expect(
        resolveDependency(rootElement, "generate-pix-charge-use-case"),
      ).toBe(customGenerateUseCase);
      expect(
        resolveDependency(rootElement, "distribute-pix-charge-use-case"),
      ).toBe(customDistributeUseCase);
      expect(resolveDependency(rootElement, "browser-share-gateway")).toBe(
        customShareGateway,
      );

      rootElement.remove();
    });
  });
});
