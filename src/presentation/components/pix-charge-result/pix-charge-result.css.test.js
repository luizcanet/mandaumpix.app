import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("pix-charge-result.css (TASK-06.2.5: Estilização BEM, Moldura Óptica e Responsividade)", () => {
  const cssPath = resolve(
    process.cwd(),
    "src/presentation/components/pix-charge-result/pix-charge-result.css",
  );
  const cssContent = readFileSync(cssPath, "utf-8");

  describe("Estrutura Semântica BEM & Layout Flexbox", () => {
    it("deve definir o bloco principal .charge-result com flex column e largura total", () => {
      expect(cssContent).toMatch(/\.charge-result\s*\{[^}]*display:\s*flex/);
      expect(cssContent).toMatch(
        /\.charge-result\s*\{[^}]*flex-direction:\s*column/,
      );
      expect(cssContent).toMatch(/\.charge-result\s*\{[^}]*width:\s*100%/);
    });

    it("deve definir o estado vazio .charge-result--empty com alinhamento centralizado", () => {
      expect(cssContent).toMatch(
        /\.charge-result--empty\s*\{[^}]*align-items:\s*center/,
      );
    });

    it("deve estilizar o container de espera .charge-result__waiting com texto centralizado", () => {
      expect(cssContent).toMatch(
        /\.charge-result__waiting\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__waiting\s*\{[^}]*text-align:\s*center/,
      );
    });

    it("deve definir o ícone de espera com formato arredondado de pílula", () => {
      expect(cssContent).toMatch(
        /\.charge-result__waiting-icon\s*\{[^}]*border-radius:\s*var\(--radius-pill/,
      );
    });
  });

  describe("Cabeçalho da Cobrança e Pílulas de Valor", () => {
    it("deve definir o cabeçalho .charge-result__header com flexbox e linha divisória inferior", () => {
      expect(cssContent).toMatch(
        /\.charge-result__header\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__header\s*\{[^}]*border-bottom:\s*1px\s+solid/,
      );
    });

    it("deve estilizar a badge de cobrança pronta com a cor de sucesso", () => {
      expect(cssContent).toMatch(
        /\.charge-result__badge-ready\s*\{[^}]*color:\s*var\(--color-success/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__badge-ready\s*\{[^}]*text-transform:\s*uppercase/,
      );
    });

    it("deve estilizar a pílula de valor fixo com cores da marca", () => {
      expect(cssContent).toMatch(
        /\.charge-result__amount-pill\s*\{[^}]*background-color:\s*var\(--color-brand-primary/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__amount-pill\s*\{[^}]*color:\s*var\(--color-brand-accent/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__amount-pill\s*\{[^}]*border-radius:\s*var\(--radius-pill/,
      );
    });

    it("deve estilizar a pílula de valor aberto com cores de advertência", () => {
      expect(cssContent).toMatch(
        /\.charge-result__amount-pill--open\s*\{[^}]*background-color:\s*#fef3c7/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__amount-pill--open\s*\{[^}]*color:\s*var\(--color-warning/,
      );
    });
  });

  describe("Palco do QR Code e Moldura Óptica", () => {
    it("deve definir o palco do QR Code .charge-result__qr-stage com alinhamento centralizado", () => {
      expect(cssContent).toMatch(
        /\.charge-result__qr-stage\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__qr-stage\s*\{[^}]*align-items:\s*center/,
      );
    });

    it("deve definir a moldura .charge-result__qr-frame com fundo estritamente branco #ffffff e borda de alto contraste", () => {
      expect(cssContent).toMatch(
        /\.charge-result__qr-frame\s*\{[^}]*background-color:\s*#ffffff/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__qr-frame\s*\{[^}]*border:\s*2px\s+solid/,
      );
    });

    it("deve definir dimensões responsivas de 168x168px para o QR Code SVG", () => {
      expect(cssContent).toMatch(
        /\.charge-result__qr-svg\s*\{[^}]*width:\s*168px/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__qr-svg\s*\{[^}]*height:\s*168px/,
      );
    });
  });

  describe("Bloco Copia e Cola e Ações", () => {
    it("deve estilizar a caixa Copia e Cola com fonte monoespaçada e user-select all", () => {
      expect(cssContent).toMatch(
        /\.charge-result__brcode\s*\{[^}]*font-family:\s*var\(--font-mono/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__brcode\s*\{[^}]*user-select:\s*all/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__brcode\s*\{[^}]*word-break:\s*break-all/,
      );
    });

    it("deve definir indicador de foco visível com :focus-visible para a caixa de código", () => {
      expect(cssContent).toMatch(
        /\.charge-result__brcode:focus-visible\s*\{[^}]*border-color:\s*var\(--color-focus/,
      );
    });

    it("deve definir a grade de ações com 3 colunas proporcionais", () => {
      expect(cssContent).toMatch(
        /\.charge-result__actions\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/,
      );
    });
  });

  describe("Acessibilidade e Compatibilidade Dark Mode", () => {
    it("deve ocultar visualmente a região live com suporte a leitores de tela", () => {
      expect(cssContent).toMatch(
        /\.charge-result__live-region\s*\{[^}]*position:\s*absolute/,
      );
      expect(cssContent).toMatch(
        /\.charge-result__live-region\s*\{[^}]*overflow:\s*hidden/,
      );
    });

    it("deve preservar o fundo branco na moldura do QR Code mesmo no Dark Mode", () => {
      expect(cssContent).toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)/);
      expect(cssContent).toMatch(
        /\.charge-result__qr-frame\s*\{[^}]*background-color:\s*#ffffff/,
      );
    });
  });
});

