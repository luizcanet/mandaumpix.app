import { describe, expect, it } from "vitest";
import { parsePixCharge } from "../../../infrastructure/pix/pix-qr.service.js";
import {
  ABOUT_AUTHOR,
  ABOUT_NAVIGATION,
  ABOUT_PROJECT,
  ABOUT_SHARE,
  ABOUT_SUPPORT_PIX,
} from "./about-page.constants.js";

describe("about-page.constants", () => {
  describe("Immutabilidade dos objetos", () => {
    it("deve garantir que todas as estruturas exportadas sejam congeladas com Object.freeze", () => {
      expect(Object.isFrozen(ABOUT_AUTHOR)).toBe(true);
      expect(Object.isFrozen(ABOUT_PROJECT)).toBe(true);
      expect(Object.isFrozen(ABOUT_SUPPORT_PIX)).toBe(true);
      expect(Object.isFrozen(ABOUT_SHARE)).toBe(true);
      expect(Object.isFrozen(ABOUT_NAVIGATION)).toBe(true);
    });
  });

  describe("ABOUT_AUTHOR", () => {
    it("deve conter as informações canônicas e válidas do autor", () => {
      expect(ABOUT_AUTHOR.name).toBe("Luiz Henrique Canet Filho");
      expect(ABOUT_AUTHOR.email).toBe("me@luizca.net");
      expect(ABOUT_AUTHOR.emailUrl).toBe("mailto:me@luizca.net");
      expect(ABOUT_AUTHOR.githubUser).toBe("luizcanet");
      expect(ABOUT_AUTHOR.githubUrl).toBe("https://github.com/luizcanet");
      expect(ABOUT_AUTHOR.label).toContain("Autor");
    });
  });

  describe("ABOUT_PROJECT", () => {
    it("deve conter metadados e links canônicos do projeto e da licença livre AGPLv3", () => {
      expect(ABOUT_PROJECT.name).toBe("Manda um PIX");
      expect(ABOUT_PROJECT.domain).toBe("mandaumpix.app");
      expect(ABOUT_PROJECT.version).toBe("1.0.0");
      expect(ABOUT_PROJECT.versionLabel).toBe("mandaumpix.app • v1.0.0");
      expect(ABOUT_PROJECT.license).toBe("AGPL-3.0-only");
      expect(ABOUT_PROJECT.licenseName).toContain(
        "GNU Affero General Public License",
      );
      expect(ABOUT_PROJECT.repositoryUrl).toBe(
        "https://github.com/luizcanet/mandaumpix.app",
      );
      expect(ABOUT_PROJECT.issuesUrl).toBe(
        "https://github.com/luizcanet/mandaumpix.app/issues",
      );
      expect(ABOUT_PROJECT.summary).toContain(
        "gratuito, livre e de código aberto",
      );
    });
  });

  describe("ABOUT_SUPPORT_PIX", () => {
    it("deve conter dados canônicos para contribuição voluntária para eu@luizca.net", () => {
      expect(ABOUT_SUPPORT_PIX.key).toBe("eu@luizca.net");
      expect(ABOUT_SUPPORT_PIX.keyType).toBe("EMAIL");
      expect(ABOUT_SUPPORT_PIX.merchantName).toBe("LUIZ HENRIQUE CANET FILHO");
      expect(ABOUT_SUPPORT_PIX.merchantCity).toBe("BRASILIA");
      expect(ABOUT_SUPPORT_PIX.amount).toBeNull();
      expect(ABOUT_SUPPORT_PIX.isDynamic).toBe(true);
      expect(ABOUT_SUPPORT_PIX.txid).toBe("***");
      expect(ABOUT_SUPPORT_PIX.title).toContain("Manda um PIX");
      expect(ABOUT_SUPPORT_PIX.message).toContain("Manda um PIX!");
      expect(ABOUT_SUPPORT_PIX.copyButtonText).toContain("eu@luizca.net");
      expect(ABOUT_SUPPORT_PIX.copiedButtonText).toBe("Chave copiada!");
      expect(ABOUT_SUPPORT_PIX.copiedFeedbackMessage).toBe(
        "Chave copiada com sucesso!",
      );
    });

    it("deve possuir payload BR Code EMV válido correspondente à chave eu@luizca.net", () => {
      const canonicalBrCode =
        "00020126350014br.gov.bcb.pix0113eu@luizca.net5204000053039865802BR5925LUIZ HENRIQUE CANET FILHO6008BRASILIA62070503***63043C63";

      expect(ABOUT_SUPPORT_PIX.brCode).toBe(canonicalBrCode);

      const { parsed, isStatic } = parsePixCharge(ABOUT_SUPPORT_PIX.brCode);
      expect(isStatic).toBe(true);
      expect(parsed.pixKey).toBe("eu@luizca.net");
      expect(parsed.merchantName).toBe("LUIZ HENRIQUE CANET FILHO");
      expect(parsed.merchantCity).toBe("BRASILIA");
      expect(parsed.transactionAmount).toBe(0);
      expect(parsed.txid).toBe("***");
    });
  });

  describe("ABOUT_SHARE", () => {
    it("deve conter informações e textos atrativos para compartilhamento e divulgação", () => {
      expect(ABOUT_SHARE.shareTitle).toBe("Manda um PIX");
      expect(ABOUT_SHARE.shareUrl).toBe("https://mandaumpix.app");
      expect(ABOUT_SHARE.buttonText).toContain("Compartilhar");
      expect(ABOUT_SHARE.message).toContain("mandaumpix.app");
    });
  });

  describe("ABOUT_NAVIGATION", () => {
    it("deve conter dados canônicos de retorno à raiz da aplicação", () => {
      expect(ABOUT_NAVIGATION.homeHref).toBe("/");
      expect(ABOUT_NAVIGATION.homeButtonText).toBe("Início");
      expect(ABOUT_NAVIGATION.title).toBe("Sobre o Manda um PIX");
      expect(ABOUT_NAVIGATION.logoSrc).toBe("./src/assets/icons/icon.svg");
    });
  });
});
