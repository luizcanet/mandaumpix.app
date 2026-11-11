import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("security-banner.css — Estilos BEM, WCAG AAA e Alvos de Toque (TASK-08.2.2)", () => {
  const cssPath = resolve(
    process.cwd(),
    "src/presentation/components/security-banner/security-banner.css",
  );
  const cssContent = readFileSync(cssPath, "utf-8");

  describe("Posicionamento Fixo/Sticky e Estrutura BEM", () => {
    it("deve declarar o bloco .security-warning-banner e seletor security-banner no topo", () => {
      expect(cssContent).toMatch(
        /security-banner,\s*\.security-warning-banner/,
      );
      expect(cssContent).toMatch(/position:\s*sticky/);
      expect(cssContent).toMatch(/top:\s*0/);
      expect(cssContent).toMatch(/z-index:\s*1000/);
    });

    it("deve definir classes para elementos internos BEM", () => {
      expect(cssContent).toContain(".security-warning-banner__wrapper");
      expect(cssContent).toContain(".security-warning-banner__icon");
      expect(cssContent).toContain(".security-warning-banner__content");
      expect(cssContent).toContain(".security-warning-banner__title");
      expect(cssContent).toContain(".security-warning-banner__message");
      expect(cssContent).toContain(".security-warning-banner__link");
      expect(cssContent).toContain(".security-warning-banner__dismiss");
    });

    it("deve suportar modificador oculto com display: none", () => {
      expect(cssContent).toMatch(
        /security-banner\[hidden\],\s*\.security-warning-banner--hidden\s*\{[^}]*display:\s*none/,
      );
    });
  });

  describe("Acessibilidade WCAG AAA (Contraste >= 7:1) e Alvos de Toque", () => {
    it("deve utilizar cor de fundo vermelho profundo (#7f1d1d) com texto branco (#ffffff)", () => {
      expect(cssContent).toMatch(/background-color:\s*#7f1d1d/);
      expect(cssContent).toMatch(/color:\s*#ffffff/);
    });

    it("deve garantir alvo de toque mínimo de 44x44px para o botão de dispensar", () => {
      expect(cssContent).toMatch(
        /\.security-warning-banner__dismiss\s*\{[^}]*min-width:\s*44px/,
      );
      expect(cssContent).toMatch(
        /\.security-warning-banner__dismiss\s*\{[^}]*min-height:\s*44px/,
      );
    });

    it("deve ter anel de foco visível de alto contraste no link e botão de dispensar", () => {
      expect(cssContent).toMatch(
        /\.security-warning-banner__link:focus-visible\s*\{[^}]*outline:\s*3px solid #ffffff/,
      );
      expect(cssContent).toMatch(
        /\.security-warning-banner__dismiss:focus-visible\s*\{[^}]*outline:\s*3px solid #ffffff/,
      );
    });
  });

  describe("Responsividade Mobile", () => {
    it("deve incluir media query para telas menores ajustando alinhamento e quebra", () => {
      expect(cssContent).toMatch(/@media\s*\(max-width:\s*640px\)/);
      expect(cssContent).toMatch(/flex-direction:\s*column/);
    });
  });
});
