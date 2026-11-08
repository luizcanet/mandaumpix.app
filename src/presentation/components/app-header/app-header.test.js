import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
});
