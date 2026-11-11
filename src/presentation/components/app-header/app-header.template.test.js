import { describe, expect, it } from "vitest";
import { appHeaderTemplate } from "./app-header.template.js";

describe("AppHeaderTemplate", () => {
  it("deve renderizar o template padrão quando nenhum contexto for fornecido", () => {
    const html = appHeaderTemplate();
    expect(html).toContain('class="app-header__brand"');
    expect(html).toContain('class="app-header__logo"');
    expect(html).toContain('class="app-header__actions"');
    expect(html).toContain('class="app-header__install-btn hidden"');
    expect(html).toContain("hidden");
  });

  it("deve interpolar corretamente as propriedades fornecidas no contexto", () => {
    const html = appHeaderTemplate({
      logoSrc: "/custom-logo.svg",
      titleText: "Título Customizado",
      subtitleText: "Subtítulo Customizado",
      showInstallButton: true,
      aboutHref: "/custom-about",
    });

    expect(html).toContain('src="/custom-logo.svg"');
    expect(html).toContain("Título Customizado");
    expect(html).toContain("Subtítulo Customizado");
    expect(html).toContain('href="/custom-about"');
    expect(html).not.toContain('class="app-header__install-btn hidden"');
  });

  it("deve ocultar o botão de instalação quando showInstallButton for false", () => {
    const html = appHeaderTemplate({
      showInstallButton: false,
    });

    expect(html).toContain('class="app-header__install-btn hidden"');
    expect(html).toContain("hidden");
  });
});
