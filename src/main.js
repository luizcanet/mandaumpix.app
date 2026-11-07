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
  GeneratePixChargeUseCase,
  executeGeneratePixCharge,
} from "./application/use-cases/generate-pix-charge.use-case.js";
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
  DEFAULT_PIX_CHARGE_TXID,
  DEFAULT_PIX_KEY_LABELS,
  DataController,
  DataHandler,
  DeletePixKeyUseCase,
  GeneratePixChargeUseCase,
  ListPixKeysUseCase,
  MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH,
  MAX_PIX_CHARGE_AMOUNT,
  MAX_PIX_CHARGE_TXID_LENGTH,
  PIX_CHARGE_ERROR_CODES,
  PIX_KEY_ERROR_CODES,
  PIX_KEY_MANAGEMENT_ERROR_CODES,
  PIX_KEY_TYPES,
  PixChargeEntity,
  PixChargeValidationError,
  PixKeyEntity,
  PixKeyManagementError,
  PixKeyValidationError,
  Router,
  SavePixKeyUseCase,
  SelectPixKeyUseCase,
  SetInjectable,
  assertPixKeyRepository,
  createStaticPix,
  encodeQR,
  executeDeletePixKey,
  executeGeneratePixCharge,
  executeListPixKeys,
  executeSavePixKey,
  executeSelectPixKey,
  gifToPng,
  hasError,
  hydrateChaveContaList,
  isStaticPix,
  normalizeAdditionalInfo,
  normalizeMerchantCity,
  normalizeMerchantName,
  normalizeTransactionAmount,
  normalizeTxid,
  parsePix,
  resolveChaveConta,
  resolveRequiredPixKeyId,
  svgToPng,
  validateAndNormalizeCnpj,
  validateAndNormalizeCpf,
  validateAndNormalizeEmail,
  validateAndNormalizeEvp,
  validateAndNormalizePhone,
  validateAndNormalizePixKey,
};
