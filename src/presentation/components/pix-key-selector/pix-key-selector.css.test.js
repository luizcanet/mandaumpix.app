import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("pix-key-selector.css (TASK-05.2.4: Estilização BEM, Tokens de Cor e Responsividade)", () => {
  const cssPath = resolve(
    process.cwd(),
    "src/presentation/components/pix-key-selector/pix-key-selector.css",
  );
  const cssContent = readFileSync(cssPath, "utf-8");

  describe("Estrutura Semântica BEM & Layout Flexbox", () => {
    it("deve definir o bloco principal .key-selector com flex column e largura total", () => {
      expect(cssContent).toMatch(/\.key-selector\s*\{[^}]*display:\s*flex/);
      expect(cssContent).toMatch(
        /\.key-selector\s*\{[^}]*flex-direction:\s*column/,
      );
      expect(cssContent).toMatch(/\.key-selector\s*\{[^}]*width:\s*100%/);
    });

    it("deve definir o cabeçalho de seção .section-header e badge com fundo da marca", () => {
      expect(cssContent).toMatch(/\.section-header\s*\{[^}]*display:\s*flex/);
      expect(cssContent).toMatch(
        /\.section-header\s*\{[^}]*justify-content:\s*space-between/,
      );
      expect(cssContent).toMatch(
        /\.step-badge\s*\{[^}]*background-color:\s*var\(--color-brand-primary/,
      );
      expect(cssContent).toMatch(
        /\.step-badge\s*\{[^}]*color:\s*var\(--color-brand-accent/,
      );
    });

    it("deve definir o botão '+ Nova chave' .key-selector__add-btn com formato pill e hover", () => {
      expect(cssContent).toMatch(
        /\.key-selector__add-btn\s*\{[^}]*display:\s*inline-flex/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__add-btn\s*\{[^}]*border-radius:\s*var\(--radius-pill/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__add-btn:hover\s*\{[^}]*background-color:/,
      );
    });

    it("deve definir o cartão de rádio .key-selector__card com altura mínima e bordas arredondadas", () => {
      expect(cssContent).toMatch(
        /\.key-selector__card\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__card\s*\{[^}]*min-height:\s*56px/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__card\s*\{[^}]*border-radius:\s*var\(--radius-md/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__card\s*\{[^}]*background-color:\s*var\(--color-surface-muted/,
      );
    });

    it("deve definir o modificador de seleção .key-selector__card--selected com destaque visual", () => {
      expect(cssContent).toMatch(
        /\.key-selector__card--selected\s*\{[^}]*border-color:\s*var\(--color-brand-accent/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__card--selected\s*\{[^}]*background-color:/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__card--selected\s*\{[^}]*box-shadow:/,
      );
    });

    it("deve definir o indicador óptico .key-selector__radio e o ponto .key-selector__radio-dot", () => {
      expect(cssContent).toMatch(
        /\.key-selector__radio\s*\{[^}]*border-radius:\s*var\(--radius-pill/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__card--selected\s+\.key-selector__radio\s*\{[^}]*background-color:\s*var\(--color-brand-accent/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__radio-dot\s*\{[^}]*background-color:\s*var\(--color-brand-primary-dark/,
      );
    });

    it("deve definir a badge de tipo de chave com fonte monoespaçada e contraste de marca", () => {
      expect(cssContent).toMatch(
        /\.key-selector__type-badge\s*\{[^}]*font-family:\s*var\(--font-mono/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__type-badge\s*\{[^}]*background-color:\s*var\(--color-brand-primary/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__type-badge\s*\{[^}]*color:\s*var\(--color-brand-accent/,
      );
    });
  });

  describe("Acessibilidade (WCAG 2.2 AA) & Alvos de Toque (>= 44x44px)", () => {
    it("deve garantir alvo de toque mínimo >= 44x44px para o botão de exclusão (.key-selector__delete-btn)", () => {
      expect(cssContent).toMatch(
        /\.key-selector__delete-btn[^{]*\{[^}]*min-width:\s*44px/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__delete-btn[^{]*\{[^}]*min-height:\s*44px/,
      );
    });

    it("deve definir anéis de foco visíveis :focus-visible para navegação por teclado", () => {
      expect(cssContent).toMatch(
        /\.key-selector__card:focus-visible[^{]*\{[^}]*outline:/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__add-btn:focus-visible[^{]*\{[^}]*outline:/,
      );
      expect(cssContent).toMatch(
        /\.key-selector__delete-btn:focus-visible[^{]*\{[^}]*outline:/,
      );
    });

    it("deve respeitar a preferência por redução de movimento (prefers-reduced-motion)", () => {
      expect(cssContent).toMatch(
        /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/,
      );
    });

    it("deve conter regras responsivas para visualizações compactas (max-width: 360px)", () => {
      expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*360px\s*\)/);
    });
  });
});

