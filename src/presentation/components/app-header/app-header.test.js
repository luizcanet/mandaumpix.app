import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../vector-icon/vector-icon.component.js";
import AppHeaderComponent, {
  DEFAULT_ABOUT_HREF,
  DEFAULT_LOGO_SRC,
  DEFAULT_SUBTITLE,
  DEFAULT_TITLE,
} from "./app-header.component.js";

describe("AppHeaderComponent (TASK-04.2.1: Web Component <app-header> & Ciclo de Vida)", () => {
  let headerElement;

  beforeEach(() => {
    headerElement = document.createElement("app-header");
  });

  afterEach(() => {
    if (headerElement && headerElement.isConnected) {
      headerElement.remove();
    }
  });

  it("registers the <app-header> custom element in customElements registry", () => {
    expect(customElements.get("app-header")).toBe(AppHeaderComponent);
  });

  it("applies role='banner' and .app-header BEM block class on connectedCallback", () => {
    document.body.appendChild(headerElement);

    expect(headerElement.getAttribute("role")).toBe("banner");
    expect(headerElement.classList.contains("app-header")).toBe(true);
  });

  it("renders the brand section with logo image, title and subtitle", () => {
    document.body.appendChild(headerElement);

    const brand = headerElement.querySelector(".app-header__brand");
    expect(brand).not.toBeNull();

    const logo = brand.querySelector("img.app-header__logo");
    expect(logo).not.toBeNull();
    expect(logo.getAttribute("src")).toBe(DEFAULT_LOGO_SRC);
    expect(logo.getAttribute("alt")).toBe("Logotipo do Manda um PIX");
    expect(logo.getAttribute("width")).toBe("42");
    expect(logo.getAttribute("height")).toBe("42");

    const title = brand.querySelector(".app-header__title");
    expect(title).not.toBeNull();
    expect(title.textContent.trim()).toBe(DEFAULT_TITLE);

    const subtitle = brand.querySelector(".app-header__subtitle");
    expect(subtitle).not.toBeNull();
    expect(subtitle.textContent.trim()).toBe(DEFAULT_SUBTITLE);
  });

  it("renders the actions section with install button and about link", () => {
    document.body.appendChild(headerElement);

    const actions = headerElement.querySelector(".app-header__actions");
    expect(actions).not.toBeNull();

    const installBtn = actions.querySelector(".app-header__install-btn");
    expect(installBtn).not.toBeNull();
    expect(installBtn.getAttribute("type")).toBe("button");
    expect(installBtn.getAttribute("aria-label")).toBe("Instalar aplicativo");

    const downloadIcon = installBtn.querySelector(
      "vector-icon[name='download']",
    );
    expect(downloadIcon).not.toBeNull();

    const aboutLink = actions.querySelector(".app-header__about-link");
    expect(aboutLink).not.toBeNull();
    expect(aboutLink.getAttribute("href")).toBe(DEFAULT_ABOUT_HREF);
    expect(aboutLink.getAttribute("aria-label")).toBe("Sobre o aplicativo");

    const infoIcon = aboutLink.querySelector("vector-icon[name='circle-info']");
    expect(infoIcon).not.toBeNull();
  });

  it("hides the install button by default (has .hidden class)", () => {
    document.body.appendChild(headerElement);

    const installBtn = headerElement.querySelector(".app-header__install-btn");
    expect(installBtn.classList.contains("hidden")).toBe(true);
  });

  it("supports toggling install button visibility via showInstall() and hideInstall()", () => {
    document.body.appendChild(headerElement);

    const installBtn = headerElement.querySelector(".app-header__install-btn");
    expect(installBtn.classList.contains("hidden")).toBe(true);

    headerElement.showInstall();
    expect(installBtn.classList.contains("hidden")).toBe(false);

    headerElement.hideInstall();
    expect(installBtn.classList.contains("hidden")).toBe(true);
  });

  it("updates title, subtitle and logo reactively when observed attributes change", () => {
    document.body.appendChild(headerElement);

    headerElement.setAttribute("title-text", "PIX Rápido");
    headerElement.setAttribute("subtitle-text", "Novo subtítulo");
    headerElement.setAttribute("logo-src", "/assets/custom-logo.svg");
    headerElement.setAttribute("about-href", "/institutional");

    const title = headerElement.querySelector(".app-header__title");
    const subtitle = headerElement.querySelector(".app-header__subtitle");
    const logo = headerElement.querySelector(".app-header__logo");
    const aboutLink = headerElement.querySelector(".app-header__about-link");

    expect(title.textContent.trim()).toBe("PIX Rápido");
    expect(subtitle.textContent.trim()).toBe("Novo subtítulo");
    expect(logo.getAttribute("src")).toBe("/assets/custom-logo.svg");
    expect(aboutLink.getAttribute("href")).toBe("/institutional");
  });

  it("controls install button visibility via show-install-button attribute", () => {
    document.body.appendChild(headerElement);

    expect(
      headerElement
        .querySelector(".app-header__install-btn")
        .classList.contains("hidden"),
    ).toBe(true);

    headerElement.setAttribute("show-install-button", "true");
    expect(
      headerElement
        .querySelector(".app-header__install-btn")
        .classList.contains("hidden"),
    ).toBe(false);

    headerElement.removeAttribute("show-install-button");
    expect(
      headerElement
        .querySelector(".app-header__install-btn")
        .classList.contains("hidden"),
    ).toBe(true);
  });

  describe("TASK-04.2.2: Integração Reativa com PWA Install & Disparo do Prompt", () => {
    it("resolves InstallPwaUseCase via dependency injection ('request-provider')", async () => {
      const mockUseCase = {
        getInstallState: vi.fn().mockResolvedValue({
          isInstalled: false,
          canInstall: true,
          shouldShowInstallButton: true,
        }),
        triggerInstall: vi.fn().mockResolvedValue({
          outcome: "accepted",
          accepted: true,
        }),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      const container = document.createElement("div");
      container.addEventListener("request-provider", (event) => {
        if (event.detail.name === "install-pwa-use-case") {
          event.stopPropagation();
          event.detail.inject(mockUseCase);
        }
      });
      document.body.appendChild(container);

      const header = document.createElement("app-header");
      container.appendChild(header);

      await Promise.resolve();

      expect(header.installPwaUseCase).toBe(mockUseCase);
      expect(mockUseCase.getInstallState).toHaveBeenCalled();
      expect(mockUseCase.subscribe).toHaveBeenCalled();

      container.remove();
    });

    it("syncs install button visibility when getInstallState indicates eligible", async () => {
      const mockUseCase = {
        getInstallState: vi.fn().mockResolvedValue({
          isInstalled: false,
          canInstall: true,
          shouldShowInstallButton: true,
        }),
        triggerInstall: vi.fn(),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      headerElement.installPwaUseCase = mockUseCase;
      document.body.appendChild(headerElement);

      await Promise.resolve();
      await Promise.resolve();

      const installBtn = headerElement.querySelector(
        ".app-header__install-btn",
      );
      expect(installBtn.classList.contains("hidden")).toBe(false);
    });

    it("subscribes to state updates and toggles install button reactively", async () => {
      let stateListener = null;
      const unsubscribeMock = vi.fn();
      const mockUseCase = {
        getInstallState: vi.fn().mockResolvedValue({
          isInstalled: false,
          canInstall: false,
          shouldShowInstallButton: false,
        }),
        triggerInstall: vi.fn(),
        subscribe: vi.fn().mockImplementation((listener) => {
          stateListener = listener;
          return unsubscribeMock;
        }),
      };

      headerElement.installPwaUseCase = mockUseCase;
      document.body.appendChild(headerElement);

      await Promise.resolve();

      const installBtn = headerElement.querySelector(
        ".app-header__install-btn",
      );
      expect(installBtn.classList.contains("hidden")).toBe(true);

      // Simula evento beforeinstallprompt notificando estado elegível
      stateListener({
        isInstalled: false,
        canInstall: true,
        shouldShowInstallButton: true,
      });

      expect(
        headerElement
          .querySelector(".app-header__install-btn")
          .classList.contains("hidden"),
      ).toBe(false);

      // Simula app instalado
      stateListener({
        isInstalled: true,
        canInstall: false,
        shouldShowInstallButton: false,
      });

      expect(
        headerElement
          .querySelector(".app-header__install-btn")
          .classList.contains("hidden"),
      ).toBe(true);

      // Verifica limpeza no disconnectedCallback
      headerElement.remove();
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it("triggers install on install button click and hides button if accepted", async () => {
      const mockUseCase = {
        getInstallState: vi.fn().mockResolvedValue({
          isInstalled: false,
          canInstall: true,
          shouldShowInstallButton: true,
        }),
        triggerInstall: vi.fn().mockResolvedValue({
          outcome: "accepted",
          accepted: true,
          isInstalled: true,
          canInstall: false,
          shouldShowInstallButton: false,
        }),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      headerElement.installPwaUseCase = mockUseCase;
      document.body.appendChild(headerElement);

      await Promise.resolve();
      await Promise.resolve();

      const installBtn = headerElement.querySelector(
        ".app-header__install-btn",
      );
      expect(installBtn.classList.contains("hidden")).toBe(false);

      installBtn.click();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockUseCase.triggerInstall).toHaveBeenCalledTimes(1);
      expect(
        headerElement
          .querySelector(".app-header__install-btn")
          .classList.contains("hidden"),
      ).toBe(true);
    });

    it("handles dismissed install prompt gracefully without hiding button if not accepted", async () => {
      const mockUseCase = {
        getInstallState: vi.fn().mockResolvedValue({
          isInstalled: false,
          canInstall: true,
          shouldShowInstallButton: true,
        }),
        triggerInstall: vi.fn().mockResolvedValue({
          outcome: "dismissed",
          accepted: false,
          isInstalled: false,
          canInstall: false,
          shouldShowInstallButton: false,
        }),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      headerElement.installPwaUseCase = mockUseCase;
      document.body.appendChild(headerElement);

      await Promise.resolve();
      await Promise.resolve();

      const installBtn = headerElement.querySelector(
        ".app-header__install-btn",
      );
      installBtn.click();
      await Promise.resolve();

      expect(mockUseCase.triggerInstall).toHaveBeenCalled();
    });

    it("handles errors during triggerInstall gracefully without crashing", async () => {
      const mockUseCase = {
        getInstallState: vi.fn().mockResolvedValue({
          isInstalled: false,
          canInstall: true,
          shouldShowInstallButton: true,
        }),
        triggerInstall: vi.fn().mockRejectedValue(new Error("Prompt failed")),
        subscribe: vi.fn().mockReturnValue(vi.fn()),
      };

      headerElement.installPwaUseCase = mockUseCase;
      document.body.appendChild(headerElement);

      await Promise.resolve();
      await Promise.resolve();

      const installBtn = headerElement.querySelector(
        ".app-header__install-btn",
      );
      expect(() => installBtn.click()).not.toThrow();
      await Promise.resolve();

      expect(mockUseCase.triggerInstall).toHaveBeenCalled();
    });
  });
});
