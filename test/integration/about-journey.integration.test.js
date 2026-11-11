import { afterEach, describe, expect, it } from "vitest";
import {
  SAMPLE_PIX_KEYS,
  flushMicrotasks,
  mountTestApp,
} from "./helpers/setup-app.js";
import {
  ABOUT_AUTHOR,
  ABOUT_PROJECT,
  ABOUT_SECURITY,
  ABOUT_SUPPORT_PIX,
} from "../../src/presentation/pages/about-page/about-page.constants.js";

describe("Jornada Institucional e Navegação SPA (TASK-07.2.6 — RN07)", () => {
  let context = null;

  afterEach(() => {
    if (context) {
      context.cleanup();
      context = null;
    }
  });

  it("deve conduzir a navegação completa: / -> clica link Sobre -> /sobre com informações institucionais -> apoio PIX -> retorno para /", async () => {
    // Inicia na página principal com 1 chave pré-carregada
    context = await mountTestApp({
      initialPath: "/",
      initialKeys: [SAMPLE_PIX_KEYS.CPF],
    });

    const { rootElement, outletElement, mocks } = context;

    expect(window.location.pathname).toBe("/");
    expect(document.title).toBe("Manda um PIX — Cobrança rápida");

    // 1. Navegação SPA via Link "Sobre" no Cabeçalho
    const aboutLink = rootElement.querySelector(".app-header__about-link");
    expect(aboutLink).not.toBeNull();
    aboutLink.click();
    await flushMicrotasks(50);

    // 2. Validação da Rota e Acessibilidade
    expect(window.location.pathname).toBe("/sobre");
    expect(document.title).toBe("Sobre o aplicativo — Manda um PIX");

    const aboutPage = outletElement.querySelector("about-page");
    expect(aboutPage).not.toBeNull();

    // 3. Validação dos Dados do Autor e Licença Livre (RN07)
    const authorSection = aboutPage.querySelector(".about-page__box--author");
    expect(authorSection).not.toBeNull();
    expect(authorSection.textContent).toContain(ABOUT_AUTHOR.name);
    expect(authorSection.textContent).toContain(ABOUT_AUTHOR.email);

    const emailAnchor = authorSection.querySelector(
      `a[href="${ABOUT_AUTHOR.emailUrl}"]`,
    );
    expect(emailAnchor).not.toBeNull();

    const githubAnchor = authorSection.querySelector(
      `a[href="${ABOUT_AUTHOR.githubUrl}"]`,
    );
    expect(githubAnchor).not.toBeNull();

    const linkedinAnchor = authorSection.querySelector(
      `a[href="${ABOUT_AUTHOR.linkedinUrl}"]`,
    );
    expect(linkedinAnchor).not.toBeNull();

    const projectSection = aboutPage.querySelector(".about-page__box--project");
    expect(projectSection).not.toBeNull();
    expect(projectSection.textContent).toContain(ABOUT_PROJECT.license);

    const repoAnchor = projectSection.querySelector(
      `a[href="${ABOUT_PROJECT.repositoryUrl}"]`,
    );
    expect(repoAnchor).not.toBeNull();

    // 3.1 Validação do Card de Segurança, Canal de Denúncia e RFC 9116 security.txt (INV-01, INV-02)
    const securitySection = aboutPage.querySelector(
      ".about-page__box--security",
    );
    expect(securitySection).not.toBeNull();
    expect(securitySection.textContent).toContain(
      ABOUT_SECURITY.zeroCredentialNotice,
    );

    const reportLink = securitySection.querySelector(
      '[data-action="report-fraud"]',
    );
    expect(reportLink).not.toBeNull();
    expect(reportLink.textContent.trim()).toBe(ABOUT_SECURITY.reportButtonText);
    expect(reportLink.getAttribute("href")).toBe(
      ABOUT_SECURITY.reportMailtoUrl,
    );

    const securityTxtLink = securitySection.querySelector(
      ".about-page__security-txt-link",
    );
    expect(securityTxtLink).not.toBeNull();
    expect(securityTxtLink.getAttribute("href")).toBe(
      ABOUT_SECURITY.securityTxtHref,
    );

    // 4. Validação da Seção de Apoio Voluntário ("Manda um PIX")
    const supportSection = aboutPage.querySelector(".about-page__box--support");
    expect(supportSection).not.toBeNull();
    expect(supportSection.textContent).toContain(ABOUT_SUPPORT_PIX.key);

    const qrSvg = supportSection.querySelector(".about-page__qr-svg");
    expect(qrSvg).not.toBeNull();

    const brCodeElement = supportSection.querySelector(".about-page__brcode");
    expect(brCodeElement.textContent.trim()).toBe(ABOUT_SUPPORT_PIX.brCode);

    // 5. Ação Copiar Chave de Apoio
    const copyBtn = supportSection.querySelector(
      'button[data-action="copy-support-brcode"]',
    );
    expect(copyBtn).not.toBeNull();

    copyBtn.click();
    await flushMicrotasks(50);

    expect(mocks.clipboard.writeText).toHaveBeenCalledWith(
      ABOUT_SUPPORT_PIX.brCode,
    );
    expect(mocks.clipboard.text).toBe(ABOUT_SUPPORT_PIX.brCode);
    expect(copyBtn.textContent).toContain(ABOUT_SUPPORT_PIX.copiedButtonText);

    // 6. Ação Divulgar o Aplicativo
    const shareBtn = aboutPage.querySelector('button[data-action="share-app"]');
    expect(shareBtn).not.toBeNull();

    shareBtn.click();
    await flushMicrotasks(50);

    const shareCalled =
      mocks.share.mock.calls.length > 0 ||
      mocks.windowOpen.mock.calls.length > 0;
    expect(shareCalled).toBe(true);

    // 7. Retorno para a Tela Inicial via Botão "Início" na Página Sobre
    const homeBtn = aboutPage.querySelector(
      'button[data-action="navigate-home"]',
    );
    expect(homeBtn).not.toBeNull();

    homeBtn.click();
    await flushMicrotasks(50);

    expect(window.location.pathname).toBe("/");
    expect(document.title).toBe("Manda um PIX — Cobrança rápida");

    const chargePage = outletElement.querySelector(".charge-page");
    expect(chargePage).not.toBeNull();
    expect(chargePage.querySelector("pix-charge-form")).not.toBeNull();
    expect(chargePage.querySelector("pix-key-selector")).not.toBeNull();
  });

  it("deve navegar para /sobre a partir do link do rodapé e retornar clicando na marca do cabeçalho", async () => {
    context = await mountTestApp({
      initialPath: "/",
    });

    const { rootElement, outletElement } = context;

    // Clica no link do rodapé
    const footerLink = rootElement.querySelector(".app-footer__link");
    expect(footerLink).not.toBeNull();

    footerLink.click();
    await flushMicrotasks(50);

    expect(window.location.pathname).toBe("/sobre");
    expect(outletElement.querySelector("about-page")).not.toBeNull();

    // Retorna clicando no logotipo/marca do cabeçalho
    const brandElement = rootElement.querySelector(".app-header__brand");
    expect(brandElement).not.toBeNull();

    brandElement.click();
    await flushMicrotasks(50);

    expect(window.location.pathname).toBe("/");
    expect(outletElement.querySelector(".charge-page")).not.toBeNull();
  });

  it("deve renderizar diretamente a página Sobre quando acessado com initialPath='/sobre'", async () => {
    context = await mountTestApp({
      initialPath: "/sobre",
    });

    const { outletElement } = context;

    await flushMicrotasks(50);

    expect(window.location.pathname).toBe("/sobre");
    expect(document.title).toBe("Sobre o aplicativo — Manda um PIX");
    expect(outletElement.querySelector("about-page")).not.toBeNull();
  });
});
