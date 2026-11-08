import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("pix-charge-form.css (TASK-06.1.5: Estilização BEM, Tokens de Cor e Responsividade)", () => {
  const cssPath = resolve(
    process.cwd(),
    "src/presentation/components/pix-charge-form/pix-charge-form.css",
  );
  const cssContent = readFileSync(cssPath, "utf-8");

  describe("Estrutura Semântica BEM & Layout Flexbox", () => {
    it("deve definir o bloco principal .charge-form com flex column e largura total", () => {
      expect(cssContent).toMatch(/\.charge-form\s*\{[^}]*display:\s*flex/);
      expect(cssContent).toMatch(
        /\.charge-form\s*\{[^}]*flex-direction:\s*column/,
      );
      expect(cssContent).toMatch(/\.charge-form\s*\{[^}]*width:\s*100%/);
    });

    it("deve definir o campo de valor .amount-field com flex column e largura total", () => {
      expect(cssContent).toMatch(/\.amount-field\s*\{[^}]*display:\s*flex/);
      expect(cssContent).toMatch(
        /\.amount-field\s*\{[^}]*flex-direction:\s*column/,
      );
      expect(cssContent).toMatch(/\.amount-field\s*\{[^}]*width:\s*100%/);
    });

    it("deve estilizar o cabeçalho e a badge de etapa com cores da marca", () => {
      expect(cssContent).toMatch(
        /\.amount-field\s+\.step-badge\s*\{[^}]*background-color:\s*var\(--color-brand-primary/,
      );
      expect(cssContent).toMatch(
        /\.amount-field\s+\.step-badge\s*\{[^}]*color:\s*var\(--color-brand-accent/,
      );
    });

    it("deve definir a caixa de entrada monetária .amount-field__box com suporte a :focus-within", () => {
      expect(cssContent).toMatch(
        /\.amount-field__box\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.amount-field__box:focus-within\s*\{[^}]*border-color:\s*var\(--color-focus/,
      );
    });

    it("deve definir o input monetário alinhado à direita e sem borda interna", () => {
      expect(cssContent).toMatch(
        /\.amount-field__input\s*\{[^}]*text-align:\s*right/,
      );
      expect(cssContent).toMatch(
        /\.amount-field__input\s*\{[^}]*border:\s*none/,
      );
    });
  });

  describe("Pílula de Status e Atalhos de Presets", () => {
    it("deve estilizar a pílula de status em modo fixo e em modo aberto", () => {
      expect(cssContent).toMatch(
        /\.amount-field__status--fixed\s*\{[^}]*color:\s*var\(--color-success/,
      );
      expect(cssContent).toMatch(
        /\.amount-field__status--open\s*\{[^}]*color:\s*var\(--color-warning/,
      );
    });

    it("deve estilizar o modificador ativo dos presets com destaque esmeralda", () => {
      expect(cssContent).toMatch(
        /\.amount-field__preset--active\s*\{[^}]*color:\s*var\(--color-success/,
      );
    });
  });

  describe("Botão CTA 'Manda um PIX' (.charge-cta)", () => {
    it("deve definir o botão CTA com gradiente verde da marca e largura total", () => {
      expect(cssContent).toMatch(/\.charge-cta\s*\{[^}]*width:\s*100%/);
      expect(cssContent).toMatch(/\.charge-cta\s*\{[^}]*min-height:\s*52px/);
      expect(cssContent).toMatch(
        /\.charge-cta\s*\{[^}]*background:\s*linear-gradient/,
      );
    });

    it("deve aplicar estilo esmaecido e cursor desabilitado para o estado inativo", () => {
      expect(cssContent).toMatch(
        /\.charge-cta--disabled,\s*\.charge-cta:disabled\s*\{[^}]*cursor:\s*not-allowed/,
      );
      expect(cssContent).toMatch(
        /\.charge-cta--disabled,\s*\.charge-cta:disabled\s*\{[^}]*opacity:\s*0\.5/,
      );
    });
  });

  describe("Acessibilidade (WCAG 2.2 AA) & Alvos de Toque (>= 44x44px)", () => {
    it("deve garantir alvo de toque mínimo >= 44x44px para o botão de limpeza rápida", () => {
      expect(cssContent).toMatch(
        /\.amount-field__clear-btn\s*\{[^}]*min-width:\s*44px/,
      );
      expect(cssContent).toMatch(
        /\.amount-field__clear-btn\s*\{[^}]*min-height:\s*44px/,
      );
    });

    it("deve garantir alvo de toque mínimo >= 44x44px para os botões de atalhos rápidos", () => {
      expect(cssContent).toMatch(
        /\.amount-field__preset\s*\{[^}]*min-height:\s*44px/,
      );
      expect(cssContent).toMatch(
        /\.amount-field__preset\s*\{[^}]*min-width:\s*44px/,
      );
    });

    it("deve garantir anel de foco visível :focus-visible para todos os controles interativos", () => {
      expect(cssContent).toMatch(
        /\.amount-field__clear-btn:focus-visible\s*\{[^}]*outline:/,
      );
      expect(cssContent).toMatch(
        /\.amount-field__preset:focus-visible\s*\{[^}]*outline:/,
      );
      expect(cssContent).toMatch(
        /\.charge-cta:focus-visible\s*\{[^}]*outline:/,
      );
    });

    it("deve suportar prefers-reduced-motion para desativar transições", () => {
      expect(cssContent).toMatch(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
      );
      expect(cssContent).toMatch(/transition:\s*none/);
    });
  });
});
