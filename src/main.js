import AccessController from "@modnes/access-controller";
import CustomElement, { SetInjectable } from "@modnes/custom-element";
import DataController, {
  ArrayHandler,
  DataHandler,
} from "@modnes/data-controller";
import Router from "@modnes/router";
import { createStaticPix, hasError, isStaticPix, parsePix } from "pix-utils";
import encodeQR from "qr";
import { gifToPng, svgToPng } from "qr/dom.js";
import {
  DeletePixKeyUseCase,
  executeDeletePixKey,
} from "./application/use-cases/delete-pix-key.use-case.js";
import {
  DEFAULT_QR_IMAGE_FILENAME,
  DEFAULT_QR_IMAGE_SIZE,
  DEFAULT_SHARE_TITLE,
  DistributePixChargeUseCase,
  PIX_CHARGE_DISTRIBUTION_ACTIONS,
  PIX_CHARGE_DISTRIBUTION_CHANNELS,
  PIX_CHARGE_DISTRIBUTION_ERROR_CODES,
  PixChargeDistributionError,
  assertChargeDistributionGateway,
  buildWhatsAppShareUrl,
  executeDistributePixCharge,
  extractChargeDistributionTarget,
  normalizeQrDimensions,
  normalizeQrDownloadFileName,
} from "./application/use-cases/distribute-pix-charge.use-case.js";
import {
  GeneratePixChargeUseCase,
  executeGeneratePixCharge,
} from "./application/use-cases/generate-pix-charge.use-case.js";
import {
  InstallPwaUseCase,
  PWA_INSTALL_ACTIONS,
  PWA_INSTALL_ERROR_CODES,
  PWA_INSTALL_OUTCOMES,
  PwaInstallError,
  assertPwaInstallGateway,
  executeInstallPwa,
  normalizePwaInstallOutcome,
  normalizePwaInstallState,
} from "./application/use-cases/install-pwa.use-case.js";
import {
  ListPixKeysUseCase,
  executeListPixKeys,
} from "./application/use-cases/list-pix-keys.use-case.js";
import {
  PIX_KEY_MANAGEMENT_ERROR_CODES,
  PixKeyManagementError,
  SavePixKeyUseCase,
  assertPixKeyRepository,
  executeSavePixKey,
  hydrateChaveContaList,
} from "./application/use-cases/save-pix-key.use-case.js";
import {
  SelectPixKeyUseCase,
  executeSelectPixKey,
  resolveRequiredPixKeyId,
} from "./application/use-cases/select-pix-key.use-case.js";
import {
  CobrancaPix,
  DEFAULT_PIX_CHARGE_TXID,
  MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH,
  MAX_PIX_CHARGE_AMOUNT,
  MAX_PIX_CHARGE_TXID_LENGTH,
  PIX_CHARGE_ERROR_CODES,
  PixChargeEntity,
  PixChargeValidationError,
  normalizeAdditionalInfo,
  normalizeTransactionAmount,
  normalizeTxid,
  resolveChaveConta,
} from "./domain/entities/pix-charge.entity.js";
import {
  ChaveConta,
  DEFAULT_PIX_KEY_LABELS,
  PIX_KEY_ERROR_CODES,
  PIX_KEY_TYPES,
  PixKeyEntity,
  PixKeyValidationError,
  normalizeMerchantCity,
  normalizeMerchantName,
  validateAndNormalizeCnpj,
  validateAndNormalizeCpf,
  validateAndNormalizeEmail,
  validateAndNormalizeEvp,
  validateAndNormalizePhone,
  validateAndNormalizePixKey,
} from "./domain/entities/pix-key.entity.js";
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
} from "./infrastructure/storage/indexed-db-pix-key.repository.js";
import {
  PWA_INSTALL_ADAPTER_ERROR_CODES,
  PwaInstallAdapter,
  PwaInstallAdapterError,
  STANDALONE_MEDIA_QUERY,
  createPwaInstallAdapter,
  detectStandaloneMode,
} from "./infrastructure/pwa/pwa-install.adapter.js";
import {
  BROWSER_SHARE_ADAPTER_ERROR_CODES,
  BrowserShareAdapter,
  BrowserShareAdapterError,
  createBrowserShareAdapter,
} from "./infrastructure/share/browser-share.adapter.js";
import {
  CACHE_VERSION,
  DEFAULT_SW_SCOPE,
  DEFAULT_SW_SCRIPT_URL,
  DEFAULT_SW_TYPE,
  PRECACHE_NAME,
  RUNTIME_CACHE_NAME,
  SERVICE_WORKER_ADAPTER_ERROR_CODES,
  SERVICE_WORKER_STATUS,
  ServiceWorkerAdapter,
  ServiceWorkerAdapterError,
  createServiceWorkerAdapter,
  isOnline,
  isServiceWorkerSupported,
} from "./infrastructure/pwa/service-worker.adapter.js";
import AppHeaderComponent from "./presentation/components/app-header/app-header.component.js";
import VectorIconComponent from "./presentation/components/vector-icon/vector-icon.component.js";

