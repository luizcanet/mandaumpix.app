import { describe, expect, it } from "vitest";
import { generatePixCharge } from "../../main.js";
import { ChaveConta, PIX_KEY_TYPES } from "./pix-key.entity.js";
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
} from "./pix-charge.entity.js";

describe("pix-charge.entity.js — Domain Constants, Errors & Sanitizers (TASK-02.3.1)", () => {
  describe("Domain Constants & PIX_CHARGE_ERROR_CODES", () => {
    it("should expose frozen domain constants and error codes for PIX charges", () => {
      // Arrange & Act
      const codes = PIX_CHARGE_ERROR_CODES;

      // Assert
      expect(DEFAULT_PIX_CHARGE_TXID).toBe("***");
      expect(MAX_PIX_CHARGE_AMOUNT).toBe(999999999.99);
      expect(MAX_PIX_CHARGE_TXID_LENGTH).toBe(25);
      expect(MAX_PIX_CHARGE_ADDITIONAL_INFO_LENGTH).toBe(72);
      expect(Object.isFrozen(codes)).toBe(true);
      expect(codes).toEqual({
        MISSING_PIX_KEY: "MISSING_PIX_KEY",
        INVALID_PIX_KEY: "INVALID_PIX_KEY",
        INVALID_AMOUNT: "INVALID_AMOUNT",
        INVALID_TXID: "INVALID_TXID",
        INVALID_ADDITIONAL_INFO: "INVALID_ADDITIONAL_INFO",
        INVALID_BR_CODE: "INVALID_BR_CODE",
        INVALID_QR_CODE: "INVALID_QR_CODE",
        CHARGE_GENERATION_FAILED: "CHARGE_GENERATION_FAILED",
      });
    });
  });

  describe("PixChargeValidationError", () => {
    it("should instantiate an Error subclass with message, code, and field", () => {
      // Arrange
      const message = "Valor da cobrança PIX inválido.";
      const options = {
        code: PIX_CHARGE_ERROR_CODES.INVALID_AMOUNT,
        field: "valor_opcional",
      };

      // Act
      const error = new PixChargeValidationError(message, options);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PixChargeValidationError);
      expect(error.name).toBe("PixChargeValidationError");
      expect(error.message).toBe(message);
      expect(error.code).toBe("INVALID_AMOUNT");
      expect(error.field).toBe("valor_opcional");
    });

    it("should provide default code and null field when options are omitted", () => {
      // Arrange & Act
      const error = new PixChargeValidationError(
        "Falha de validação na cobrança PIX.",
      );

      // Assert
      expect(error.name).toBe("PixChargeValidationError");
      expect(error.message).toBe("Falha de validação na cobrança PIX.");
      expect(error.code).toBe("PIX_CHARGE_VALIDATION_ERROR");
      expect(error.field).toBeNull();
    });
  });

  describe("normalizeTransactionAmount (RN03)", () => {
    it.each([
      [undefined],
      [null],
      [""],
      ["   "],
      [0],
      ["0"],
      ["0,00"],
      ["0.00"],
      ["R$ 0,00"],
      [" R$ 0 "],
    ])(
      "should return dynamic/open amount (valor_opcional = null, valor_dinamico = true) for %p",
      (rawAmount) => {
        // Act
        const result = normalizeTransactionAmount(rawAmount);

        // Assert
        expect(result).toEqual({
          valor_opcional: null,
          valor_dinamico: true,
        });
      },
    );

    it.each([
      [25, 25],
      [42.5, 42.5],
      [0.01, 0.01],
      [19.999, 20],
      [10.555, 10.56],
      [999999999.99, 999999999.99],
      ["25", 25],
      ["42.5", 42.5],
      ["42.50", 42.5],
      ["42,50", 42.5],
      ["R$ 42,50", 42.5],
      ["R$ 1.234,56", 1234.56],
      ["1.234.567,89", 1234567.89],
      [" 99,90 ", 99.9],
    ])(
      "should normalize fixed positive amount %p to { valor_opcional: %p, valor_dinamico: false }",
      (rawAmount, expectedAmount) => {
        // Act
        const result = normalizeTransactionAmount(rawAmount);

        // Assert
        expect(result).toEqual({
          valor_opcional: expectedAmount,
          valor_dinamico: false,
        });
      },
    );

    it.each([
      [-0.01],
      [-10],
      ["-10"],
      ["-10,50"],
      ["R$ -5,00"],
      [0.001],
      ["0,001"],
      [Number.NaN],
      [Number.POSITIVE_INFINITY],
      [Number.NEGATIVE_INFINITY],
      [1000000000],
      ["1000000000.00"],
      ["abc"],
      ["R$"],
      ["12,34,56"],
      ["12.34.56"],
      [true],
      [false],
      [{}],
      [[]],
    ])(
      "should throw PixChargeValidationError (INVALID_AMOUNT) for invalid amount %p",
      (invalidAmount) => {
        expect(() => normalizeTransactionAmount(invalidAmount)).toThrowError(
          expect.objectContaining({
            name: "PixChargeValidationError",
            code: PIX_CHARGE_ERROR_CODES.INVALID_AMOUNT,
            field: "valor_opcional",
          }),
        );
      },
    );
  });

  describe("normalizeTxid", () => {
    it.each([[undefined], [null], [""], ["   "], ["***"], [" *** "]])(
      "should default to '***' when txid is %p",
      (rawTxid) => {
        expect(normalizeTxid(rawTxid)).toBe("***");
      },
    );

    it.each([
      ["PEDIDO123", "PEDIDO123"],
      ["  Abc123XYZ  ", "Abc123XYZ"],
      ["A", "A"],
      ["1234567890123456789012345", "1234567890123456789012345"],
    ])(
      "should accept valid alphanumeric txid %p as %p",
      (rawTxid, expected) => {
        expect(normalizeTxid(rawTxid)).toBe(expected);
      },
    );

    it.each([
      ["PEDIDO-123"],
      ["PEDIDO_123"],
      ["PEDIDO 123"],
      ["PEDIDO#1"],
      ["***1"],
      ["12345678901234567890123456"], // 26 chars (> 25)
      [12345],
      [{}],
    ])(
      "should throw PixChargeValidationError (INVALID_TXID) for invalid txid %p",
      (invalidTxid) => {
        expect(() => normalizeTxid(invalidTxid)).toThrowError(
          expect.objectContaining({
            name: "PixChargeValidationError",
            code: PIX_CHARGE_ERROR_CODES.INVALID_TXID,
            field: "txid",
          }),
        );
      },
    );
  });

  describe("normalizeAdditionalInfo", () => {
    it.each([[undefined], [null], [""], ["   "]])(
      "should return null when infoAdicional is %p",
      (rawInfo) => {
        expect(normalizeAdditionalInfo(rawInfo)).toBeNull();
      },
    );

    it("should normalize diacritics, collapse spaces, and trim valid additional info", () => {
      expect(normalizeAdditionalInfo("  Serviço de   manutenção  ")).toBe(
        "Servico de manutencao",
      );
    });

    it.each([["A".repeat(73)], [123], [true], [{}]])(
      "should throw PixChargeValidationError (INVALID_ADDITIONAL_INFO) for %p",
      (invalidInfo) => {
        expect(() => normalizeAdditionalInfo(invalidInfo)).toThrowError(
          expect.objectContaining({
            name: "PixChargeValidationError",
            code: PIX_CHARGE_ERROR_CODES.INVALID_ADDITIONAL_INFO,
            field: "info_adicional",
          }),
        );
      },
    );
  });
});

