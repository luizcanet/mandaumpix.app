import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("pix-key-dialog.css (TASK-05.3.4: Estilização CSS BEM, Modal Backdrop, Tokens e Responsividade)", () => {
  const cssPath = resolve(
    process.cwd(),
    "src/presentation/components/pix-key-dialog/pix-key-dialog.css",
  );
  const cssContent = readFileSync(cssPath, "utf-8");

  describe("Estrutura Semântica BEM & Estilização do <dialog>", () => {
    it("deve definir estilos para o pseudo-elemento ::backdrop e para a classe fallback .key-dialog-backdrop", () => {
      expect(cssContent).toMatch(
        /dialog\.key-dialog::backdrop\s*\{[^}]*background-color:/,
      );
      expect(cssContent).toMatch(
        /dialog\.key-dialog::backdrop\s*\{[^}]*backdrop-filter:\s*blur/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog-backdrop\s*\{[^}]*position:\s*fixed/,
      );
    });

    it("deve definir o diálogo modal com position fixed, inset 0, largura máxima e cantos arredondados", () => {
      expect(cssContent).toMatch(
        /dialog\.key-dialog\s*\{[^}]*position:\s*fixed/,
      );
      expect(cssContent).toMatch(/dialog\.key-dialog\s*\{[^}]*inset:\s*0/);
      expect(cssContent).toMatch(
        /dialog\.key-dialog\s*\{[^}]*max-width:\s*420px/,
      );
      expect(cssContent).toMatch(
        /dialog\.key-dialog\s*\{[^}]*border-radius:\s*var\(--radius-lg/,
      );
      expect(cssContent).toMatch(
        /dialog\.key-dialog\s*\{[^}]*background-color:\s*var\(--color-surface/,
      );
    });

    it("deve ocultar dialogos não abertos com display none", () => {
      expect(cssContent).toMatch(
        /dialog\.key-dialog:not\(\[open\]\)\s*\{[^}]*display:\s*none/,
      );
    });

    it("deve definir animação suave de abertura para dialogs abertos", () => {
      expect(cssContent).toMatch(
        /dialog\.key-dialog\[open\]\s*\{[^}]*animation:\s*keyDialogFadeIn/,
      );
      expect(cssContent).toMatch(/@keyframes\s+keyDialogFadeIn/);
    });

    it("deve definir o cabeçalho .key-dialog__header com alinhamento flex e borda divisória", () => {
      expect(cssContent).toMatch(
        /\.key-dialog__header\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__header\s*\{[^}]*justify-content:\s*space-between/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__header\s*\{[^}]*border-bottom:/,
      );
    });

    it("deve configurar a grade de pílulas .key-dialog__types em 5 colunas", () => {
      expect(cssContent).toMatch(
        /\.key-dialog__types\s*\{[^}]*display:\s*grid/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__types\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*1fr\)/,
      );
    });

    it("deve definir o modificador de pílula ativa .key-dialog__type-btn--active com cores de marca", () => {
      expect(cssContent).toMatch(
        /\.key-dialog__type-btn--active\s*\{[^}]*background-color:\s*var\(--color-brand-primary/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__type-btn--active\s*\{[^}]*color:\s*var\(--color-brand-accent/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__type-btn--active\s*\{[^}]*border-color:\s*var\(--color-brand-primary/,
      );
    });

    it("deve definir o alerta de erro acessível .key-dialog__alert com cores de perigo", () => {
      expect(cssContent).toMatch(
        /\.key-dialog__alert\s*\{[^}]*background-color:\s*#fef2f2/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__alert\s*\{[^}]*color:\s*var\(--color-danger/,
      );
    });

    it("deve definir o modificador de campo com erro .key-dialog__input--error", () => {
      expect(cssContent).toMatch(
        /\.key-dialog__input--error\s*\{[^}]*border-color:\s*var\(--color-danger/,
      );
    });

    it("deve formatar o campo de chave com fonte monoespaçada", () => {
      expect(cssContent).toMatch(
        /#key-dialog-input-key\s*\{[^}]*font-family:\s*var\(--font-mono/,
      );
    });

    it("deve definir a linha com duas colunas .key-dialog__row", () => {
      expect(cssContent).toMatch(/\.key-dialog__row\s*\{[^}]*display:\s*grid/);
      expect(cssContent).toMatch(
        /\.key-dialog__row\s*\{[^}]*grid-template-columns:\s*1fr\s+1fr/,
      );
    });

    it("deve estilizar os botões de ação .key-dialog__btn-cancel e .key-dialog__btn-save", () => {
      expect(cssContent).toMatch(
        /\.key-dialog__btn-cancel\s*\{[^}]*min-height:\s*48px/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__btn-save\s*\{[^}]*min-height:\s*48px/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__btn-save\s*\{[^}]*background-color:\s*var\(--color-brand-primary/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__btn-save\s*\{[^}]*color:\s*var\(--color-brand-accent/,
      );
    });
  });

  describe("Acessibilidade (WCAG 2.2 AA) & Alvos de Toque (>= 44x44px)", () => {
    it("deve garantir alvo de toque mínimo >= 44x44px para o botão de fechamento (.key-dialog__close-btn)", () => {
      expect(cssContent).toMatch(
        /\.key-dialog__close-btn[^{]*\{[^}]*min-width:\s*44px/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__close-btn[^{]*\{[^}]*min-height:\s*44px/,
      );
    });

    it("deve garantir altura mínima >= 44px para pílulas de tipo e campos de texto", () => {
      expect(cssContent).toMatch(
        /\.key-dialog__type-btn[^{]*\{[^}]*min-height:\s*44px/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__input[^{]*\{[^}]*min-height:\s*44px/,
      );
    });

    it("deve definir anéis de foco visíveis :focus-visible para navegação por teclado", () => {
      expect(cssContent).toMatch(
        /\.key-dialog__close-btn:focus-visible[^{]*\{[^}]*outline:/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__type-btn:focus-visible[^{]*\{[^}]*outline:/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__btn-cancel:focus-visible[^{]*\{[^}]*outline:/,
      );
      expect(cssContent).toMatch(
        /\.key-dialog__btn-save:focus-visible[^{]*\{[^}]*outline:/,
      );
    });

    it("deve respeitar a preferência por redução de movimento (prefers-reduced-motion)", () => {
      expect(cssContent).toMatch(
        /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/,
      );
    });

    it("deve conter regras responsivas para telas compactas (max-width: 420px)", () => {
      expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*420px\s*\)/);
    });
  });
});
