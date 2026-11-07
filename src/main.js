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

export const APP_METADATA = Object.freeze({
  name: "Manda um PIX",
  packageName: "mandaumpix.app",
  version: "1.0.0",
  license: "AGPL-3.0-only",
});

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

export function bootstrapApp(rootElement = document.querySelector("#app")) {
  if (!rootElement) {
    return null;
  }

  rootElement.dataset.initialized = "true";
  return rootElement;
}

if (typeof document !== "undefined") {
  bootstrapApp();
}

export {
  AccessController,
  ArrayHandler,
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
  PWA_INSTALL_ERROR_CODES,
  PWA_INSTALL_OUTCOMES,
  PixChargeDistributionError,
  PixChargeEntity,
  PixChargeValidationError,
  PixKeyEntity,
  PixKeyManagementError,
  PixKeyStorageError,
  PixKeyValidationError,
  PwaInstallError,
  Router,
  SELECTED_KEY_SETTING_KEY,
  SavePixKeyUseCase,
  SelectPixKeyUseCase,
  SetInjectable,
  assertChargeDistributionGateway,
  assertIndexedDbFactory,
  assertPixKeyRepository,
  assertPwaInstallGateway,
  buildWhatsAppShareUrl,
  createIndexedDbPixKeyRepository,
  createStaticPix,
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
