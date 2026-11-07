import { createStaticPix, hasError } from "pix-utils";
import encodeQR from "qr";
import {
  CobrancaPix,
  PIX_CHARGE_ERROR_CODES,
  PixChargeValidationError,
  normalizeAdditionalInfo,
  normalizeTransactionAmount,
  normalizeTxid,
  resolveChaveConta,
} from "../../domain/entities/pix-charge.entity.js";

function resolveActiveKeyFromRepository(pixKeyRepository) {
  if (typeof pixKeyRepository.getSelectedKey === "function") {
    return Promise.resolve(pixKeyRepository.getSelectedKey());
  }

  if (typeof pixKeyRepository.getSelectedKeyId === "function") {
    return Promise.resolve(pixKeyRepository.getSelectedKeyId()).then(
      (selectedKeyId) => {
        if (!selectedKeyId) {
          return null;
        }

        if (typeof pixKeyRepository.findById === "function") {
          return pixKeyRepository.findById(selectedKeyId);
        }

        return Promise.resolve(pixKeyRepository.findAll()).then(
          (allKeys) =>
            allKeys.find((item) => item && item.id === selectedKeyId) || null,
        );
      },
    );
  }

  return null;
}

export class GeneratePixChargeUseCase {
  constructor({
    pixKeyRepository = null,
    createStaticPixFn = createStaticPix,
    encodeQrFn = encodeQR,
  } = {}) {
    this.pixKeyRepository = pixKeyRepository;
    this.createStaticPixFn = createStaticPixFn;
    this.encodeQrFn = encodeQrFn;
  }

  static create(dependencies) {
    return new GeneratePixChargeUseCase(dependencies);
  }

  executeSync(input = {}) {
    const safeInput = input && typeof input === "object" ? input : {};
    const rawPixKey =
      safeInput.chave_conta !== undefined
        ? safeInput.chave_conta
        : safeInput.chaveConta;

    const chaveConta = resolveChaveConta(rawPixKey);

    const rawAmount =
      safeInput.valor_opcional !== undefined
        ? safeInput.valor_opcional
        : safeInput.transactionAmount;

    const { valor_opcional, valor_dinamico } =
      normalizeTransactionAmount(rawAmount);

    const txid = normalizeTxid(safeInput.txid);

    const rawInfo =
      safeInput.info_adicional !== undefined
        ? safeInput.info_adicional
        : safeInput.infoAdicional;

    const info_adicional = normalizeAdditionalInfo(rawInfo);

    const pixObject = this.createStaticPixFn({
      pixKey: chaveConta.valor_chave,
      merchantName: chaveConta.nome_recebedor,
      merchantCity: chaveConta.cidade_recebedor,
      transactionAmount: valor_dinamico ? 0 : valor_opcional,
      txid,
      ...(info_adicional ? { infoAdicional: info_adicional } : {}),
    });

    if (
      hasError(pixObject) ||
      !pixObject ||
      typeof pixObject.toBRCode !== "function"
    ) {
      throw new PixChargeValidationError(
        (pixObject && pixObject.error) ||
          "Falha ao gerar o payload da cobrança PIX.",
        {
          code: PIX_CHARGE_ERROR_CODES.CHARGE_GENERATION_FAILED,
          field: "chave_cobranca",
        },
      );
    }

    const qrOptions =
      safeInput.qrOptions && typeof safeInput.qrOptions === "object"
        ? safeInput.qrOptions
        : {};

    const brCode = pixObject.toBRCode();
    const svg = this.encodeQrFn(brCode, "svg", qrOptions);
    const dataUrl = this.encodeQrFn(brCode, "data-url", qrOptions);
    const gifBytes = this.encodeQrFn(brCode, "gif", qrOptions);

    return CobrancaPix.create({
      chave_conta: chaveConta,
      valor_opcional,
      txid,
      info_adicional,
      chave_cobranca: brCode,
      imagem_qrcode: {
        svg,
        dataUrl,
        gifBytes,
      },
      gerado_em: safeInput.gerado_em,
    });
  }

  execute(input = {}) {
    const safeInput = input && typeof input === "object" ? input : {};
    const directKey =
      safeInput.chave_conta !== undefined
        ? safeInput.chave_conta
        : safeInput.chaveConta;

    if (directKey !== undefined || !this.pixKeyRepository) {
      return this.executeSync(safeInput);
    }

    const repositoryResult = resolveActiveKeyFromRepository(
      this.pixKeyRepository,
    );

    if (repositoryResult && typeof repositoryResult.then === "function") {
      return repositoryResult.then((resolvedKey) =>
        this.executeSync({
          ...safeInput,
          chave_conta: resolvedKey,
        }),
      );
    }

    return this.executeSync({
      ...safeInput,
      chave_conta: repositoryResult,
    });
  }
}

export function executeGeneratePixCharge(input, dependencies) {
  return new GeneratePixChargeUseCase(dependencies).execute(input);
}
