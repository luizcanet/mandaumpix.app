import { describe, expect, it } from "vitest";
import { generatePixCharge, parsePixCharge } from "../../main.js";
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
} from "./pix-key.entity.js";

describe("pix-key.entity.js — Domain Constants & PixKeyValidationError (TASK-02.2.1)", () => {
  describe("PIX_KEY_TYPES", () => {
    it("should expose a frozen enum with the 5 BACEN PIX key types", () => {
      // Arrange & Act
      const types = PIX_KEY_TYPES;

      // Assert
      expect(Object.isFrozen(types)).toBe(true);
      expect(types).toEqual({
        CPF: "CPF",
        CNPJ: "CNPJ",
        EMAIL: "EMAIL",
        TELEFONE: "TELEFONE",
        EVP: "EVP",
      });
    });
  });

  describe("DEFAULT_PIX_KEY_LABELS", () => {
    it("should expose frozen default friendly account labels for each PIX key type", () => {
      // Arrange & Act
      const labels = DEFAULT_PIX_KEY_LABELS;

      // Assert
      expect(Object.isFrozen(labels)).toBe(true);
      expect(labels).toEqual({
        CPF: "Conta CPF",
        CNPJ: "Conta CNPJ",
        EMAIL: "Conta E-mail",
        TELEFONE: "Conta Celular",
        EVP: "Conta EVP",
      });
    });
  });

  describe("PIX_KEY_ERROR_CODES", () => {
    it("should expose frozen domain validation error codes", () => {
      // Arrange & Act
      const codes = PIX_KEY_ERROR_CODES;

      // Assert
      expect(Object.isFrozen(codes)).toBe(true);
      expect(codes).toEqual({
        INVALID_KEY_TYPE: "INVALID_KEY_TYPE",
        INVALID_CPF: "INVALID_CPF",
        INVALID_CNPJ: "INVALID_CNPJ",
        INVALID_EMAIL: "INVALID_EMAIL",
        INVALID_PHONE: "INVALID_PHONE",
        INVALID_EVP: "INVALID_EVP",
        INVALID_MERCHANT_NAME: "INVALID_MERCHANT_NAME",
        INVALID_MERCHANT_CITY: "INVALID_MERCHANT_CITY",
      });
    });
  });

  describe("PixKeyValidationError", () => {
    it("should instantiate an Error subclass with message, code, and field", () => {
      // Arrange
      const message = "CPF inválido informado para a chave PIX.";
      const options = {
        code: PIX_KEY_ERROR_CODES.INVALID_CPF,
        field: "valor_chave",
      };

      // Act
      const error = new PixKeyValidationError(message, options);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PixKeyValidationError);
      expect(error.name).toBe("PixKeyValidationError");
      expect(error.message).toBe(message);
      expect(error.code).toBe("INVALID_CPF");
      expect(error.field).toBe("valor_chave");
    });

    it("should provide sensible defaults when options are omitted", () => {
      // Arrange & Act
      const error = new PixKeyValidationError(
        "Falha de validação de chave PIX.",
      );

      // Assert
      expect(error.name).toBe("PixKeyValidationError");
      expect(error.message).toBe("Falha de validação de chave PIX.");
      expect(error.code).toBe("PIX_KEY_VALIDATION_ERROR");
      expect(error.field).toBeNull();
    });
  });
});

