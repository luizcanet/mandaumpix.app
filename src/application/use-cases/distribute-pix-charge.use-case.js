import { CobrancaPix } from "../../domain/entities/pix-charge.entity.js";

export const DEFAULT_QR_IMAGE_FILENAME = "mandaumpix-qrcode.png";
export const DEFAULT_QR_IMAGE_SIZE = 512;
export const DEFAULT_SHARE_TITLE = "Manda um PIX";

export const PIX_CHARGE_DISTRIBUTION_ACTIONS = Object.freeze({
  COPY: "COPY",
  SHARE: "SHARE",
  DOWNLOAD_QR: "DOWNLOAD_QR",
});

export const PIX_CHARGE_DISTRIBUTION_CHANNELS = Object.freeze({
  WEB_SHARE: "WEB_SHARE",
  WHATSAPP: "WHATSAPP",
});

export const PIX_CHARGE_DISTRIBUTION_ERROR_CODES = Object.freeze({
  MISSING_DISTRIBUTION_GATEWAY: "MISSING_DISTRIBUTION_GATEWAY",
  MISSING_CHARGE_PAYLOAD: "MISSING_CHARGE_PAYLOAD",
  INVALID_CHARGE_PAYLOAD: "INVALID_CHARGE_PAYLOAD",
  INVALID_DISTRIBUTION_ACTION: "INVALID_DISTRIBUTION_ACTION",
  INVALID_QR_FILE_NAME: "INVALID_QR_FILE_NAME",
  INVALID_QR_DIMENSIONS: "INVALID_QR_DIMENSIONS",
  COPY_FAILED: "COPY_FAILED",
  SHARE_FAILED: "SHARE_FAILED",
  DOWNLOAD_FAILED: "DOWNLOAD_FAILED",
});

const BR_CODE_ENVELOPE_REGEX = /^000201.+6304[0-9A-Fa-f]{4}$/;
const SAFE_FILE_BASENAME_REGEX = /^[A-Za-z0-9._-]+$/;

export class PixChargeDistributionError extends Error {
  constructor(
    message,
    { code = "PIX_CHARGE_DISTRIBUTION_ERROR", field = null, cause = null } = {},
  ) {
    super(message);
    this.name = "PixChargeDistributionError";
    this.code = code;
    this.field = field;
    this.cause = cause;
  }
}

export function assertChargeDistributionGateway(gateway, requiredMethods = []) {
  const isValidObject = Boolean(gateway) && typeof gateway === "object";
  const hasRequiredMethods =
    isValidObject &&
    requiredMethods.every(
      (methodName) => typeof gateway[methodName] === "function",
    );

  if (!hasRequiredMethods) {
    throw new PixChargeDistributionError(
      "Porta de distribuição da cobrança PIX ausente ou inválida.",
      {
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_DISTRIBUTION_GATEWAY,
        field: "chargeDistributionGateway",
      },
    );
  }

  return gateway;
}

export function buildWhatsAppShareUrl(rawText) {
  const cleanedText = typeof rawText === "string" ? rawText.trim() : "";

  if (!cleanedText) {
    throw new PixChargeDistributionError(
      "Código PIX Copia e Cola ausente para compartilhamento via WhatsApp.",
      {
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_CHARGE_PAYLOAD,
        field: "chave_cobranca",
      },
    );
  }

  return `https://wa.me/?text=${encodeURIComponent(cleanedText)}`;
}

export function normalizeQrDownloadFileName(rawFileName) {
  if (rawFileName === undefined || rawFileName === null) {
    return DEFAULT_QR_IMAGE_FILENAME;
  }

  if (typeof rawFileName !== "string") {
    throw new PixChargeDistributionError(
      "Nome do arquivo PNG do QR Code inválido.",
      {
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_QR_FILE_NAME,
        field: "fileName",
      },
    );
  }

  const trimmed = rawFileName.trim();
  if (!trimmed) {
    return DEFAULT_QR_IMAGE_FILENAME;
  }

  const withoutExtension = trimmed.replace(/\.png$/i, "").trim();

  if (
    !withoutExtension ||
    withoutExtension.includes("..") ||
    !SAFE_FILE_BASENAME_REGEX.test(withoutExtension)
  ) {
    throw new PixChargeDistributionError(
      "Nome do arquivo PNG do QR Code inválido.",
      {
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_QR_FILE_NAME,
        field: "fileName",
      },
    );
  }

  return `${withoutExtension}.png`;
}

export function normalizeQrDimensions({
  width = DEFAULT_QR_IMAGE_SIZE,
  height = DEFAULT_QR_IMAGE_SIZE,
} = {}) {
  if (!Number.isInteger(width) || width <= 0) {
    throw new PixChargeDistributionError(
      "Largura da imagem do QR Code inválida.",
      {
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_QR_DIMENSIONS,
        field: "width",
      },
    );
  }

  if (!Number.isInteger(height) || height <= 0) {
    throw new PixChargeDistributionError(
      "Altura da imagem do QR Code inválida.",
      {
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_QR_DIMENSIONS,
        field: "height",
      },
    );
  }

  return Object.freeze({ width, height });
}