export const APP_METADATA = Object.freeze({
  name: "Manda um PIX",
  packageName: "mandaumpix.app",
  version: "1.0.0",
  license: "AGPL-3.0-only",
});

export const APP_ROUTES = Object.freeze([
  {
    path: "/",
    tagName: "div",
    classes: ["charge-page", "charge-page--split"],
  },
  {
    path: "/sobre",
    tagName: "about-page",
    classes: ["about-page"],
  },
  {
    path: "/*",
    tagName: "div",
    classes: ["charge-page", "charge-page--split"],
  },
]);

export function generatePixCharge({
  pixKey,
  merchantName = "Manda um PIX",
  merchantCity = "Brasilia",
  transactionAmount = 0,
  txid = "***",
  infoAdicional,
  qrOptions = {},
}) {
  const normalizedAmount =
    typeof transactionAmount === "number" && transactionAmount > 0
      ? transactionAmount
      : 0;

  const pixObject = createStaticPix({
    pixKey,
    merchantName,
    merchantCity,
    transactionAmount: normalizedAmount,
    txid,
    ...(infoAdicional ? { infoAdicional } : {}),
  });

  if (hasError(pixObject)) {
    throw new Error(pixObject.error || "Falha ao gerar cobrança PIX.");
  }

  const brCode = pixObject.toBRCode();
  const qrSvg = encodeQR(brCode, "svg", qrOptions);
  const qrDataUrl = encodeQR(brCode, "data-url", qrOptions);
  const qrGifBytes = encodeQR(brCode, "gif", qrOptions);

  return {
    pixObject,
    brCode,
    qrSvg,
    qrDataUrl,
    qrGifBytes,
  };
}

export function parsePixCharge(brCode) {
  const parsed = parsePix(brCode);
  if (hasError(parsed)) {
    throw new Error(parsed.error || "Código PIX inválido.");
  }

  return {
    parsed,
    isStatic: isStaticPix(parsed),
  };
}

export async function exportQrCodePng(
  brCode,
  { width = 512, height = 512, qrOptions = {} } = {},
) {
  const svgMarkup = encodeQR(brCode, "svg", qrOptions);
  return svgToPng(svgMarkup, width, height);
}