describe("pix-key.entity.js — PIX Key Validators & Normalizers (TASK-02.2.2)", () => {
  describe("validateAndNormalizeCpf", () => {
    it("should strip formatting and return 11 digits for valid CPFs", () => {
      expect(validateAndNormalizeCpf("123.456.789-09")).toBe("12345678909");
      expect(validateAndNormalizeCpf("52998224725")).toBe("52998224725");
      expect(validateAndNormalizeCpf(" 111.444.777-35 ")).toBe("11144477735");
    });

    it.each([
      [null],
      [undefined],
      [""],
      ["123456789"],
      ["123456789012"],
      ["000.000.000-00"],
      ["111.111.111-11"],
      ["99999999999"],
      ["123.456.789-19"],
      ["123.456.789-00"],
    ])("should throw INVALID_CPF for invalid CPF input: %s", (invalidInput) => {
      expect(() => validateAndNormalizeCpf(invalidInput)).toThrowError(
        expect.objectContaining({
          name: "PixKeyValidationError",
          code: PIX_KEY_ERROR_CODES.INVALID_CPF,
          field: "valor_chave",
        }),
      );
    });
  });

  describe("validateAndNormalizeCnpj", () => {
    it("should strip formatting and return 14 digits for valid CNPJs", () => {
      expect(validateAndNormalizeCnpj("11.222.333/0001-81")).toBe(
        "11222333000181",
      );
      expect(validateAndNormalizeCnpj("11444777000161")).toBe("11444777000161");
      expect(validateAndNormalizeCnpj("00.360.305/0001-04")).toBe(
        "00360305000104",
      );
    });

    it.each([
      [null],
      [undefined],
      [""],
      ["1122233300018"],
      ["112223330001819"],
      ["00.000.000/0000-00"],
      ["11.111.111/1111-11"],
      ["11.222.333/0001-91"],
      ["11.222.333/0001-89"],
    ])(
      "should throw INVALID_CNPJ for invalid CNPJ input: %s",
      (invalidInput) => {
        expect(() => validateAndNormalizeCnpj(invalidInput)).toThrowError(
          expect.objectContaining({
            name: "PixKeyValidationError",
            code: PIX_KEY_ERROR_CODES.INVALID_CNPJ,
            field: "valor_chave",
          }),
        );
      },
    );
  });

  describe("validateAndNormalizeEmail", () => {
    it("should trim, lowercase and validate a standard email up to 77 chars", () => {
      expect(validateAndNormalizeEmail("  Contato@MandaUmPix.APP  ")).toBe(
        "contato@mandaumpix.app",
      );

      const max77Email = `${"a".repeat(62)}@exemplo.com.br`; // 62 + 15 = 77 chars
      expect(max77Email.length).toBe(77);
      expect(validateAndNormalizeEmail(max77Email)).toBe(max77Email);
    });

    it.each([
      [null],
      [undefined],
      [""],
      ["   "],
      ["email-sem-arroba.com"],
      ["@dominio.com"],
      ["usuario@"],
      ["usuario@dominio"],
      ["usuario com espaco@dominio.com"],
      [`${"a".repeat(63)}@exemplo.com.br`], // 78 chars (> 77 BACEN limit)
    ])(
      "should throw INVALID_EMAIL for invalid email input: %s",
      (invalidInput) => {
        expect(() => validateAndNormalizeEmail(invalidInput)).toThrowError(
          expect.objectContaining({
            name: "PixKeyValidationError",
            code: PIX_KEY_ERROR_CODES.INVALID_EMAIL,
            field: "valor_chave",
          }),
        );
      },
    );
  });

  describe("validateAndNormalizePhone", () => {
    it("should normalize valid Brazilian mobile phone numbers to E.164 (+55DDD9XXXXXXXX)", () => {
      expect(validateAndNormalizePhone("+5511987654321")).toBe(
        "+5511987654321",
      );
      expect(validateAndNormalizePhone("+55 (61) 99988-7766")).toBe(
        "+5561999887766",
      );
      expect(validateAndNormalizePhone("(11) 98765-4321")).toBe(
        "+5511987654321",
      );
      expect(validateAndNormalizePhone("21998765432")).toBe("+5521998765432");
      expect(validateAndNormalizePhone("5521998765432")).toBe("+5521998765432");
    });

    it.each([
      [null],
      [undefined],
      [""],
      ["+551187654321"], // 8-digit landline without leading 9
      ["+5501987654321"], // invalid DDD starting with 0
      ["+5510987654321"], // invalid DDD ending with 0 (10)
      ["+14155552671"], // non-BR country code
      ["123456"],
    ])(
      "should throw INVALID_PHONE for invalid phone input: %s",
      (invalidInput) => {
        expect(() => validateAndNormalizePhone(invalidInput)).toThrowError(
          expect.objectContaining({
            name: "PixKeyValidationError",
            code: PIX_KEY_ERROR_CODES.INVALID_PHONE,
            field: "valor_chave",
          }),
        );
      },
    );
  });

  describe("validateAndNormalizeEvp", () => {
    it("should trim, lowercase and validate a canonical UUID v4 EVP key", () => {
      expect(
        validateAndNormalizeEvp("  123E4567-E89B-42D3-A456-556642440000  "),
      ).toBe("123e4567-e89b-42d3-a456-556642440000");
    });

    it.each([
      [null],
      [undefined],
      [""],
      ["123e4567-e89b-12d3-a456-556642440000"], // UUID v1 instead of v4
      ["123e4567-e89b-42d3-c456-556642440000"], // invalid RFC 4122 variant
      ["123e4567e89b42d3a456556642440000"], // missing hyphens
      ["chave-aleatoria-invalida"],
    ])("should throw INVALID_EVP for invalid EVP input: %s", (invalidInput) => {
      expect(() => validateAndNormalizeEvp(invalidInput)).toThrowError(
        expect.objectContaining({
          name: "PixKeyValidationError",
          code: PIX_KEY_ERROR_CODES.INVALID_EVP,
          field: "valor_chave",
        }),
      );
    });
  });

  describe("validateAndNormalizePixKey", () => {
    it("should dispatch validation by PIX key type and return normalized type and value", () => {
      expect(
        validateAndNormalizePixKey(PIX_KEY_TYPES.CPF, "123.456.789-09"),
      ).toEqual({
        tipo_chave: "CPF",
        valor_chave: "12345678909",
      });

      expect(validateAndNormalizePixKey("cnpj", "11.222.333/0001-81")).toEqual({
        tipo_chave: "CNPJ",
        valor_chave: "11222333000181",
      });

      expect(validateAndNormalizePixKey("EMAIL", " Eu@LuizCa.Net ")).toEqual({
        tipo_chave: "EMAIL",
        valor_chave: "eu@luizca.net",
      });

      expect(validateAndNormalizePixKey("TELEFONE", "(61) 99988-7766")).toEqual(
        {
          tipo_chave: "TELEFONE",
          valor_chave: "+5561999887766",
        },
      );

      expect(
        validateAndNormalizePixKey(
          "EVP",
          "123E4567-E89B-42D3-A456-556642440000",
        ),
      ).toEqual({
        tipo_chave: "EVP",
        valor_chave: "123e4567-e89b-42d3-a456-556642440000",
      });
    });

    it.each([[null], [undefined], [""], ["INVALIDO"], ["RG"]])(
      "should throw INVALID_KEY_TYPE when tipo_chave is unsupported: %s",
      (invalidType) => {
        expect(() =>
          validateAndNormalizePixKey(invalidType, "12345678909"),
        ).toThrowError(
          expect.objectContaining({
            name: "PixKeyValidationError",
            code: PIX_KEY_ERROR_CODES.INVALID_KEY_TYPE,
            field: "tipo_chave",
          }),
        );
      },
    );
  });
});