function validateBrCodeString(rawBrCode) {
  const cleaned = typeof rawBrCode === "string" ? rawBrCode.trim() : "";

  if (!cleaned) {
    throw new PixChargeDistributionError(
      "Informe uma cobrança PIX válida para distribuição.",
      {
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.MISSING_CHARGE_PAYLOAD,
        field: "chave_cobranca",
      },
    );
  }

  if (!BR_CODE_ENVELOPE_REGEX.test(cleaned)) {
    throw new PixChargeDistributionError(
      "Código PIX Copia e Cola (BR Code) inválido para distribuição.",
      {
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_CHARGE_PAYLOAD,
        field: "chave_cobranca",
      },
    );
  }

  return cleaned;
}

export function extractChargeDistributionTarget(input) {
  if (typeof input === "string") {
    const chave_cobranca = validateBrCodeString(input);
    return Object.freeze({
      cobranca: null,
      chave_cobranca,
      imagem_qrcode: null,
    });
  }

  if (input instanceof CobrancaPix) {
    return Object.freeze({
      cobranca: input,
      chave_cobranca: input.chave_cobranca,
      imagem_qrcode: input.imagem_qrcode,
    });
  }

  const safeInput = input && typeof input === "object" ? input : {};
  const rawChargeCandidate =
    safeInput.cobranca !== undefined ? safeInput.cobranca : safeInput.charge;

  if (rawChargeCandidate !== undefined) {
    if (rawChargeCandidate instanceof CobrancaPix) {
      return Object.freeze({
        cobranca: rawChargeCandidate,
        chave_cobranca: rawChargeCandidate.chave_cobranca,
        imagem_qrcode: rawChargeCandidate.imagem_qrcode,
      });
    }

    try {
      const hydrated = CobrancaPix.fromJSON(rawChargeCandidate);
      return Object.freeze({
        cobranca: hydrated,
        chave_cobranca: hydrated.chave_cobranca,
        imagem_qrcode: hydrated.imagem_qrcode,
      });
    } catch (error) {
      throw new PixChargeDistributionError(error.message, {
        code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_CHARGE_PAYLOAD,
        field: "cobranca",
        cause: error,
      });
    }
  }

  const rawBrCode =
    safeInput.chave_cobranca !== undefined
      ? safeInput.chave_cobranca
      : safeInput.brCode;

  const chave_cobranca = validateBrCodeString(rawBrCode);
  const rawQrImage =
    safeInput.imagem_qrcode !== undefined
      ? safeInput.imagem_qrcode
      : safeInput.svg !== undefined || safeInput.dataUrl !== undefined
        ? {
            svg: safeInput.svg || null,
            dataUrl: safeInput.dataUrl || null,
          }
        : null;

  return Object.freeze({
    cobranca: null,
    chave_cobranca,
    imagem_qrcode: rawQrImage,
  });
}

function resolveCopyHandler(gateway) {
  const validatedGateway = assertChargeDistributionGateway(gateway);

  if (typeof validatedGateway.copyText === "function") {
    return (text) => validatedGateway.copyText(text);
  }

  if (typeof validatedGateway.copyChargeCode === "function") {
    return (text) => validatedGateway.copyChargeCode(text);
  }

  return assertChargeDistributionGateway(null, ["copyText"]);
}

function resolveDownloadHandler(gateway) {
  const validatedGateway = assertChargeDistributionGateway(gateway);

  if (typeof validatedGateway.downloadQrCodePng === "function") {
    return (payload) => validatedGateway.downloadQrCodePng(payload);
  }

  if (typeof validatedGateway.downloadQrImage === "function") {
    return (payload) => validatedGateway.downloadQrImage(payload);
  }

  return assertChargeDistributionGateway(null, ["downloadQrCodePng"]);
}

export class DistributePixChargeUseCase {
  constructor({
    chargeDistributionGateway = null,
    distributionGateway = null,
    shareGateway = null,
  } = {}) {
    this.chargeDistributionGateway =
      chargeDistributionGateway || distributionGateway || shareGateway || null;
  }

  static create(dependencies) {
    return new DistributePixChargeUseCase(dependencies);
  }

  async copyChargeCode(input = {}) {
    const copyHandler = resolveCopyHandler(this.chargeDistributionGateway);
    const { chave_cobranca } = extractChargeDistributionTarget(input);

    try {
      await copyHandler(chave_cobranca);
    } catch (error) {
      throw new PixChargeDistributionError(
        error?.message ||
          "Não foi possível copiar o código PIX para a área de transferência.",
        {
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.COPY_FAILED,
          field: "chave_cobranca",
          cause: error,
        },
      );
    }

    return Object.freeze({
      action: PIX_CHARGE_DISTRIBUTION_ACTIONS.COPY,
      copied: true,
      chave_cobranca,
    });
  }

