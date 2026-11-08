import { SetInjectable } from "@modnes/custom-element";
import { DeletePixKeyUseCase } from "../../application/use-cases/delete-pix-key.use-case.js";
import { DistributePixChargeUseCase } from "../../application/use-cases/distribute-pix-charge.use-case.js";
import { GeneratePixChargeUseCase } from "../../application/use-cases/generate-pix-charge.use-case.js";
import { InstallPwaUseCase } from "../../application/use-cases/install-pwa.use-case.js";
import { ListPixKeysUseCase } from "../../application/use-cases/list-pix-keys.use-case.js";
import { SavePixKeyUseCase } from "../../application/use-cases/save-pix-key.use-case.js";
import { SelectPixKeyUseCase } from "../../application/use-cases/select-pix-key.use-case.js";
import {
  DEFAULT_DB_NAME,
  DEFAULT_DB_VERSION,
  createIndexedDbPixKeyRepository,
} from "../../infrastructure/storage/indexed-db-pix-key.repository.js";
import { createPwaInstallAdapter } from "../../infrastructure/pwa/pwa-install.adapter.js";
import { createBrowserShareAdapter } from "../../infrastructure/share/browser-share.adapter.js";
import {
  DEFAULT_SW_SCOPE,
  DEFAULT_SW_SCRIPT_URL,
  createServiceWorkerAdapter,
} from "../../infrastructure/pwa/service-worker.adapter.js";

/**
 * Cria ou reaproveita o conjunto completo de adaptadores e casos de uso da aplicação.
 *
 * @param {Object} [options={}]
 * @param {Window} [options.windowTarget]
 * @param {Navigator} [options.navigatorTarget]
 * @param {Object} [options.overrides={}]
 * @returns {Object} Dicionário contendo todas as instâncias de serviços
 */
export function createAppServices({
  windowTarget = typeof window !== "undefined" ? window : globalThis.window,
  navigatorTarget = typeof navigator !== "undefined"
    ? navigator
    : globalThis.navigator,
  overrides = {},
} = {}) {
  const serviceWorkerAdapter =
    overrides.serviceWorkerAdapter ||
    createServiceWorkerAdapter({
      windowTarget,
      navigatorTarget,
      scriptUrl: DEFAULT_SW_SCRIPT_URL,
      scope: DEFAULT_SW_SCOPE,
    });

  const pwaInstallAdapter =
    overrides.pwaInstallAdapter ||
    createPwaInstallAdapter({
      windowTarget,
      navigatorTarget,
    });

  const installPwaUseCase =
    overrides.installPwaUseCase ||
    new InstallPwaUseCase({
      pwaInstallGateway: pwaInstallAdapter,
    });

  const browserShareGateway =
    overrides.browserShareGateway ||
    createBrowserShareAdapter({
      windowTarget,
      navigatorTarget,
    });

  const pixKeyRepository =
    overrides.pixKeyRepository ||
    createIndexedDbPixKeyRepository({
      indexedDbFactory: windowTarget?.indexedDB || globalThis.indexedDB,
      databaseName: DEFAULT_DB_NAME,
      databaseVersion: DEFAULT_DB_VERSION,
    });

  const generatePixChargeUseCase =
    overrides.generatePixChargeUseCase ||
    new GeneratePixChargeUseCase({
      pixKeyRepository,
    });

  const distributePixChargeUseCase =
    overrides.distributePixChargeUseCase ||
    new DistributePixChargeUseCase({
      chargeDistributionGateway: browserShareGateway,
    });

  const savePixKeyUseCase =
    overrides.savePixKeyUseCase ||
    new SavePixKeyUseCase({
      pixKeyRepository,
    });

  const listPixKeysUseCase =
    overrides.listPixKeysUseCase ||
    new ListPixKeysUseCase({
      pixKeyRepository,
    });

  const selectPixKeyUseCase =
    overrides.selectPixKeyUseCase ||
    new SelectPixKeyUseCase({
      pixKeyRepository,
    });

  const deletePixKeyUseCase =
    overrides.deletePixKeyUseCase ||
    new DeletePixKeyUseCase({
      pixKeyRepository,
    });

  return {
    serviceWorkerAdapter,
    pwaInstallAdapter,
    installPwaUseCase,
    browserShareGateway,
    pixKeyRepository,
    generatePixChargeUseCase,
    distributePixChargeUseCase,
    savePixKeyUseCase,
    listPixKeysUseCase,
    selectPixKeyUseCase,
    deletePixKeyUseCase,
    appRouter: overrides.appRouter || null,
  };
}