describe("pix-key.entity.js — EMV Normalizers (TASK-02.2.3)", () => {
  describe("normalizeMerchantName", () => {
    it("should remove accents, symbols, collapse spaces, uppercase and truncate to 25 chars", () => {
      expect(normalizeMerchantName("Luiz Henrique Canet Filho")).toBe(
        "LUIZ HENRIQUE CANET FILHO",
      );
      expect(
        normalizeMerchantName("  João   da Silva   Júnior & Cia Ltda  "),
      ).toBe("JOAO DA SILVA JUNIOR CIA");
      expect(normalizeMerchantName("Açaí & Café São-Paulo 123!")).toBe(
        "ACAI CAFE SAOPAULO 123",
      );
    });

    it.each([[null], [undefined], [""], ["   "], ["!@#$%^&*()"]])(
      "should throw INVALID_MERCHANT_NAME when merchant name is empty after sanitization: %s",
      (invalidName) => {
        expect(() => normalizeMerchantName(invalidName)).toThrowError(
          expect.objectContaining({
            name: "PixKeyValidationError",
            code: PIX_KEY_ERROR_CODES.INVALID_MERCHANT_NAME,
            field: "nome_recebedor",
          }),
        );
      },
    );
  });

  describe("normalizeMerchantCity", () => {
    it("should remove accents, symbols, collapse spaces, uppercase and truncate to 15 chars", () => {
      expect(normalizeMerchantCity("Brasília")).toBe("BRASILIA");
      expect(normalizeMerchantCity("  São Bernardo do Campo ")).toBe(
        "SAO BERNARDO DO",
      );
      expect(normalizeMerchantCity("São José dos Campos")).toBe(
        "SAO JOSE DOS CA",
      );
    });

    it.each([[null], [undefined], [""], ["   "], ["***"]])(
      "should throw INVALID_MERCHANT_CITY when merchant city is empty after sanitization: %s",
      (invalidCity) => {
        expect(() => normalizeMerchantCity(invalidCity)).toThrowError(
          expect.objectContaining({
            name: "PixKeyValidationError",
            code: PIX_KEY_ERROR_CODES.INVALID_MERCHANT_CITY,
            field: "cidade_recebedor",
          }),
        );
      },
    );
  });
});