export function bootstrapApp(
  rootElement = typeof document !== "undefined"
    ? document.querySelector("#app")
    : null,
  {
    windowTarget = typeof window !== "undefined" ? window : globalThis.window,
    navigatorTarget = typeof navigator !== "undefined"
      ? navigator
      : globalThis.navigator,
    autoRegisterServiceWorker = true,
    serviceWorkerAdapter = null,
    pwaInstallAdapter = null,
    installPwaUseCase = null,
    browserShareGateway = null,
    pixKeyRepository = null,
    generatePixChargeUseCase = null,
    distributePixChargeUseCase = null,
    savePixKeyUseCase = null,
    listPixKeysUseCase = null,
    selectPixKeyUseCase = null,
    deletePixKeyUseCase = null,
    appRouter = null,
    routes = APP_ROUTES,
  } = {},
) {
  if (!rootElement) {
    return null;
  }

  rootElement.dataset.initialized = "true";

  let swAdapter = serviceWorkerAdapter;
  if (!swAdapter) {
    swAdapter = createServiceWorkerAdapter({
      windowTarget,
      navigatorTarget,
      scriptUrl: DEFAULT_SW_SCRIPT_URL,
      scope: DEFAULT_SW_SCOPE,
    });
  }

  if (swAdapter && autoRegisterServiceWorker) {
    const registerWorker = () => {
      swAdapter.register().catch(() => {
        // Falha no registro é tolerada sem quebrar a inicialização da aplicação
      });
    };

    if (
      windowTarget?.document?.readyState === "complete" ||
      !windowTarget?.addEventListener
    ) {
      registerWorker();
    } else {
      windowTarget.addEventListener("load", registerWorker, { once: true });
    }
  }

  let installAdapter = pwaInstallAdapter;
  if (!installAdapter) {
    installAdapter = createPwaInstallAdapter({
      windowTarget,
      navigatorTarget,
    });
  }

  let installUseCase = installPwaUseCase;
  if (!installUseCase) {
    installUseCase = new InstallPwaUseCase({
      pwaInstallGateway: installAdapter,
    });
  }

  let shareGateway = browserShareGateway;
  if (!shareGateway) {
    shareGateway = createBrowserShareAdapter({
      windowTarget,
      navigatorTarget,
    });
  }

  let keyRepo = pixKeyRepository;
  if (!keyRepo) {
    keyRepo = createIndexedDbPixKeyRepository({
      indexedDbFactory: windowTarget?.indexedDB || globalThis.indexedDB,
      databaseName: DEFAULT_DB_NAME,
      databaseVersion: DEFAULT_DB_VERSION,
    });
  }

  let genChargeUseCase = generatePixChargeUseCase;
  if (!genChargeUseCase) {
    genChargeUseCase = new GeneratePixChargeUseCase({
      pixKeyRepository: keyRepo,
    });
  }

  let distChargeUseCase = distributePixChargeUseCase;
  if (!distChargeUseCase) {
    distChargeUseCase = new DistributePixChargeUseCase({
      chargeDistributionGateway: shareGateway,
    });
  }

  let saveKeyUseCase = savePixKeyUseCase;
  if (!saveKeyUseCase) {
    saveKeyUseCase = new SavePixKeyUseCase({
      pixKeyRepository: keyRepo,
    });
  }

  let listKeysUseCase = listPixKeysUseCase;
  if (!listKeysUseCase) {
    listKeysUseCase = new ListPixKeysUseCase({
      pixKeyRepository: keyRepo,
    });
  }

  let selectKeyUseCase = selectPixKeyUseCase;
  if (!selectKeyUseCase) {
    selectKeyUseCase = new SelectPixKeyUseCase({
      pixKeyRepository: keyRepo,
    });
  }

  let deleteKeyUseCase = deletePixKeyUseCase;
  if (!deleteKeyUseCase) {
    deleteKeyUseCase = new DeletePixKeyUseCase({
      pixKeyRepository: keyRepo,
    });
  }

  const outletElement = rootElement.querySelector("#router-outlet");
  let router = appRouter;
  if (!router && outletElement) {
    outletElement.replaceChildren();
    router = new Router(outletElement, routes);
  }

  const ownerDoc =
    rootElement.ownerDocument ||
    (typeof document !== "undefined" ? document : null);
  if (ownerDoc) {
    // Gateways / Adaptadores
    SetInjectable("pwa-install-gateway", installAdapter, ownerDoc);
    if (swAdapter) {
      SetInjectable("service-worker-gateway", swAdapter, ownerDoc);
    }
    SetInjectable("browser-share-gateway", shareGateway, ownerDoc);
    SetInjectable("pix-key-repository", keyRepo, ownerDoc);

    // Casos de Uso
    SetInjectable("install-pwa-use-case", installUseCase, ownerDoc);
    SetInjectable("generate-pix-charge-use-case", genChargeUseCase, ownerDoc);
    SetInjectable(
      "distribute-pix-charge-use-case",
      distChargeUseCase,
      ownerDoc,
    );
    SetInjectable("save-pix-key-use-case", saveKeyUseCase, ownerDoc);
    SetInjectable("list-pix-keys-use-case", listKeysUseCase, ownerDoc);
    SetInjectable("select-pix-key-use-case", selectKeyUseCase, ownerDoc);
    SetInjectable("delete-pix-key-use-case", deleteKeyUseCase, ownerDoc);

    // Roteador
    if (router) {
      SetInjectable("app-router", router, ownerDoc);
    }
  }

  rootElement.__serviceWorkerAdapter = swAdapter;
  rootElement.__pwaInstallAdapter = installAdapter;
  rootElement.__installPwaUseCase = installUseCase;
  rootElement.__browserShareGateway = shareGateway;
  rootElement.__pixKeyRepository = keyRepo;
  rootElement.__generatePixChargeUseCase = genChargeUseCase;
  rootElement.__distributePixChargeUseCase = distChargeUseCase;
  rootElement.__savePixKeyUseCase = saveKeyUseCase;
  rootElement.__listPixKeysUseCase = listKeysUseCase;
  rootElement.__selectPixKeyUseCase = selectKeyUseCase;
  rootElement.__deletePixKeyUseCase = deleteKeyUseCase;
  rootElement.__appRouter = router;

  const headerElement = rootElement.querySelector("app-header");
  if (headerElement) {
    headerElement.installPwaUseCase = installUseCase;
  }

  const handleNavigationClick = (event) => {
    const brandElement = event.target?.closest?.(".app-header__brand");
    if (brandElement && rootElement.contains(brandElement)) {
      event.preventDefault();
      Router.goTo("/");
      return;
    }

    const anchor = event.target?.closest?.("a[href]");
    if (!anchor || !rootElement.contains(anchor)) {
      return;
    }

    if (
      anchor.target === "_blank" ||
      anchor.hasAttribute("download") ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const href = anchor.getAttribute("href");
    if (!href) {
      return;
    }

    if (href.startsWith("/") && !href.startsWith("//")) {
      event.preventDefault();
      Router.goTo(href);
    }
  };

  const handleBrandKeydown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      const brandElement = event.target?.closest?.(".app-header__brand");
      if (brandElement && rootElement.contains(brandElement)) {
        event.preventDefault();
        Router.goTo("/");
      }
    }
  };

  if (rootElement.__navigationClickHandler) {
    rootElement.removeEventListener(
      "click",
      rootElement.__navigationClickHandler,
    );
  }
  if (rootElement.__navigationKeydownHandler) {
    rootElement.removeEventListener(
      "keydown",
      rootElement.__navigationKeydownHandler,
    );
  }

  rootElement.__navigationClickHandler = handleNavigationClick;
  rootElement.__navigationKeydownHandler = handleBrandKeydown;
  rootElement.addEventListener("click", handleNavigationClick);
  rootElement.addEventListener("keydown", handleBrandKeydown);

  return rootElement;
}

