import { describe, expect, it } from "vitest";
import { pixKeyEmptyTemplate } from "./pix-key-empty.template.js";
import { KEY_EMPTY_ICONS } from "./pix-key-empty.constants.js";

describe("PixKeyEmptyTemplate", () => {
  it("deve renderizar estrutura padrão com ícones esperados", () => {
    const html = pixKeyEmptyTemplate();
    expect(html).toContain('class="key-empty-state__icon"');
    expect(html).toContain(
      `<vector-icon name="${KEY_EMPTY_ICONS.KEY}"></vector-icon>`,
    );
    expect(html).toContain(
      `<vector-icon name="${KEY_EMPTY_ICONS.PLUS}"></vector-icon>`,
    );
    expect(html).toContain('class="charge-cta key-empty-state__cta"');
    expect(html).toContain('data-action="open-key-dialog"');
  });

  it("deve interpolar corretamente os textos do contexto", () => {
    const html = pixKeyEmptyTemplate({
      titleText: "Nenhuma chave cadastrada",
      descriptionText: "Cadastre uma chave para continuar.",
      ctaText: "Adicionar chave",
    });

    expect(html).toContain(
      '<h2 class="key-empty-state__title">Nenhuma chave cadastrada</h2>',
    );
    expect(html).toContain(
      '<p class="key-empty-state__description">Cadastre uma chave para continuar.</p>',
    );
    expect(html).toContain('aria-label="Adicionar chave"');
    expect(html).toContain("<span>Adicionar chave</span>");
  });
});
