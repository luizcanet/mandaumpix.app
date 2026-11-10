import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Router from "@modnes/router";
import "../../components/vector-icon/vector-icon.component.js";
import {
  ABOUT_AUTHOR,
  ABOUT_NAVIGATION,
  ABOUT_PROJECT,
  ABOUT_SHARE,
  ABOUT_SUPPORT_PIX,
} from "./about-page.constants.js";
import AboutPageComponent from "./about-page.component.js";

describe("AboutPageComponent (TASK-04.4.2: Testes Unitários de Renderização e Interação)", () => {
  let aboutElement;

  beforeEach(() => {
    aboutElement = document.createElement("about-page");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    if (aboutElement && aboutElement.isConnected) {
      aboutElement.remove();
    }
  });

  describe("Registro e Semântica do Custom Element", () => {
    it("deve registrar o elemento customizado <about-page> no customElements registry", () => {
      expect(customElements.get("about-page")).toBe(AboutPageComponent);
    });

    it("deve aplicar as classes .about-page, .card e o aria-label institucional no connectedCallback", () => {
      document.body.appendChild(aboutElement);

      expect(aboutElement.classList.contains("about-page")).toBe(true);
      expect(aboutElement.classList.contains("card")).toBe(true);
      expect(aboutElement.getAttribute("aria-label")).toBe(
        "Sobre o aplicativo",
      );
    });
  });

  describe("Renderização do Cabeçalho e Apresentação do Aplicativo", () => {
    it("deve renderizar o cabeçalho com logotipo, título, versão e botão de retorno 'Início'", () => {
      document.body.appendChild(aboutElement);

      const logo = aboutElement.querySelector(".about-page__logo");
      expect(logo).not.toBeNull();
      expect(logo.getAttribute("src")).toBe(ABOUT_NAVIGATION.logoSrc);
      expect(logo.getAttribute("alt")).toBe("Logotipo do Manda um PIX");

      const title = aboutElement.querySelector(".about-page__title");
      expect(title).not.toBeNull();
      expect(title.textContent.trim()).toBe(ABOUT_NAVIGATION.title);

      const version = aboutElement.querySelector(".about-page__version");
      expect(version).not.toBeNull();
      expect(version.textContent.trim()).toBe(ABOUT_PROJECT.versionLabel);

      const homeBtn = aboutElement.querySelector(
        '[data-action="navigate-home"]',
      );
      expect(homeBtn).not.toBeNull();
      expect(homeBtn.getAttribute("type")).toBe("button");
      expect(homeBtn.querySelector('vector-icon[name="home"]')).not.toBeNull();
      expect(homeBtn.textContent).toContain(ABOUT_NAVIGATION.homeButtonText);
    });

    it("deve exibir o parágrafo descritivo enfatizando que o app é gratuito, livre e de código aberto", () => {
      document.body.appendChild(aboutElement);

      const summary = aboutElement.querySelector(".about-page__summary");
      expect(summary).not.toBeNull();
      expect(summary.textContent).toContain("Manda um PIX");
      expect(summary.textContent).toContain(
        "gratuito, livre e de código aberto",
      );
      expect(summary.textContent).toContain("100% locais");
    });
  });

  describe("Renderização dos Cards Institucionais", () => {
    it("deve renderizar o Card Autor com nome, link mailto e perfil GitHub com target/rel seguro", () => {
      document.body.appendChild(aboutElement);

      const authorBox = aboutElement.querySelector(".about-page__box--author");
      expect(authorBox).not.toBeNull();
      expect(authorBox.textContent).toContain(ABOUT_AUTHOR.label);
      expect(authorBox.textContent).toContain(ABOUT_AUTHOR.name);

      const emailLink = authorBox.querySelector(
        `a[href="${ABOUT_AUTHOR.emailUrl}"]`,
      );
      expect(emailLink).not.toBeNull();
      expect(emailLink.textContent.trim()).toBe(ABOUT_AUTHOR.email);

      const githubLink = authorBox.querySelector(
        `a[href="${ABOUT_AUTHOR.githubUrl}"]`,
      );
      expect(githubLink).not.toBeNull();
      expect(githubLink.getAttribute("target")).toBe("_blank");
      expect(githubLink.getAttribute("rel")).toBe("noopener noreferrer");
      expect(githubLink.textContent).toContain(ABOUT_AUTHOR.githubUser);

      const linkedinLink = authorBox.querySelector(
        `a[href="${ABOUT_AUTHOR.linkedinUrl}"]`,
      );
      expect(linkedinLink).not.toBeNull();
      expect(linkedinLink.getAttribute("target")).toBe("_blank");
      expect(linkedinLink.getAttribute("rel")).toBe("noopener noreferrer");
      expect(linkedinLink.textContent).toContain(
        `linkedin.com/in/${ABOUT_AUTHOR.linkedinUser}`,
      );
    });

    it("deve renderizar o Card Projeto & Licença com menção à AGPLv3 e link oficial do repositório", () => {
      document.body.appendChild(aboutElement);

      const projectBox = aboutElement.querySelector(
        ".about-page__box--project",
      );
      expect(projectBox).not.toBeNull();
      expect(projectBox.textContent).toContain(ABOUT_PROJECT.label);
      expect(projectBox.textContent).toContain(ABOUT_PROJECT.licenseFull);

      const repoLink = projectBox.querySelector(
        `a[href="${ABOUT_PROJECT.repositoryUrl}"]`,
      );
      expect(repoLink).not.toBeNull();
      expect(repoLink.getAttribute("target")).toBe("_blank");
      expect(repoLink.getAttribute("rel")).toBe("noopener noreferrer");
      expect(repoLink.textContent.trim()).toBe(ABOUT_PROJECT.repositoryUrl);
    });

    it("deve renderizar o Card Apoio Voluntário com título descontraído, QR Code e Chave Copia e Cola", () => {
      document.body.appendChild(aboutElement);

      const supportBox = aboutElement.querySelector(
        ".about-page__box--support",
      );
      expect(supportBox).not.toBeNull();
      expect(supportBox.textContent).toContain(ABOUT_SUPPORT_PIX.title);
      expect(supportBox.textContent).toContain("Manda um PIX!");

      const qrSvg = supportBox.querySelector(".charge-result__qr-svg");
      expect(qrSvg).not.toBeNull();
      expect(qrSvg.getAttribute("role")).toBe("img");
      expect(qrSvg.getAttribute("aria-label")).toBe(
        ABOUT_SUPPORT_PIX.qrAriaLabel,
      );

      const brcode = supportBox.querySelector("#about-support-brcode");
      expect(brcode).not.toBeNull();
      expect(brcode.textContent.trim()).toBe(ABOUT_SUPPORT_PIX.brCode);

      const copyBtn = supportBox.querySelector(
        '[data-action="copy-support-brcode"]',
      );
      expect(copyBtn).not.toBeNull();
      expect(copyBtn.textContent).toContain(ABOUT_SUPPORT_PIX.copyButtonText);
    });

    it("deve renderizar o Card Divulgação com mensagem amigável e botão de compartilhamento", () => {
      document.body.appendChild(aboutElement);

      const shareBox = aboutElement.querySelector(".about-page__box--share");
      expect(shareBox).not.toBeNull();
      expect(shareBox.textContent).toContain(ABOUT_SHARE.title);
      expect(shareBox.textContent).toContain("mandaumpix.app");

      const shareBtn = shareBox.querySelector('[data-action="share-app"]');
      expect(shareBtn).not.toBeNull();
      expect(
        shareBtn.querySelector('vector-icon[name="share"]'),
      ).not.toBeNull();
      expect(shareBtn.textContent).toContain(ABOUT_SHARE.buttonText);
    });
  });

  describe("Interação e Navegação SPA (Botão 'Início')", () => {
    it("deve acionar Router.goTo('/') e disparar evento 'navigate-home' ao clicar no botão Início", () => {
      const goToSpy = vi.spyOn(Router, "goTo").mockImplementation(() => {});
      const navigateListener = vi.fn();
      aboutElement.addEventListener("navigate-home", navigateListener);

      document.body.appendChild(aboutElement);

      const homeBtn = aboutElement.querySelector(
        '[data-action="navigate-home"]',
      );
      homeBtn.click();

      expect(goToSpy).toHaveBeenCalledWith("/");
      expect(navigateListener).toHaveBeenCalledTimes(1);
      expect(navigateListener.mock.calls[0][0].detail.path).toBe("/");
    });

    it("deve utilizar a instância de appRouter injetada quando disponível", () => {
      const mockRouter = { goTo: vi.fn() };
      aboutElement.appRouter = mockRouter;

      document.body.appendChild(aboutElement);

      const homeBtn = aboutElement.querySelector(
        '[data-action="navigate-home"]',
      );
      homeBtn.click();

      expect(mockRouter.goTo).toHaveBeenCalledWith("/");
    });
  });

  describe("Interação de Cópia da Chave Copia e Cola (Feedback Visual & Acessível)", () => {
    it("deve copiar o payload BR Code via navigator.clipboard e atualizar ícone, texto e aria-live", async () => {
      vi.useFakeTimers();

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      const copyListener = vi.fn();
      aboutElement.addEventListener("support-brcode-copied", copyListener);

      document.body.appendChild(aboutElement);

      const copyBtn = aboutElement.querySelector(
        '[data-action="copy-support-brcode"]',
      );
      await copyBtn.click();

      expect(writeTextMock).toHaveBeenCalledWith(ABOUT_SUPPORT_PIX.brCode);
      expect(copyListener).toHaveBeenCalledTimes(1);

      // Feedback ativo
      const icon = copyBtn.querySelector("vector-icon");
      expect(icon.getAttribute("name")).toBe("check");
      expect(copyBtn.textContent).toContain(ABOUT_SUPPORT_PIX.copiedButtonText);

      const feedback = aboutElement.querySelector("#about-copy-feedback");
      expect(feedback.textContent).toContain("Chave copiada com sucesso!");

      // Restauração após timeout
      vi.advanceTimersByTime(2600);

      expect(icon.getAttribute("name")).toBe("copy");
      expect(copyBtn.textContent).toContain(ABOUT_SUPPORT_PIX.copyButtonText);
      expect(feedback.textContent).toBe("");
    });

    it("deve utilizar distributePixChargeUseCase.copyChargeCode quando disponível", async () => {
      const mockUseCase = {
        copyChargeCode: vi.fn().mockResolvedValue({ copied: true }),
      };
      aboutElement.distributePixChargeUseCase = mockUseCase;

      document.body.appendChild(aboutElement);

      const copyBtn = aboutElement.querySelector(
        '[data-action="copy-support-brcode"]',
      );
      await copyBtn.click();

      expect(mockUseCase.copyChargeCode).toHaveBeenCalledWith(
        ABOUT_SUPPORT_PIX.brCode,
      );
    });

    it("deve reiniciar o temporizador de feedback caso o usuário clique em copiar novamente", async () => {
      vi.useFakeTimers();
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      document.body.appendChild(aboutElement);
      const copyBtn = aboutElement.querySelector(
        '[data-action="copy-support-brcode"]',
      );

      await copyBtn.click();
      vi.advanceTimersByTime(1000);
      expect(copyBtn.querySelector("vector-icon").getAttribute("name")).toBe(
        "check",
      );

      // Segundo clique reinicia o timer
      await copyBtn.click();
      vi.advanceTimersByTime(2000);
      expect(copyBtn.querySelector("vector-icon").getAttribute("name")).toBe(
        "check",
      );

      vi.advanceTimersByTime(600);
      expect(copyBtn.querySelector("vector-icon").getAttribute("name")).toBe(
        "copy",
      );
    });

    it("deve emitir evento 'support-brcode-copy-error' quando a gravação falhar", async () => {
      const failureError = new Error("Clipboard permission denied");
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockRejectedValue(failureError) },
      });

      const errorListener = vi.fn();
      aboutElement.addEventListener("support-brcode-copy-error", errorListener);

      document.body.appendChild(aboutElement);

      const copyBtn = aboutElement.querySelector(
        '[data-action="copy-support-brcode"]',
      );
      await copyBtn.click();

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(errorListener.mock.calls[0][0].detail).toBe(failureError);
    });
  });

  describe("Interação de Compartilhamento e Divulgação do Aplicativo", () => {
    it("deve invocar navigator.share com dados oficiais quando suportado", async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share: shareMock });

      const shareListener = vi.fn();
      aboutElement.addEventListener("app-shared", shareListener);

      document.body.appendChild(aboutElement);

      const shareBtn = aboutElement.querySelector('[data-action="share-app"]');
      await shareBtn.click();

      expect(shareMock).toHaveBeenCalledWith({
        title: ABOUT_SHARE.shareTitle,
        text: ABOUT_SHARE.shareText,
        url: ABOUT_SHARE.shareUrl,
      });

      expect(shareListener).toHaveBeenCalledTimes(1);
      expect(shareListener.mock.calls[0][0].detail.channel).toBe("WEB_SHARE");
    });

    it("deve acionar fallback do WhatsApp via window.open quando navigator.share não existir", async () => {
      delete navigator.share;
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => {});

      const shareListener = vi.fn();
      aboutElement.addEventListener("app-shared", shareListener);

      document.body.appendChild(aboutElement);

      const shareBtn = aboutElement.querySelector('[data-action="share-app"]');
      await shareBtn.click();

      expect(openSpy).toHaveBeenCalled();
      const openedUrl = openSpy.mock.calls[0][0];
      expect(openedUrl).toContain("https://wa.me/?text=");
      expect(openedUrl).toContain(encodeURIComponent(ABOUT_SHARE.shareUrl));

      expect(shareListener).toHaveBeenCalledTimes(1);
      expect(shareListener.mock.calls[0][0].detail.channel).toBe("WHATSAPP");
    });

    it("deve delegar para distributePixChargeUseCase.shareCharge quando fornecido", async () => {
      const mockUseCase = {
        shareCharge: vi.fn().mockResolvedValue({ channel: "WHATSAPP" }),
      };
      aboutElement.distributePixChargeUseCase = mockUseCase;

      document.body.appendChild(aboutElement);

      const shareBtn = aboutElement.querySelector('[data-action="share-app"]');
      await shareBtn.click();

      expect(mockUseCase.shareCharge).toHaveBeenCalled();
    });

    it("deve emitir evento 'app-share-error' quando o compartilhamento falhar", async () => {
      const shareError = new Error("Share operation failed");
      Object.assign(navigator, {
        share: vi.fn().mockRejectedValue(shareError),
      });

      const errorListener = vi.fn();
      aboutElement.addEventListener("app-share-error", errorListener);

      document.body.appendChild(aboutElement);

      const shareBtn = aboutElement.querySelector('[data-action="share-app"]');
      await shareBtn.click();

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(errorListener.mock.calls[0][0].detail).toBe(shareError);
    });
  });

  describe("Injeção de Dependências e Reatividade de Atributos", () => {
    it("deve resolver 'app-router' e 'distribute-pix-charge-use-case' via evento 'request-provider'", async () => {
      const mockRouter = { goTo: vi.fn() };
      const mockDistribute = { copyChargeCode: vi.fn() };

      const container = document.createElement("div");
      container.addEventListener("request-provider", (event) => {
        if (event.detail.name === "app-router") {
          event.stopPropagation();
          event.detail.inject(mockRouter);
        } else if (event.detail.name === "distribute-pix-charge-use-case") {
          event.stopPropagation();
          event.detail.inject(mockDistribute);
        }
      });

      document.body.appendChild(container);

      const element = document.createElement("about-page");
      container.appendChild(element);

      await Promise.resolve();

      expect(element.appRouter).toBe(mockRouter);
      expect(element.distributePixChargeUseCase).toBe(mockDistribute);

      container.remove();
    });

    it("deve atualizar dinamicamente o título e a versão quando os atributos observados forem alterados", () => {
      document.body.appendChild(aboutElement);

      aboutElement.setAttribute("title-text", "Sobre o App Personalizado");
      aboutElement.setAttribute("version-text", "custom-app • v2.0.0");

      const title = aboutElement.querySelector(".about-page__title");
      const version = aboutElement.querySelector(".about-page__version");

      expect(title.textContent.trim()).toBe("Sobre o App Personalizado");
      expect(version.textContent.trim()).toBe("custom-app • v2.0.0");
    });

    it("deve atualizar dinamicamente logo-src e home-href quando os atributos forem alterados", () => {
      document.body.appendChild(aboutElement);

      aboutElement.setAttribute("logo-src", "/custom-logo.svg");
      aboutElement.setAttribute("home-href", "/inicio");

      const logo = aboutElement.querySelector(".about-page__logo");
      expect(logo.getAttribute("src")).toBe("/custom-logo.svg");
      expect(aboutElement.homeHref).toBe("/inicio");
    });
  });
});
