/**
 * Ponto de entrada ESM e API pública do aplicativo Manda um PIX (mandaumpix.app).
 * Organizado e modularizado conforme os princípios da Clean Architecture.
 */

// Bibliotecas externas e ecossistema @modnes
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

// Camada de Apresentação (Bootstrap, Roteador & DI)
import { bootstrapApp } from "./presentation/bootstrap/bootstrap-app.js";
import {
  APP_ROUTES,
  ROUTE_TITLES,
  initAppRouter,
  resolveRouteTitle,
  setupNavigationInterception,
  setupRouteAccessibility,
} from "./presentation/router/app-router.js";
import {
  bindServicesToRoot,
  createAppServices,
  registerInjectables,
} from "./presentation/di/container.js";
import AppHeaderComponent from "./presentation/components/app-header/app-header.component.js";
import VectorIconComponent from "./presentation/components/vector-icon/vector-icon.component.js";

// Camada de Infraestrutura
import {
  exportQrCodePng,
  generatePixCharge,
  parsePixCharge,
} from "./infrastructure/pix/pix-qr.service.js";
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
import {
  BROWSER_SHARE_ADAPTER_ERROR_CODES,
  BrowserShareAdapter,
  BrowserShareAdapterError,
  createBrowserShareAdapter,
} from "./infrastructure/share/browser-share.adapter.js";

// Camada de Domínio
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

// Camada de Aplicação (Casos de Uso)
import {
  GeneratePixChargeUseCase,
  executeGeneratePixCharge,
} from "./application/use-cases/generate-pix-charge.use-case.js";
import {
  PIX_KEY_MANAGEMENT_ERROR_CODES,
  PixKeyManagementError,
  SavePixKeyUseCase,
  assertPixKeyRepository,
  executeSavePixKey,
  hydrateChaveContaList,
} from "./application/use-cases/save-pix-key.use-case.js";
import {
  ListPixKeysUseCase,
  executeListPixKeys,
} from "./application/use-cases/list-pix-keys.use-case.js";
import {
  SelectPixKeyUseCase,
  executeSelectPixKey,
  resolveRequiredPixKeyId,
} from "./application/use-cases/select-pix-key.use-case.js";
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

/**
 * Metadados estáticos do aplicativo.
 */
export const APP_METADATA = Object.freeze({
  name: "Manda um PIX",
  packageName: "mandaumpix.app",
  version: "1.0.0",
  license: "AGPL-3.0-only",
});

// Auto-inicialização caso o ambiente execute no navegador
if (typeof document !== "undefined") {
  bootstrapApp();
}

// Reexportações públicas agrupadas
export {
  // Core & Ecossistema @modnes
  AccessController,
  ArrayHandler,
  CustomElement,
  DataController,
  DataHandler,
  Router,
  SetInjectable,
  // Componentes de Apresentação
  AppHeaderComponent,
  VectorIconComponent,
  // Roteamento & Navegação
  APP_ROUTES,
  ROUTE_TITLES,
  initAppRouter,
  resolveRouteTitle,
  setupNavigationInterception,
  setupRouteAccessibility,
  // Bootstrap & Injeção de Dependências
  bindServicesToRoot,
  bootstrapApp,
  createAppServices,
  registerInjectables,
  // Serviços PIX e QR Code
  createStaticPix,
  encodeQR,
  exportQrCodePng,
  generatePixCharge,
  gifToPng,
  hasError,
  isStaticPix,
  parsePix,
  parsePixCharge,
  svgToPng,
  // Entidades e Validadores de Domínio
  ChaveConta,
  CobrancaPix,
  DEFAULT_PIX_CHARGE_TXID,
  DEFAULT_PIX_KEY_LABELS,
  MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH,
  MAX_PIX_CHARGE_AMOUNT,
  MAX_PIX_CHARGE_TXID_LENGTH,
  PIX_CHARGE_ERROR_CODES,
  PIX_KEY_ERROR_CODES,
  PIX_KEY_TYPES,
  PixChargeEntity,
  PixChargeValidationError,
  PixKeyEntity,
  PixKeyValidationError,
  normalizeAdditionalInfo,
  normalizeMerchantCity,
  normalizeMerchantName,
  normalizeTransactionAmount,
  normalizeTxid,
  resolveChaveConta,
  validateAndNormalizeCnpj,
  validateAndNormalizeCpf,
  validateAndNormalizeEmail,
  validateAndNormalizeEvp,
  validateAndNormalizePhone,
  validateAndNormalizePixKey,
  // Casos de Uso da Aplicação
  DEFAULT_QR_IMAGE_FILENAME,
  DEFAULT_QR_IMAGE_SIZE,
  DEFAULT_SHARE_TITLE,
  DeletePixKeyUseCase,
  DistributePixChargeUseCase,
  GeneratePixChargeUseCase,
  InstallPwaUseCase,
  ListPixKeysUseCase,
  PIX_CHARGE_DISTRIBUTION_ACTIONS,
  PIX_CHARGE_DISTRIBUTION_CHANNELS,
  PIX_CHARGE_DISTRIBUTION_ERROR_CODES,
  PIX_KEY_MANAGEMENT_ERROR_CODES,
  PWA_INSTALL_ACTIONS,
  PWA_INSTALL_ERROR_CODES,
  PWA_INSTALL_OUTCOMES,
  PixChargeDistributionError,
  PixKeyManagementError,
  PwaInstallError,
  SavePixKeyUseCase,
  SelectPixKeyUseCase,
  assertChargeDistributionGateway,
  assertPixKeyRepository,
  assertPwaInstallGateway,
  buildWhatsAppShareUrl,
  executeDeletePixKey,
  executeDistributePixCharge,
  executeGeneratePixCharge,
  executeInstallPwa,
  executeListPixKeys,
  executeSavePixKey,
  executeSelectPixKey,
  extractChargeDistributionTarget,
  hydrateChaveContaList,
  normalizePwaInstallOutcome,
  normalizePwaInstallState,
  normalizeQrDimensions,
  normalizeQrDownloadFileName,
  resolveRequiredPixKeyId,
  // Adaptadores de Infraestrutura
  BROWSER_SHARE_ADAPTER_ERROR_CODES,
  BrowserShareAdapter,
  BrowserShareAdapterError,
  CACHE_VERSION,
  DEFAULT_DB_NAME,
  DEFAULT_DB_VERSION,
  DEFAULT_SW_SCOPE,
  DEFAULT_SW_SCRIPT_URL,
  DEFAULT_SW_TYPE,
  IndexedDbPixKeyRepository,
  OBJECT_STORES,
  PIX_KEY_INDEXES,
  PIX_KEY_STORAGE_ERROR_CODES,
  PRECACHE_NAME,
  PWA_INSTALL_ADAPTER_ERROR_CODES,
  PixKeyStorageError,
  PwaInstallAdapter,
  PwaInstallAdapterError,
  RUNTIME_CACHE_NAME,
  SELECTED_KEY_SETTING_KEY,
  SERVICE_WORKER_ADAPTER_ERROR_CODES,
  SERVICE_WORKER_STATUS,
  STANDALONE_MEDIA_QUERY,
  ServiceWorkerAdapter,
  ServiceWorkerAdapterError,
  assertIndexedDbFactory,
  createBrowserShareAdapter,
  createIndexedDbPixKeyRepository,
  createPwaInstallAdapter,
  createServiceWorkerAdapter,
  detectStandaloneMode,
  isOnline,
  isServiceWorkerSupported,
  mapStorageDomException,
  openPixKeyDatabase,
  upgradePixKeyDatabaseSchema,
};
