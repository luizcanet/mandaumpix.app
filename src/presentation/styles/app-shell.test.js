import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("app-shell.css (TASK-04.1.2: Estilos BEM da Casca Global)", () => {
  const cssPath = resolve(
    process.cwd(),
    "src/presentation/styles/app-shell.css",
  );
  const cssContent = readFileSync(cssPath, "utf-8");

  it("defines the .app-root block with full viewport layout and flex column", () => {
    expect(cssContent).toMatch(/\.app-root\s*\{[^}]*display:\s*flex/);
    expect(cssContent).toMatch(/\.app-root\s*\{[^}]*flex-direction:\s*column/);
    expect(cssContent).toMatch(/\.app-root\s*\{[^}]*min-height:\s*100vh/);
  });

  it("defines the .app-header block with brand gradient and high contrast", () => {
    expect(cssContent).toMatch(/\.app-header\s*\{[^}]*display:\s*flex/);
    expect(cssContent).toMatch(/\.app-header\s*\{[^}]*background:/);
    expect(cssContent).toMatch(/\.app-header__brand\s*\{/);
    expect(cssContent).toMatch(/\.app-header__logo\s*\{/);
    expect(cssContent).toMatch(/\.app-header__title\s*\{/);
    expect(cssContent).toMatch(/\.app-header__subtitle\s*\{/);
    expect(cssContent).toMatch(/\.app-header__actions\s*\{/);
  });

  it("defines .app-header action buttons with BEM modifier/element classes", () => {
    expect(cssContent).toMatch(/\.app-header__install-btn\s*\{/);
    expect(cssContent).toMatch(/\.app-header__about-link\s*\{/);
  });

  it("defines the .app-main region expanding flex space", () => {
    expect(cssContent).toMatch(/\.app-main\s*\{[^}]*flex:\s*1/);
    expect(cssContent).toMatch(/\.app-main\s*\{[^}]*display:\s*flex/);
  });

  it("defines the .app-footer block with status dot and link", () => {
    expect(cssContent).toMatch(/\.app-footer\s*\{[^}]*display:\s*flex/);
    expect(cssContent).toMatch(
      /\.app-footer__status\s*\{[^}]*display:\s*inline-flex/,
    );
    expect(cssContent).toMatch(/\.app-footer__dot\s*\{[^}]*background-color:/);
    expect(cssContent).toMatch(
      /\.app-footer__link\s*\{[^}]*text-decoration:\s*underline/,
    );
  });

  it("strictly consumes design tokens with valid fallbacks", () => {
    expect(cssContent).toContain("var(--color-brand-primary");
    expect(cssContent).toContain("var(--color-brand-accent");
    expect(cssContent).toContain("var(--space-");
    expect(cssContent).toContain("var(--radius-");
  });
});

describe("index.html (TASK-04.1.4: Validação Semântica do DOM & Acessibilidade)", () => {
  const htmlPath = resolve(process.cwd(), "index.html");
  const htmlContent = readFileSync(htmlPath, "utf-8");
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  describe("Vinculação de Folhas de Estilo (<head>)", () => {
    it("inclui todas as folhas de estilo essenciais na ordem correta", () => {
      const links = Array.from(
        doc.querySelectorAll('link[rel="stylesheet"]'),
      ).map((link) => link.getAttribute("href"));

      expect(links).toContain("./src/presentation/styles/tokens.css");
      expect(links).toContain("./src/presentation/styles/reset.css");
      expect(links).toContain("./src/presentation/styles/layout.css");
      expect(links).toContain("./src/presentation/styles/app-shell.css");
      expect(links).toContain(
        "./src/presentation/components/vector-icon/vector-icon.css",
      );
    });
  });

  describe("Marcos Semânticos W3C (Landmarks)", () => {
    it("possui o marco principal <main id='app' class='app-root'>", () => {
      const main = doc.querySelector("main#app.app-root");
      expect(main).not.toBeNull();
    });

    it("possui o cabeçalho <header class='app-header'> ou <app-header class='app-header'> dentro de #app", () => {
      const header = doc.querySelector(
        "#app > header.app-header, #app > app-header.app-header",
      );
      expect(header).not.toBeNull();
    });

    it("possui o contêiner de rotas <div id='router-outlet' class='app-main'> com atributos de acessibilidade", () => {
      const outlet = doc.querySelector("#app > #router-outlet.app-main");
      expect(outlet).not.toBeNull();
      expect(outlet?.getAttribute("role")).toBe("region");
      expect(outlet?.getAttribute("aria-label")).toBe("Conteúdo Principal");
    });

    it("possui o rodapé <footer class='app-footer'> dentro de #app", () => {
      const footer = doc.querySelector("#app > footer.app-footer");
      expect(footer).not.toBeNull();
    });
  });

  describe("Hierarquia BEM e Elementos do Cabeçalho (.app-header)", () => {
    it("renderiza a marca com logotipo vetorial acessível e tipografia", () => {
      const brand = doc.querySelector(".app-header__brand");
      expect(brand).not.toBeNull();

      const logo = brand?.querySelector("img.app-header__logo");
      expect(logo).not.toBeNull();
      expect(logo?.getAttribute("src")).toBe("./src/assets/icons/icon.svg");
      expect(logo?.getAttribute("alt")).toBe("Logotipo do Manda um PIX");
      expect(logo?.getAttribute("width")).toBe("42");
      expect(logo?.getAttribute("height")).toBe("42");

      const title = brand?.querySelector(".app-header__title");
      expect(title?.textContent?.trim()).toBe("Manda um PIX");

      const subtitle = brand?.querySelector(".app-header__subtitle");
      expect(subtitle?.textContent?.trim()).toBe("Cobrança rápida via PIX");
    });

    it("renderiza o contêiner de ações (.app-header__actions) com botões e ícones", () => {
      const actions = doc.querySelector(".app-header__actions");
      expect(actions).not.toBeNull();

      const installBtn = actions?.querySelector(
        "button.app-header__install-btn",
      );
      expect(installBtn).not.toBeNull();
      expect(installBtn?.getAttribute("type")).toBe("button");
      expect(installBtn?.getAttribute("aria-label")).toBe(
        "Instalar aplicativo",
      );
      expect(installBtn?.classList.contains("hidden")).toBe(true);
      expect(
        installBtn?.querySelector('vector-icon[name="download"]'),
      ).not.toBeNull();

      const aboutLink = actions?.querySelector("a.app-header__about-link");
      expect(aboutLink).not.toBeNull();
      expect(aboutLink?.getAttribute("href")).toBe("/sobre");
      expect(aboutLink?.getAttribute("aria-label")).toBe("Sobre o aplicativo");
      expect(
        aboutLink?.querySelector('vector-icon[name="circle-info"]'),
      ).not.toBeNull();
    });
  });

  describe("Área de Conteúdo e Split-View (.charge-page)", () => {
    it("inclui a casca .charge-page com o modificador .charge-page--split", () => {
      const chargePage = doc.querySelector(
        "#router-outlet > .charge-page.charge-page--split",
      );
      expect(chargePage).not.toBeNull();
    });
  });

  describe("Rodapé Semântico (.app-footer)", () => {
    it("exibe o status '100% Local & Offline-Ready' com dot indicador decorativo", () => {
      const status = doc.querySelector(".app-footer__status");
      expect(status).not.toBeNull();

      const dot = status?.querySelector(".app-footer__dot");
      expect(dot).not.toBeNull();
      expect(dot?.getAttribute("aria-hidden")).toBe("true");

      expect(status?.textContent).toContain("100% Local & Offline-Ready");
    });

    it("exibe as informações institucionais com link /sobre e licença AGPL-3.0-only", () => {
      const info = doc.querySelector(".app-footer__info");
      expect(info).not.toBeNull();

      const aboutLink = info?.querySelector("a.app-footer__link");
      expect(aboutLink).not.toBeNull();
      expect(aboutLink?.getAttribute("href")).toBe("/sobre");
      expect(aboutLink?.textContent?.trim()).toBe("Sobre");

      const license = info?.querySelector(".app-footer__license");
      expect(license).not.toBeNull();
      expect(license?.textContent?.trim()).toBe("AGPL-3.0-only");
    });

    it("exibe o selo de autenticidade oficial verificado e advertência Zero-Credential (INV-03 / TASK-08.2.3)", () => {
      const security = doc.querySelector(".app-footer__security");
      expect(security).not.toBeNull();
      expect(security?.getAttribute("role")).toBe("status");

      const badge = security?.querySelector(".app-footer__security-badge");
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toContain("Origem Oficial: mandaumpix.app");
      expect(badge?.querySelector('vector-icon[name="check"]')).not.toBeNull();

      const zeroCredential = security?.querySelector(
        ".app-footer__zero-credential",
      );
      expect(zeroCredential).not.toBeNull();
      expect(zeroCredential?.textContent).toContain(
        "Nunca solicitamos senhas bancárias",
      );
    });
  });
});