describe("pix-key.entity.js — ChaveConta Entity (TASK-02.2.4)", () => {
  it("should create a frozen ChaveConta instance normalizing CPF, holder and city", () => {
    // Arrange
    const rawProps = {
      id: "  key-cpf-01  ",
      rotulo: "  Nubank   Pessoal  ",
      tipo_chave: "CPF",
      valor_chave: "123.456.789-09",
      nome_recebedor: "Luiz Henrique Canet Filho",
      cidade_recebedor: "Brasília",
      criado_em: "2026-11-07T15:00:00.000Z",
    };

    // Act
    const entity = ChaveConta.create(rawProps);

    // Assert
    expect(entity).toBeInstanceOf(ChaveConta);
    expect(PixKeyEntity).toBe(ChaveConta);
    expect(Object.isFrozen(entity)).toBe(true);
    expect(entity.id).toBe("key-cpf-01");
    expect(entity.rotulo).toBe("Nubank Pessoal");
    expect(entity.tipo_chave).toBe("CPF");
    expect(entity.valor_chave).toBe("12345678909");
    expect(entity.nome_recebedor).toBe("LUIZ HENRIQUE CANET FILHO");
    expect(entity.cidade_recebedor).toBe("BRASILIA");
    expect(entity.criado_em).toBe("2026-11-07T15:00:00.000Z");
  });

  it("should auto-generate id, default rotulo by key type, and ISO criado_em when omitted or invalid", () => {
    // Arrange & Act
    const entity = ChaveConta.create({
      tipo_chave: "EMAIL",
      valor_chave: "  Contato@MandaUmPix.APP ",
      nome_recebedor: "João da Silva Júnior & Cia Comércio",
      cidade_recebedor: "São Bernardo do Campo",
      rotulo: "   ",
      criado_em: "data-invalida",
    });

    // Assert
    expect(entity.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(entity.rotulo).toBe("Conta E-mail");
    expect(entity.valor_chave).toBe("contato@mandaumpix.app");
    expect(entity.nome_recebedor).toBe("JOAO DA SILVA JUNIOR CIA");
    expect(entity.cidade_recebedor).toBe("SAO BERNARDO DO");
    expect(() => new Date(entity.criado_em).toISOString()).not.toThrow();
  });

  it("should truncate rotulo to at most 40 characters", () => {
    // Arrange
    const longLabel = "Conta Empresarial Principal de Recebimentos PIX 2026";

    // Act
    const entity = ChaveConta.create({
      tipo_chave: "CNPJ",
      valor_chave: "11.222.333/0001-81",
      nome_recebedor: "Empresa Exemplo",
      cidade_recebedor: "Sao Paulo",
      rotulo: longLabel,
    });

    // Assert
    expect(entity.rotulo.length).toBeLessThanOrEqual(40);
    expect(entity.rotulo).toBe("Conta Empresarial Principal de Recebimen");
  });

  it("should serialize to plain object via toJSON() and reconstruct via fromJSON()", () => {
    // Arrange
    const original = ChaveConta.create({
      id: "k-phone-1",
      rotulo: "Inter Celular",
      tipo_chave: "TELEFONE",
      valor_chave: "(61) 99988-7766",
      nome_recebedor: "Luiz Canet",
      cidade_recebedor: "Brasília",
      criado_em: "2026-11-07T18:00:00.000Z",
    });

    // Act
    const json = original.toJSON();
    const restored = ChaveConta.fromJSON(json);

    // Assert
    expect(json).toEqual({
      id: "k-phone-1",
      rotulo: "Inter Celular",
      tipo_chave: "TELEFONE",
      valor_chave: "+5561999887766",
      nome_recebedor: "LUIZ CANET",
      cidade_recebedor: "BRASILIA",
      criado_em: "2026-11-07T18:00:00.000Z",
    });
    expect(restored).toBeInstanceOf(ChaveConta);
    expect(restored.toJSON()).toEqual(json);
  });

  it("should throw PixKeyValidationError when instantiated without arguments", () => {
    expect(() => new ChaveConta()).toThrowError(PixKeyValidationError);
    expect(() => ChaveConta.create(null)).toThrowError(PixKeyValidationError);
  });

  it("should integrate seamlessly with generatePixCharge and parsePixCharge", () => {
    // Arrange
    const chaveConta = ChaveConta.create({
      tipo_chave: "EVP",
      valor_chave: "123E4567-E89B-42D3-A456-556642440000",
      nome_recebedor: "João da Silva Júnior & Cia Comércio",
      cidade_recebedor: "São José dos Campos",
    });

    // Act
    const charge = generatePixCharge({
      pixKey: chaveConta.valor_chave,
      merchantName: chaveConta.nome_recebedor,
      merchantCity: chaveConta.cidade_recebedor,
      transactionAmount: 99.9,
    });
    const parsed = parsePixCharge(charge.brCode);

    // Assert
    expect(parsed.isStatic).toBe(true);
    expect(parsed.parsed.pixKey).toBe("123e4567-e89b-42d3-a456-556642440000");
    expect(parsed.parsed.merchantName).toBe("JOAO DA SILVA JUNIOR CIA");
    expect(parsed.parsed.merchantCity).toBe("SAO JOSE DOS CA");
    expect(parsed.parsed.transactionAmount).toBe(99.9);
  });
});