/**
 * Registra os serviços no ownerDocument utilizando SetInjectable.
 *
 * @param {Document} ownerDoc
 * @param {Object} services
 */
export function registerInjectables(ownerDoc, services = {}) {
  if (!ownerDoc) {
    return;
  }

  // Gateways / Adaptadores
  if (services.pwaInstallAdapter) {
    SetInjectable("pwa-install-gateway", services.pwaInstallAdapter, ownerDoc);
  }
  if (services.serviceWorkerAdapter) {
    SetInjectable(
      "service-worker-gateway",
      services.serviceWorkerAdapter,
      ownerDoc,
    );
  }
  if (services.browserShareGateway) {
    SetInjectable(
      "browser-share-gateway",
      services.browserShareGateway,
      ownerDoc,
    );
  }
  if (services.pixKeyRepository) {
    SetInjectable("pix-key-repository", services.pixKeyRepository, ownerDoc);
  }

  // Casos de Uso
  if (services.installPwaUseCase) {
    SetInjectable("install-pwa-use-case", services.installPwaUseCase, ownerDoc);
  }
  if (services.generatePixChargeUseCase) {
    SetInjectable(
      "generate-pix-charge-use-case",
      services.generatePixChargeUseCase,
      ownerDoc,
    );
  }
  if (services.distributePixChargeUseCase) {
    SetInjectable(
      "distribute-pix-charge-use-case",
      services.distributePixChargeUseCase,
      ownerDoc,
    );
  }
  if (services.savePixKeyUseCase) {
    SetInjectable(
      "save-pix-key-use-case",
      services.savePixKeyUseCase,
      ownerDoc,
    );
  }
  if (services.listPixKeysUseCase) {
    SetInjectable(
      "list-pix-keys-use-case",
      services.listPixKeysUseCase,
      ownerDoc,
    );
  }
  if (services.selectPixKeyUseCase) {
    SetInjectable(
      "select-pix-key-use-case",
      services.selectPixKeyUseCase,
      ownerDoc,
    );
  }
  if (services.deletePixKeyUseCase) {
    SetInjectable(
      "delete-pix-key-use-case",
      services.deletePixKeyUseCase,
      ownerDoc,
    );
  }

  // Roteador
  if (services.appRouter) {
    SetInjectable("app-router", services.appRouter, ownerDoc);
  }
}

/**
 * Vincula as instâncias de serviços ao elemento raiz da aplicação.
 *
 * @param {HTMLElement} rootElement
 * @param {Object} services
 */
export function bindServicesToRoot(rootElement, services = {}) {
  if (!rootElement) {
    return;
  }

  rootElement.__serviceWorkerAdapter = services.serviceWorkerAdapter;
  rootElement.__pwaInstallAdapter = services.pwaInstallAdapter;
  rootElement.__installPwaUseCase = services.installPwaUseCase;
  rootElement.__browserShareGateway = services.browserShareGateway;
  rootElement.__pixKeyRepository = services.pixKeyRepository;
  rootElement.__generatePixChargeUseCase = services.generatePixChargeUseCase;
  rootElement.__distributePixChargeUseCase =
    services.distributePixChargeUseCase;
  rootElement.__savePixKeyUseCase = services.savePixKeyUseCase;
  rootElement.__listPixKeysUseCase = services.listPixKeysUseCase;
  rootElement.__selectPixKeyUseCase = services.selectPixKeyUseCase;
  rootElement.__deletePixKeyUseCase = services.deletePixKeyUseCase;
  rootElement.__appRouter = services.appRouter;
}
