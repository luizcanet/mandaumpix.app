import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("pix-key-empty.css (TASK-05.1.4: Estilização BEM, Tokens de Cor e Responsividade)", () => {
  const cssPath = resolve(
    process.cwd(),
    "src/presentation/components/pix-key-empty/pix-key-empty.css",
  );
  const cssContent = readFileSync(cssPath, "utf-8");

  describe("Estrutura Semântica BEM & Layout Flexbox", () => {
    it("deve definir o bloco principal .key-empty-state com flex column, centralização e padding", () => {
      expect(cssContent).toMatch(/\.key-empty-state\s*\{[^}]*display:\s*flex/);
      expect(cssContent).toMatch(
        /\.key-empty-state\s*\{[^}]*flex-direction:\s*column/,
      );
      expect(cssContent).toMatch(
        /\.key-empty-state\s*\{[^}]*align-items:\s*center/,
      );
      expect(cssContent).toMatch(
        /\.key-empty-state\s*\{[^}]*text-align:\s*center/,
      );
    });

    it("deve definir o contêiner do ícone .key-empty-state__icon com fundo de marca", () => {
      expect(cssContent).toMatch(
        /\.key-empty-state__icon\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.key-empty-state__icon\s*\{[^}]*background-color:\s*var\(--color-brand-primary/,
      );
      expect(cssContent).toMatch(
        /\.key-empty-state__icon\s*\{[^}]*color:\s*var\(--color-brand-accent/,
      );
      expect(cssContent).toMatch(
        /\.key-empty-state__icon\s*\{[^}]*border-radius:\s*var\(--radius-lg/,
      );
    });

    it("deve definir o título e a descrição com tipografia e espaçamento adequados", () => {
      expect(cssContent).toMatch(
        /\.key-empty-state__title\s*\{[^}]*font-weight:\s*800/,
      );
      expect(cssContent).toMatch(
        /\.key-empty-state__title\s*\{[^}]*color:\s*var\(--color-text-primary/,
      );
      expect(cssContent).toMatch(
        /\.key-empty-state__description\s*\{[^}]*color:\s*var\(--color-text-secondary/,
      );
      expect(cssContent).toMatch(
        /\.key-empty-state__description\s*\{[^}]*max-width:\s*320px/,
      );
    });
  });

  describe("Acessibilidade (WCAG 2.2 AA) & Alvos de Toque (>= 44x44px)", () => {
    it("deve garantir alvo de toque mínimo >= 44px para o botão CTA (.key-empty-state__cta)", () => {
      expect(cssContent).toMatch(
        /\.key-empty-state__cta[^{]*\{[^}]*min-height:\s*52px/,
      );
    });

    it("deve definir contorno de foco visível com :focus-visible para navegação por teclado", () => {
      expect(cssContent).toMatch(
        /\.key-empty-state__cta:focus-visible[^{]*\{[^}]*outline:/,
      );
    });

    it("deve respeitar a preferência por redução de movimento (prefers-reduced-motion)", () => {
      expect(cssContent).toMatch(
        /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/,
      );
    });

    it("deve prover estilos responsivos para telas compactas (max-width: 360px)", () => {
      expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*360px\s*\)/);
    });
  });
});