  async shareCharge(input = {}) {
    const gateway = assertChargeDistributionGateway(
      this.chargeDistributionGateway,
    );
    const safeInput = input && typeof input === "object" ? input : {};
    const { chave_cobranca } = extractChargeDistributionTarget(input);

    const title =
      typeof safeInput.title === "string" && safeInput.title.trim()
        ? safeInput.title.trim()
        : DEFAULT_SHARE_TITLE;
    const text =
      typeof safeInput.text === "string" && safeInput.text.trim()
        ? safeInput.text.trim()
        : chave_cobranca;
    const files = Array.isArray(safeInput.files) ? safeInput.files : undefined;
    const whatsappUrl = buildWhatsAppShareUrl(text);

    const sharePayload = {
      title,
      text,
      ...(files ? { files } : {}),
    };

    const forceWhatsApp =
      safeInput.channel === PIX_CHARGE_DISTRIBUTION_CHANNELS.WHATSAPP;
    const hasNativeShare = typeof gateway.share === "function";
    const canUseNativeShare =
      !forceWhatsApp &&
      hasNativeShare &&
      (typeof gateway.canShare === "function"
        ? Boolean(await gateway.canShare(sharePayload))
        : true);

    try {
      if (canUseNativeShare) {
        await gateway.share(sharePayload);

        return Object.freeze({
          action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
          shared: true,
          channel: PIX_CHARGE_DISTRIBUTION_CHANNELS.WEB_SHARE,
          chave_cobranca,
          whatsappUrl,
        });
      }

      if (typeof gateway.shareViaWhatsApp === "function") {
        await gateway.shareViaWhatsApp({ text, url: whatsappUrl });
      } else if (typeof gateway.openExternalUrl === "function") {
        await gateway.openExternalUrl(whatsappUrl);
      } else {
        assertChargeDistributionGateway(null, ["shareViaWhatsApp"]);
      }

      return Object.freeze({
        action: PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE,
        shared: true,
        channel: PIX_CHARGE_DISTRIBUTION_CHANNELS.WHATSAPP,
        chave_cobranca,
        whatsappUrl,
      });
    } catch (error) {
      if (error instanceof PixChargeDistributionError) {
        throw error;
      }

      throw new PixChargeDistributionError(
        error?.message || "Não foi possível compartilhar a cobrança PIX.",
        {
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.SHARE_FAILED,
          field: "chave_cobranca",
          cause: error,
        },
      );
    }
  }

  async downloadQrImage(input = {}) {
    const downloadHandler = resolveDownloadHandler(
      this.chargeDistributionGateway,
    );
    const safeInput = input && typeof input === "object" ? input : {};
    const { chave_cobranca, imagem_qrcode } =
      extractChargeDistributionTarget(input);

    const fileName = normalizeQrDownloadFileName(safeInput.fileName);
    const { width, height } = normalizeQrDimensions({
      width: safeInput.width,
      height: safeInput.height,
    });

    const svg =
      imagem_qrcode && typeof imagem_qrcode.svg === "string"
        ? imagem_qrcode.svg
        : null;
    const dataUrl =
      imagem_qrcode && typeof imagem_qrcode.dataUrl === "string"
        ? imagem_qrcode.dataUrl
        : null;

    try {
      await downloadHandler({
        chave_cobranca,
        svg,
        dataUrl,
        fileName,
        width,
        height,
      });
    } catch (error) {
      throw new PixChargeDistributionError(
        error?.message || "Não foi possível salvar a imagem PNG do QR Code.",
        {
          code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.DOWNLOAD_FAILED,
          field: "imagem_qrcode",
          cause: error,
        },
      );
    }

    return Object.freeze({
      action: PIX_CHARGE_DISTRIBUTION_ACTIONS.DOWNLOAD_QR,
      downloaded: true,
      fileName,
      width,
      height,
      chave_cobranca,
    });
  }

  async execute(input = {}) {
    const safeInput = input && typeof input === "object" ? input : {};
    const action =
      typeof safeInput.action === "string"
        ? safeInput.action.trim().toUpperCase()
        : "";

    switch (action) {
      case PIX_CHARGE_DISTRIBUTION_ACTIONS.COPY:
        return this.copyChargeCode(safeInput);
      case PIX_CHARGE_DISTRIBUTION_ACTIONS.SHARE:
        return this.shareCharge(safeInput);
      case PIX_CHARGE_DISTRIBUTION_ACTIONS.DOWNLOAD_QR:
        return this.downloadQrImage(safeInput);
      default:
        throw new PixChargeDistributionError(
          "Ação de distribuição da cobrança PIX inválida (esperado COPY, SHARE ou DOWNLOAD_QR).",
          {
            code: PIX_CHARGE_DISTRIBUTION_ERROR_CODES.INVALID_DISTRIBUTION_ACTION,
            field: "action",
          },
        );
    }
  }
}

export function executeDistributePixCharge(input, dependencies) {
  return new DistributePixChargeUseCase(dependencies).execute(input);
}
