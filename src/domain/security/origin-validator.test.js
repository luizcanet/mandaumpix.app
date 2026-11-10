import { afterEach, describe, expect, it } from "vitest";
import {
  CANONICAL_ORIGINS,
  CANONICAL_PRODUCTION_ORIGIN,
  OFFICIAL_DOMAIN,
  OFFICIAL_ORIGIN_BADGE_LABEL,
  SECURITY_ALERT_MESSAGE,
  ZERO_CREDENTIAL_MESSAGE,
  getCanonicalOrigins,
  isCanonicalOrigin,
  isLocalOrigin,
  isOfficialOrigin,
  isProductionOrigin,
  normalizeOrigin,
  validateOrigin,
} from "./origin-validator.js";

describe("origin-validator.js — Validação de Origem Canônica e UX Defensiva (TASK-08.2.1 / US-08.2)", () => {
  describe("Constantes de Segurança de Domínio", () => {
    it("deve exportar a origem canônica de produção oficial", () => {
      expect(CANONICAL_PRODUCTION_ORIGIN).toBe("https://mandaumpix.app");
    });

    it("deve exportar o domínio canônico oficial", () => {
      expect(OFFICIAL_DOMAIN).toBe("mandaumpix.app");
    });

    it("deve exportar a lista congelada de origens canônicas permitidas", () => {
      expect(Object.isFrozen(CANONICAL_ORIGINS)).toBe(true);
      expect(CANONICAL_ORIGINS).toContain("https://mandaumpix.app");
      expect(CANONICAL_ORIGINS).toContain("https://stg.mandaumpix.app");
      expect(CANONICAL_ORIGINS).toContain("https://dev.mandaumpix.app");
      expect(CANONICAL_ORIGINS).toContain("http://localhost:5776");
      expect(CANONICAL_ORIGINS).toContain("http://localhost:6006");
    });

    it("deve retornar uma cópia defensiva da lista de origens canônicas através de getCanonicalOrigins", () => {
      const origins = getCanonicalOrigins();
      expect(origins).toEqual([...CANONICAL_ORIGINS]);
      expect(origins).not.toBe(CANONICAL_ORIGINS);
    });

    it("deve exportar mensagens padronizadas de alerta e arquitetura Zero-Credential", () => {
      expect(SECURITY_ALERT_MESSAGE).toBe(
        "Atenção: Este não é o endereço oficial do Manda um PIX. Acesse com segurança em mandaumpix.app",
      );
      expect(ZERO_CREDENTIAL_MESSAGE).toBe(
        "O Manda um PIX nunca solicita senhas bancárias, dados de cartão ou códigos de verificação.",
      );
      expect(OFFICIAL_ORIGIN_BADGE_LABEL).toBe(
        "Origem Oficial: mandaumpix.app",
      );
    });
  });

  describe("normalizeOrigin", () => {
    it("deve normalizar URLs completas extraindo apenas origin em caixa baixa sem barras finais", () => {
      expect(normalizeOrigin("https://mandaumpix.app/")).toBe(
        "https://mandaumpix.app",
      );
      expect(normalizeOrigin("https://MANDAUMPIX.APP/sobre")).toBe(
        "https://mandaumpix.app",
      );
      expect(normalizeOrigin("   https://stg.mandaumpix.app/chaves   ")).toBe(
        "https://stg.mandaumpix.app",
      );
      expect(normalizeOrigin("http://localhost:5776/")).toBe(
        "http://localhost:5776",
      );
    });

    it("deve retornar string vazia para valores não-string ou nulos", () => {
      expect(normalizeOrigin(null)).toBe("");
      expect(normalizeOrigin(undefined)).toBe("");
      expect(normalizeOrigin(123)).toBe("");
      expect(normalizeOrigin({})).toBe("");
      expect(normalizeOrigin("   ")).toBe("");
    });

    it("deve tratar entradas malformadas de forma resiliente", () => {
      expect(normalizeOrigin("invalid-url-string")).toBe("invalid-url-string");
    });
  });

  describe("isLocalOrigin", () => {
    it("deve reconhecer localhost e 127.0.0.1 em qualquer porta HTTP/HTTPS", () => {
      expect(isLocalOrigin("http://localhost:5776")).toBe(true);
      expect(isLocalOrigin("http://localhost:6006")).toBe(true);
      expect(isLocalOrigin("http://localhost:3000")).toBe(true);
      expect(isLocalOrigin("http://localhost")).toBe(true);
      expect(isLocalOrigin("https://localhost:8443")).toBe(true);
      expect(isLocalOrigin("http://127.0.0.1:5776")).toBe(true);
      expect(isLocalOrigin("http://127.0.0.1")).toBe(true);
    });

    it("deve rejeitar domínios que tentam enganar com subdomínios ou sufixos de localhost", () => {
      expect(isLocalOrigin("http://localhost.attacker.com")).toBe(false);
      expect(isLocalOrigin("http://fake-localhost:5776")).toBe(false);
      expect(isLocalOrigin("http://127.0.0.1.attacker.com")).toBe(false);
      expect(isLocalOrigin("https://mandaumpix.app")).toBe(false);
      expect(isLocalOrigin("")).toBe(false);
      expect(isLocalOrigin(null)).toBe(false);
    });
  });

  describe("isCanonicalOrigin & isOfficialOrigin (INV-01)", () => {
    it("deve validar positivamente as origens canônicas oficiais de produção, staging e dev", () => {
      expect(isCanonicalOrigin("https://mandaumpix.app")).toBe(true);
      expect(isCanonicalOrigin("https://stg.mandaumpix.app")).toBe(true);
      expect(isCanonicalOrigin("https://dev.mandaumpix.app")).toBe(true);
      expect(isOfficialOrigin("https://mandaumpix.app")).toBe(true);
    });

    it("deve validar positivamente origens locais de teste e desenvolvimento", () => {
      expect(isCanonicalOrigin("http://localhost:5776")).toBe(true);
      expect(isCanonicalOrigin("http://localhost:6006")).toBe(true);
      expect(isCanonicalOrigin("http://localhost:3000")).toBe(true);
      expect(isCanonicalOrigin("http://127.0.0.1:5776")).toBe(true);
      expect(isOfficialOrigin("http://localhost:5776")).toBe(true);
    });

    it("deve rejeitar origens locais quando allowLocal for explicitamente falso", () => {
      expect(
        isCanonicalOrigin("http://localhost:5776", { allowLocal: false }),
      ).toBe(false);
      expect(
        isCanonicalOrigin("https://mandaumpix.app", { allowLocal: false }),
      ).toBe(true);
    });

    it("deve rejeitar réplicas maliciosas, typosquatting e phishing", () => {
      expect(isCanonicalOrigin("https://manda-um-pix.online")).toBe(false);
      expect(isCanonicalOrigin("https://mandaumpix.com")).toBe(false);
      expect(isCanonicalOrigin("https://mandaumpix.app.malicious.net")).toBe(
        false,
      );
      expect(isCanonicalOrigin("http://mandaumpix.app")).toBe(false);
      expect(isCanonicalOrigin("https://mandaumpix.fake.app")).toBe(false);
      expect(isCanonicalOrigin("https://pixmanda.app")).toBe(false);
      expect(isCanonicalOrigin("https://manda1pix.app")).toBe(false);
    });

    it("deve rejeitar entradas vazias, nulas ou protocolos inseguros/não-web", () => {
      expect(isCanonicalOrigin("")).toBe(false);
      expect(isCanonicalOrigin("null")).toBe(false);
      expect(isCanonicalOrigin("file://")).toBe(false);
      expect(isCanonicalOrigin("about:blank")).toBe(false);
      expect(isCanonicalOrigin(null)).toBe(false);
      expect(isCanonicalOrigin(undefined)).toBe(false);
    });

    describe("Resolução contextual da origem atual do ambiente", () => {
      const originalLocation = window.location;

      afterEach(() => {
        Object.defineProperty(window, "location", {
          configurable: true,
          value: originalLocation,
        });
      });

      it("deve inferir window.location.origin quando nenhum argumento for passado", () => {
        Object.defineProperty(window, "location", {
          configurable: true,
          value: { origin: "https://mandaumpix.app" },
        });

        expect(isCanonicalOrigin()).toBe(true);
        expect(isOfficialOrigin()).toBe(true);
      });

      it("deve detectar origem maliciosa inferida de window.location.origin", () => {
        Object.defineProperty(window, "location", {
          configurable: true,
          value: { origin: "https://manda-um-pix.online" },
        });

        expect(isCanonicalOrigin()).toBe(false);
        expect(isOfficialOrigin()).toBe(false);
      });

      it("deve recorrer a globalThis.location quando window.location não estiver disponível", () => {
        Object.defineProperty(window, "location", {
          configurable: true,
          value: undefined,
        });
        const originalGlobalLocation = globalThis.location;
        Object.defineProperty(globalThis, "location", {
          configurable: true,
          value: { origin: "https://mandaumpix.app" },
        });

        try {
          expect(isCanonicalOrigin()).toBe(true);
          expect(isProductionOrigin()).toBe(true);
        } finally {
          Object.defineProperty(globalThis, "location", {
            configurable: true,
            value: originalGlobalLocation,
          });
        }
      });

      it("deve retornar falso/vazio quando nenhuma origem estiver definida no ambiente", () => {
        Object.defineProperty(window, "location", {
          configurable: true,
          value: undefined,
        });
        const originalGlobalLocation = globalThis.location;
        Object.defineProperty(globalThis, "location", {
          configurable: true,
          value: undefined,
        });

        try {
          expect(isCanonicalOrigin()).toBe(false);
          expect(isProductionOrigin()).toBe(false);
        } finally {
          Object.defineProperty(globalThis, "location", {
            configurable: true,
            value: originalGlobalLocation,
          });
        }
      });
    });
  });

  describe("isProductionOrigin", () => {
    it("deve retornar true exclusivamente para a origem oficial de produção https://mandaumpix.app", () => {
      expect(isProductionOrigin("https://mandaumpix.app")).toBe(true);
      expect(isProductionOrigin("https://mandaumpix.app/")).toBe(true);
      expect(isProductionOrigin("https://MANDAUMPIX.APP")).toBe(true);
    });

    it("deve retornar false para staging, dev, localhost ou domínios fraudulentos", () => {
      expect(isProductionOrigin("https://stg.mandaumpix.app")).toBe(false);
      expect(isProductionOrigin("https://dev.mandaumpix.app")).toBe(false);
      expect(isProductionOrigin("http://localhost:5776")).toBe(false);
      expect(isProductionOrigin("https://manda-um-pix.online")).toBe(false);
      expect(isProductionOrigin(null)).toBe(false);
    });
  });

  describe("validateOrigin (Relatório Estruturado de Invariantes / INV-01, INV-02, INV-03)", () => {
    it("deve retornar relatório válido e sem mensagem de alerta para o domínio oficial de produção", () => {
      const result = validateOrigin("https://mandaumpix.app");

      expect(result).toEqual({
        isValid: true,
        origin: "https://mandaumpix.app",
        isCanonical: true,
        isOfficial: true,
        isProduction: true,
        isLocal: false,
        officialOrigin: "https://mandaumpix.app",
        warningMessage: null,
      });
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("deve retornar relatório válido para ambiente local de desenvolvimento", () => {
      const result = validateOrigin("http://localhost:5776");

      expect(result).toEqual({
        isValid: true,
        origin: "http://localhost:5776",
        isCanonical: true,
        isOfficial: true,
        isProduction: false,
        isLocal: true,
        officialOrigin: "https://mandaumpix.app",
        warningMessage: null,
      });
    });

    it("deve retornar relatório inválido contendo a mensagem ostensiva de alerta para clone fraudulento (INV-02)", () => {
      const result = validateOrigin("https://manda-um-pix.online");

      expect(result).toEqual({
        isValid: false,
        origin: "https://manda-um-pix.online",
        isCanonical: false,
        isOfficial: false,
        isProduction: false,
        isLocal: false,
        officialOrigin: "https://mandaumpix.app",
        warningMessage:
          "Atenção: Este não é o endereço oficial do Manda um PIX. Acesse com segurança em mandaumpix.app",
      });
    });

    it("deve inferir a origem do ambiente quando chamada sem parâmetros", () => {
      const originalLocation = window.location;
      Object.defineProperty(window, "location", {
        configurable: true,
        value: { origin: "https://mandaumpix.app" },
      });

      try {
        const result = validateOrigin();
        expect(result.isValid).toBe(true);
        expect(result.isProduction).toBe(true);
      } finally {
        Object.defineProperty(window, "location", {
          configurable: true,
          value: originalLocation,
        });
      }
    });
  });
});
