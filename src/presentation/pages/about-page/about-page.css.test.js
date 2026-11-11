import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("about-page.css (TASK-04.4.4: Estilização BEM, Acessibilidade e Responsividade)", () => {
  const cssPath = resolve(
    process.cwd(),
    "src/presentation/pages/about-page/about-page.css",
  );
  const cssContent = readFileSync(cssPath, "utf-8");

  describe("Estrutura Semântica BEM", () => {
    it("deve definir o bloco principal .about-page como flex column", () => {
      expect(cssContent).toMatch(/\.about-page\s*\{[^}]*display:\s*flex/);
      expect(cssContent).toMatch(
        /\.about-page\s*\{[^}]*flex-direction:\s*column/,
      );
    });

    it("deve definir o cabeçalho e elementos do título", () => {
      expect(cssContent).toMatch(
        /\.about-page__header\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.about-page__title-group\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(/\.about-page__title\s*\{[^}]*color:/);
      expect(cssContent).toMatch(/\.about-page__version\s*\{[^}]*font-family:/);
    });

    it("deve definir as caixas e modificadores (.about-page__box, .about-page__box--support, .about-page__box--share, .about-page__box--security)", () => {
      expect(cssContent).toMatch(/\.about-page__box\s*\{[^}]*display:\s*flex/);
      expect(cssContent).toMatch(
        /\.about-page__box--support\s*\{[^}]*border-color:/,
      );
      expect(cssContent).toMatch(
        /\.about-page__box--support\s*\{[^}]*background-color:/,
      );
      expect(cssContent).toMatch(/\.about-page__box--share\s*\{/);
      expect(cssContent).toMatch(/\.about-page__box--security\s*\{/);
      expect(cssContent).toMatch(
        /\.about-page__security-badge\s*\{[^}]*display:\s*inline-flex/,
      );
      expect(cssContent).toMatch(
        /\.about-page__security-notice\s*\{[^}]*font-size:/,
      );
      expect(cssContent).toMatch(/\.about-page__report-section\s*\{/);
      expect(cssContent).toMatch(
        /\.about-page__report-btn\s*\{[^}]*display:\s*inline-flex/,
      );
      expect(cssContent).toMatch(
        /\.about-page__security-txt-link\s*\{[^}]*display:\s*inline-flex/,
      );
    });

    it("deve definir a área do QR Code e caixa do código Copia e Cola", () => {
      expect(cssContent).toMatch(
        /\.about-page__qr-stage\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.about-page__qr-svg\s*\{[^}]*width:\s*140px/,
      );
      expect(cssContent).toMatch(
        /\.about-page__brcode\s*\{[^}]*font-family:\s*var\(--font-mono/,
      );
      expect(cssContent).toMatch(
        /\.about-page__brcode\s*\{[^}]*word-break:\s*break-all/,
      );
    });

    it("deve conter a classe acessível de live region para leitores de tela", () => {
      expect(cssContent).toMatch(
        /\.about-page__live-region\s*\{[^}]*position:\s*absolute/,
      );
      expect(cssContent).toMatch(
        /\.about-page__live-region\s*\{[^}]*clip-path:\s*inset/,
      );
    });
  });

  describe("Acessibilidade (WCAG 2.2 AA) & Alvos de Toque (>= 44x44px)", () => {
    it("deve garantir alvo de toque mínimo de 44px para o botão Início", () => {
      expect(cssContent).toMatch(
        /\.about-page__home-btn\s*\{[^}]*min-height:\s*44px/,
      );
      expect(cssContent).toMatch(
        /\.about-page__home-btn\s*\{[^}]*min-width:\s*44px/,
      );
    });

    it("deve garantir alvo de toque mínimo de 44px para o botão de cópia", () => {
      expect(cssContent).toMatch(
        /\.about-page__copy-btn\s*\{[^}]*min-height:\s*44px/,
      );
    });

    it("deve garantir alvo de toque mínimo de 44px para o botão de compartilhamento", () => {
      expect(cssContent).toMatch(
        /\.about-page__share-btn\s*\{[^}]*min-height:\s*44px/,
      );
    });

    it("deve garantir alvo de toque mínimo de 44px para links interativos", () => {
      expect(cssContent).toMatch(
        /\.about-page__link\s*\{[^}]*min-height:\s*44px/,
      );
      expect(cssContent).toMatch(
        /\.about-page__report-btn\s*\{[^}]*min-height:\s*44px/,
      );
      expect(cssContent).toMatch(
        /\.about-page__security-txt-link\s*\{[^}]*min-height:\s*44px/,
      );
    });

    it("deve definir anéis de foco visíveis com focus-visible nos botões e links", () => {
      expect(cssContent).toContain(".about-page__home-btn:focus-visible");
      expect(cssContent).toContain(".about-page__copy-btn:focus-visible");
      expect(cssContent).toContain(".about-page__share-btn:focus-visible");
      expect(cssContent).toContain(".about-page__link:focus-visible");
      expect(cssContent).toContain(".about-page__report-btn:focus-visible");
      expect(cssContent).toContain(
        ".about-page__security-txt-link:focus-visible",
      );
    });
  });

  describe("Consumo de Tokens CSS e Responsividade", () => {
    it("deve consumir estritamente os Design Tokens oficiais (--space-*, --color-*, --radius-*, --font-*)", () => {
      expect(cssContent).toContain("var(--space-");
      expect(cssContent).toContain("var(--color-brand-");
      expect(cssContent).toContain("var(--color-surface");
      expect(cssContent).toContain("var(--color-text-");
      expect(cssContent).toContain("var(--radius-");
      expect(cssContent).toContain("var(--font-mono");
    });

    it("deve aplicar media query responsiva para telas desktop (min-width: 768px)", () => {
      expect(cssContent).toContain("@media (min-width: 768px)");
      expect(cssContent).toMatch(
        /@media\s*\(min-width:\s*768px\)\s*\{[^}]*\.about-page\s*\{[^}]*max-width:\s*640px/,
      );
    });
  });
});