if (typeof document !== "undefined") {
  bootstrapApp();
}

export {
  AccessController,
  AppHeaderComponent,
  ArrayHandler,
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
  DataHandler,
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
  SetInjectable,
  VectorIconComponent,
  assertChargeDistributionGateway,
  assertIndexedDbFactory,
  assertPixKeyRepository,
  assertPwaInstallGateway,
  buildWhatsAppShareUrl,
  createBrowserShareAdapter,
  createIndexedDbPixKeyRepository,
  createPwaInstallAdapter,
  createServiceWorkerAdapter,
  createStaticPix,
  detectStandaloneMode,
  encodeQR,
  executeDeletePixKey,
  executeDistributePixCharge,
  executeGeneratePixCharge,
  executeInstallPwa,
  executeListPixKeys,
  executeSavePixKey,
  executeSelectPixKey,
  extractChargeDistributionTarget,
  gifToPng,
  hasError,
  hydrateChaveContaList,
  isOnline,
  isServiceWorkerSupported,
  isStaticPix,
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
  parsePix,
  resolveChaveConta,
  resolveRequiredPixKeyId,
  svgToPng,
  upgradePixKeyDatabaseSchema,
  validateAndNormalizeCnpj,
  validateAndNormalizeCpf,
  validateAndNormalizeEmail,
  validateAndNormalizeEvp,
  validateAndNormalizePhone,
  validateAndNormalizePixKey,
};
