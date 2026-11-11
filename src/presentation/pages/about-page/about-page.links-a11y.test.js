import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import "../../components/vector-icon/vector-icon.component.js";
import "./about-page.component.js";
import {
  ABOUT_AUTHOR,
  ABOUT_PROJECT,
  ABOUT_SECURITY,
  ABOUT_SUPPORT_PIX,
} from "./about-page.constants.js";

describe("AboutPage — Integridade de Links e Acessibilidade WCAG 2.2 AA (TASK-08.3.3)", () => {
  let aboutElement;

  beforeEach(() => {
    aboutElement = document.createElement("about-page");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (aboutElement && aboutElement.isConnected) {
      aboutElement.remove();
    }
  });

  describe("Integridade de Links e Segurança de Navegação (RFC 9116 / RN07 / RN08)", () => {
    it("deve garantir que todos os links <a> possuam atributo href válido e não-vazio", () => {
      document.body.appendChild(aboutElement);

      const links = Array.from(aboutElement.querySelectorAll("a"));
      expect(links.length).toBeGreaterThan(0);

      for (const link of links) {
        const href = link.getAttribute("href");
        expect(href).toBeTruthy();
        expect(href.trim().length).toBeGreaterThan(0);

        const isValidScheme =
          href.startsWith("http://") ||
          href.startsWith("https://") ||
          href.startsWith("mailto:") ||
          href.startsWith("/");
        expect(
          isValidScheme,
          `Link com href="${href}" deve possuir esquema HTTP/HTTPS, mailto: ou caminho relativo/raiz`,
        ).toBe(true);
      }
    });

    it("deve garantir rel='noopener noreferrer' em todos os links externos com target='_blank'", () => {
      document.body.appendChild(aboutElement);

      const blankLinks = Array.from(
        aboutElement.querySelectorAll('a[target="_blank"]'),
      );
      expect(blankLinks.length).toBeGreaterThan(0);

      for (const link of blankLinks) {
        const rel = link.getAttribute("rel") || "";
        expect(rel).toContain("noopener");
        expect(rel).toContain("noreferrer");
      }
    });

    it("deve validar que o link de denúncia de fraudes aponta para mailto: oficial com assunto e corpo canônicos (INV-02)", () => {
      document.body.appendChild(aboutElement);

      const reportLink = aboutElement.querySelector(
        '[data-action="report-fraud"]',
      );
      expect(reportLink).not.toBeNull();
      expect(reportLink.tagName.toLowerCase()).toBe("a");

      const href = reportLink.getAttribute("href");
      expect(href.startsWith("mailto:me@luizca.net?")).toBe(true);

      const parsedUrl = new URL(href);
      expect(parsedUrl.protocol).toBe("mailto:");
      expect(parsedUrl.pathname).toBe("me@luizca.net");

      const searchParams = new URLSearchParams(parsedUrl.search);
      const subject = searchParams.get("subject");
      const body = searchParams.get("body");

      expect(subject).toBe("[Denúncia de Golpe / Cópia Falsa] Manda um PIX");
      expect(body).toContain("URL suspeita/maliciosa:");
      expect(body).toContain("Onde você encontrou o link:");
      expect(body).toContain("Detalhes do ocorrido / evidências:");
      expect(body).toContain("Chave PIX");
    });

    it("deve validar que o link security.txt aponta para /.well-known/security.txt e que o arquivo estático canônico existe", () => {
      document.body.appendChild(aboutElement);

      const securityTxtLink = aboutElement.querySelector(
        ".about-page__security-txt-link",
      );
      expect(securityTxtLink).not.toBeNull();
      expect(securityTxtLink.getAttribute("href")).toBe(
        "/.well-known/security.txt",
      );

      // Validação física da existência do arquivo no repositório
      const filePath = path.resolve(process.cwd(), ".well-known/security.txt");
      expect(fs.existsSync(filePath)).toBe(true);

      const fileContent = fs.readFileSync(filePath, "utf-8");
      expect(fileContent).toContain("Contact: mailto:me@luizca.net");
      expect(fileContent).toContain(
        "Canonical: https://mandaumpix.app/.well-known/security.txt",
      );
    });

    it("deve validar a integridade dos links institucionais do autor, do repositório e do vídeo promocional", () => {
      document.body.appendChild(aboutElement);

      const emailLink = aboutElement.querySelector(
        `a[href="${ABOUT_AUTHOR.emailUrl}"]`,
      );
      expect(emailLink).not.toBeNull();
      expect(emailLink.textContent).toContain(ABOUT_AUTHOR.email);

      const githubLink = aboutElement.querySelector(
        `a[href="${ABOUT_AUTHOR.githubUrl}"]`,
      );
      expect(githubLink).not.toBeNull();

      const linkedinLink = aboutElement.querySelector(
        `a[href="${ABOUT_AUTHOR.linkedinUrl}"]`,
      );
      expect(linkedinLink).not.toBeNull();

      const repoLink = aboutElement.querySelector(
        `a[href="${ABOUT_PROJECT.repositoryUrl}"]`,
      );
      expect(repoLink).not.toBeNull();

      const videoLink = aboutElement.querySelector(
        `a[href="${ABOUT_PROJECT.videoUrl}"]`,
      );
      expect(videoLink).not.toBeNull();
      expect(videoLink.getAttribute("target")).toBe("_blank");
      expect(videoLink.getAttribute("rel")).toContain("noopener");
      expect(videoLink.getAttribute("rel")).toContain("noreferrer");
      expect(videoLink.getAttribute("aria-label")).toBe(
        ABOUT_PROJECT.videoAriaLabel,
      );
    });
  });

  describe("Acessibilidade Semântica e WCAG 2.2 AA", () => {
    it("deve garantir que todos os elementos interativos (links e botões) possuam nome acessível discernível", () => {
      document.body.appendChild(aboutElement);

      const interactives = Array.from(
        aboutElement.querySelectorAll("a, button"),
      );
      expect(interactives.length).toBeGreaterThan(0);

      for (const el of interactives) {
        const ariaLabel = el.getAttribute("aria-label");
        const visibleText = el.textContent?.trim();
        const accessibleName = ariaLabel || visibleText;

        expect(
          Boolean(accessibleName && accessibleName.length > 0),
          `Elemento <${el.tagName.toLowerCase()}> deve possuir texto visível ou aria-label`,
        ).toBe(true);
      }
    });

    it("deve definir landmarks semânticos e labels descritivos na página e no card de segurança", () => {
      document.body.appendChild(aboutElement);

      expect(aboutElement.getAttribute("aria-label")).toBe(
        "Sobre o aplicativo",
      );

      const securitySection = aboutElement.querySelector(
        ".about-page__box--security",
      );
      expect(securitySection).not.toBeNull();
      expect(securitySection.getAttribute("role")).toBe("region");
      expect(securitySection.getAttribute("aria-label")).toBe(
        ABOUT_SECURITY.zeroCredentialTitle,
      );
    });

    it("deve garantir selo de autenticidade acessível com role='status' e aria-label explícito", () => {
      document.body.appendChild(aboutElement);

      const badge = aboutElement.querySelector(".about-page__security-badge");
      expect(badge).not.toBeNull();
      expect(badge.getAttribute("role")).toBe("status");
      expect(badge.getAttribute("aria-label")).toBe(
        ABOUT_SECURITY.badgeAriaLabel,
      );
      expect(badge.textContent).toContain(ABOUT_SECURITY.badgeLabel);
    });

    it("deve garantir acessibilidade de SVGs informativos e ocultação de separadores decorativos", () => {
      document.body.appendChild(aboutElement);

      const qrSvg = aboutElement.querySelector(".about-page__qr-svg");
      expect(qrSvg).not.toBeNull();
      expect(qrSvg.getAttribute("role")).toBe("img");
      expect(qrSvg.getAttribute("aria-label")).toBe(
        ABOUT_SUPPORT_PIX.qrAriaLabel,
      );

      const separators = Array.from(
        aboutElement.querySelectorAll(".about-page__separator"),
      );
      for (const sep of separators) {
        expect(sep.getAttribute("aria-hidden")).toBe("true");
      }
    });

    it("deve conter região de anúncios dinâmicos acessível (aria-live='polite') para status de cópia", () => {
      document.body.appendChild(aboutElement);

      const liveRegion = aboutElement.querySelector("#about-copy-feedback");
      expect(liveRegion).not.toBeNull();
      expect(liveRegion.getAttribute("aria-live")).toBe("polite");
    });

    it("deve permitir que todos os controles interativos recebam foco por teclado sem tabindex negativo", () => {
      document.body.appendChild(aboutElement);

      const interactives = Array.from(
        aboutElement.querySelectorAll("a, button"),
      );
      for (const el of interactives) {
        const tabIndex = el.getAttribute("tabindex");
        if (tabIndex !== null) {
          expect(Number(tabIndex)).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe("Cenário 02 (BDD / Gherkin) — Acionamento do Canal de Denúncia na Interface", () => {
    it("deve disparar evento 'fraud-report-clicked' com dados do mailto ao clicar no link 'Denunciar site falso'", () => {
      document.body.appendChild(aboutElement);

      const fraudListener = vi.fn();
      aboutElement.addEventListener("fraud-report-clicked", fraudListener);

      const reportLink = aboutElement.querySelector(
        '[data-action="report-fraud"]',
      );
      expect(reportLink).not.toBeNull();
      expect(reportLink.textContent.trim()).toBe("Denunciar site falso");

      reportLink.click();

      expect(fraudListener).toHaveBeenCalledTimes(1);
      const detail = fraudListener.mock.calls[0][0].detail;
      expect(detail.mailtoUrl).toBe(ABOUT_SECURITY.reportMailtoUrl);
      expect(detail.subject).toBe(
        "[Denúncia de Golpe / Cópia Falsa] Manda um PIX",
      );
    });
  });
});