describe("pix-charge.entity.js — Immutable CobrancaPix Entity (TASK-02.3.2)", () => {
  const samplePixKey = ChaveConta.create({
    id: "key-email-01",
    rotulo: "Conta Principal",
    tipo_chave: PIX_KEY_TYPES.EMAIL,
    valor_chave: "eu@luizca.net",
    nome_recebedor: "Luiz Henrique Canet Filho",
    cidade_recebedor: "Brasília",
    criado_em: "2026-11-07T16:00:00.000Z",
  });

  const sampleGenerated = generatePixCharge({
    pixKey: samplePixKey.valor_chave,
    merchantName: samplePixKey.nome_recebedor,
    merchantCity: samplePixKey.cidade_recebedor,
    transactionAmount: 42.5,
  });

  it("should alias PixChargeEntity to CobrancaPix", () => {
    expect(PixChargeEntity).toBe(CobrancaPix);
  });

  it("should create an immutable CobrancaPix with a fixed amount (RN02, RN03, RN04)", () => {
    // Arrange
    const props = {
      chave_conta: samplePixKey,
      valor_opcional: "R$ 42,50",
      txid: "PEDIDO42",
      info_adicional: "Serviço prestado",
      chave_cobranca: sampleGenerated.brCode,
      imagem_qrcode: {
        svg: sampleGenerated.qrSvg,
        dataUrl: sampleGenerated.qrDataUrl,
        gifBytes: sampleGenerated.qrGifBytes,
      },
      gerado_em: "2026-11-07T16:30:00.000Z",
    };

    // Act
    const charge = CobrancaPix.create(props);

    // Assert
    expect(charge).toBeInstanceOf(CobrancaPix);
    expect(Object.isFrozen(charge)).toBe(true);
    expect(Object.isFrozen(charge.imagem_qrcode)).toBe(true);
    expect(charge.id_chave_conta).toBe("key-email-01");
    expect(charge.chave_conta).toBe(samplePixKey);
    expect(charge.valor_opcional).toBe(42.5);
    expect(charge.valor_dinamico).toBe(false);
    expect(charge.txid).toBe("PEDIDO42");
    expect(charge.info_adicional).toBe("Servico prestado");
    expect(charge.chave_cobranca).toBe(sampleGenerated.brCode);
    expect(charge.imagem_qrcode).toEqual({
      svg: sampleGenerated.qrSvg,
      dataUrl: sampleGenerated.qrDataUrl,
      gifBytes: sampleGenerated.qrGifBytes,
    });
    expect(charge.gerado_em).toBe("2026-11-07T16:30:00.000Z");

    expect(() => {
      charge.valor_opcional = 100;
    }).toThrow(TypeError);
    expect(() => {
      charge.imagem_qrcode.svg = "<svg></svg>";
    }).toThrow(TypeError);
  });

  it("should create a CobrancaPix with dynamic/open amount when valor_opcional is omitted or 0 (RN03)", () => {
    // Arrange
    const openGenerated = generatePixCharge({
      pixKey: samplePixKey.valor_chave,
      merchantName: samplePixKey.nome_recebedor,
      merchantCity: samplePixKey.cidade_recebedor,
      transactionAmount: 0,
    });

    // Act
    const charge = CobrancaPix.create({
      chaveConta: samplePixKey.toJSON(),
      brCode: openGenerated.brCode,
      qrSvg: openGenerated.qrSvg,
      qrDataUrl: openGenerated.qrDataUrl,
    });

    // Assert
    expect(charge.id_chave_conta).toBe("key-email-01");
    expect(charge.chave_conta).toBeInstanceOf(ChaveConta);
    expect(charge.valor_opcional).toBeNull();
    expect(charge.valor_dinamico).toBe(true);
    expect(charge.txid).toBe("***");
    expect(charge.info_adicional).toBeNull();
    expect(charge.chave_cobranca).toBe(openGenerated.brCode);
    expect(charge.imagem_qrcode).toEqual({
      svg: openGenerated.qrSvg,
      dataUrl: openGenerated.qrDataUrl,
      gifBytes: null,
    });
    expect(Number.isNaN(Date.parse(charge.gerado_em))).toBe(false);
  });

  it("should fallback to current ISO timestamp when gerado_em is invalid or empty, and support round-trip JSON serialization", () => {
    // Arrange & Act
    const charge = new CobrancaPix({
      chave_conta: samplePixKey,
      transactionAmount: 15,
      infoAdicional: "Teste",
      chave_cobranca: sampleGenerated.brCode,
      imagemQrCode: {
        svg: sampleGenerated.qrSvg,
        dataUrl: sampleGenerated.qrDataUrl,
        gifBytes: sampleGenerated.qrGifBytes,
      },
      gerado_em: "invalid-timestamp",
    });

    const json = charge.toJSON();
    const rehydrated = CobrancaPix.fromJSON(json);

    // Assert
    expect(Number.isNaN(Date.parse(charge.gerado_em))).toBe(false);
    expect(rehydrated).toBeInstanceOf(CobrancaPix);
    expect(rehydrated.toJSON()).toEqual(json);
    expect(rehydrated).not.toBe(charge);
  });

  it.each([[undefined], [null], [""], [123], [true]])(
    "should throw PixChargeValidationError (MISSING_PIX_KEY) when chave_conta is %p (RN02)",
    (missingKey) => {
      expect(
        () =>
          new CobrancaPix({
            chave_conta: missingKey,
            chave_cobranca: sampleGenerated.brCode,
            imagem_qrcode: {
              svg: sampleGenerated.qrSvg,
              dataUrl: sampleGenerated.qrDataUrl,
            },
          }),
      ).toThrowError(
        expect.objectContaining({
          name: "PixChargeValidationError",
          code: PIX_CHARGE_ERROR_CODES.MISSING_PIX_KEY,
          field: "chave_conta",
        }),
      );
    },
  );

  it("should throw PixChargeValidationError (INVALID_PIX_KEY) when plain chave_conta object fails ChaveConta validation", () => {
    expect(() =>
      CobrancaPix.create({
        chave_conta: {
          tipo_chave: "CPF",
          valor_chave: "000.000.000-00",
          nome_recebedor: "Fulano",
          cidade_recebedor: "Brasilia",
        },
        chave_cobranca: sampleGenerated.brCode,
        imagem_qrcode: {
          svg: sampleGenerated.qrSvg,
          dataUrl: sampleGenerated.qrDataUrl,
        },
      }),
    ).toThrowError(
      expect.objectContaining({
        name: "PixChargeValidationError",
        code: PIX_CHARGE_ERROR_CODES.INVALID_PIX_KEY,
        field: "chave_conta",
      }),
    );
  });

  it.each([
    [undefined],
    [null],
    [""],
    ["   "],
    ["INVALID_BR_CODE"],
    ["00020126350014br.gov.bcb.pix6304ZZZZ"],
    [12345],
  ])(
    "should throw PixChargeValidationError (INVALID_BR_CODE) when chave_cobranca is %p (RN04)",
    (invalidBrCode) => {
      expect(() =>
        CobrancaPix.create({
          chave_conta: samplePixKey,
          chave_cobranca: invalidBrCode,
          imagem_qrcode: {
            svg: sampleGenerated.qrSvg,
            dataUrl: sampleGenerated.qrDataUrl,
          },
        }),
      ).toThrowError(
        expect.objectContaining({
          name: "PixChargeValidationError",
          code: PIX_CHARGE_ERROR_CODES.INVALID_BR_CODE,
          field: "chave_cobranca",
        }),
      );
    },
  );

  it.each([
    [undefined],
    [null],
    ["not-an-object"],
    [{}],
    [{ svg: "", dataUrl: sampleGenerated.qrDataUrl }],
    [{ svg: "<div>not svg</div>", dataUrl: sampleGenerated.qrDataUrl }],
    [{ svg: sampleGenerated.qrSvg, dataUrl: "" }],
    [{ svg: sampleGenerated.qrSvg, dataUrl: "https://example.com/qr.png" }],
    [
      {
        svg: sampleGenerated.qrSvg,
        dataUrl: sampleGenerated.qrDataUrl,
        gifBytes: "invalid-bytes",
      },
    ],
  ])(
    "should throw PixChargeValidationError (INVALID_QR_CODE) when imagem_qrcode is %p (RN04)",
    (invalidQrCode) => {
      expect(() =>
        CobrancaPix.create({
          chave_conta: samplePixKey,
          chave_cobranca: sampleGenerated.brCode,
          imagem_qrcode: invalidQrCode,
        }),
      ).toThrowError(
        expect.objectContaining({
          name: "PixChargeValidationError",
          code: PIX_CHARGE_ERROR_CODES.INVALID_QR_CODE,
          field: "imagem_qrcode",
        }),
      );
    },
  );

  it("should handle undefined/non-object props by throwing MISSING_PIX_KEY", () => {
    expect(() => new CobrancaPix()).toThrowError(
      expect.objectContaining({
        code: PIX_CHARGE_ERROR_CODES.MISSING_PIX_KEY,
        field: "chave_conta",
      }),
    );
    expect(() => new CobrancaPix(null)).toThrowError(
      expect.objectContaining({
        code: PIX_CHARGE_ERROR_CODES.MISSING_PIX_KEY,
        field: "chave_conta",
      }),
    );
  });
});
