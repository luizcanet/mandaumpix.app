import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

describe("pix-charge-dialog.css (TASK-07.4.4: Estilização CSS BEM, Modal Backdrop, Animação Suave e Responsividade)", () => {
  const cssPath = resolve(
    process.cwd(),
    "src/presentation/components/pix-charge-dialog/pix-charge-dialog.css",
  );
  let cssContent = "";

  try {
    cssContent = readFileSync(cssPath, "utf-8");
  } catch {
    cssContent = "";
  }

  describe('1. Estrutura Semântica BEM & Estilização do <dialog class="charge-dialog">', () => {
    it("deve definir estilos para o pseudo-elemento ::backdrop e para a classe fallback .charge-dialog-backdrop", () => {
      expect(cssContent).toMatch(
        /dialog\.charge-dialog::backdrop\s*\{[^}]*background-color:\s*rgba\(\s*6,\s*13,\s*30,\s*0\.65\s*\)/,
      );
      expect(cssContent).toMatch(
        /dialog\.charge-dialog::backdrop\s*\{[^}]*backdrop-filter:\s*blur/,
      );
      expect(cssContent).toMatch(
        /\.charge-dialog-backdrop\s*\{[^}]*position:\s*fixed/,
      );
      expect(cssContent).toMatch(
        /\.charge-dialog-backdrop\s*\{[^}]*background-color:\s*rgba\(\s*6,\s*13,\s*30,\s*0\.65\s*\)/,
      );
    });

    it("deve definir o diálogo modal com position fixed, inset 0, largura máxima de 440px e cantos arredondados", () => {
      expect(cssContent).toMatch(
        /dialog\.charge-dialog\s*\{[^}]*position:\s*fixed/,
      );
      expect(cssContent).toMatch(/dialog\.charge-dialog\s*\{[^}]*inset:\s*0/);
      expect(cssContent).toMatch(
        /dialog\.charge-dialog\s*\{[^}]*max-width:\s*440px/,
      );
      expect(cssContent).toMatch(
        /dialog\.charge-dialog\s*\{[^}]*border-radius:\s*var\(--radius-lg/,
      );
      expect(cssContent).toMatch(
        /dialog\.charge-dialog\s*\{[^}]*background-color:\s*var\(--color-surface/,
      );
      expect(cssContent).toMatch(
        /dialog\.charge-dialog\s*\{[^}]*max-height:\s*90vh/,
      );
      expect(cssContent).toMatch(
        /dialog\.charge-dialog\s*\{[^}]*overflow-y:\s*auto/,
      );
    });

    it("deve ocultar dialogos não abertos com display none", () => {
      expect(cssContent).toMatch(
        /dialog\.charge-dialog:not\(\[open\]\)\s*\{[^}]*display:\s*none/,
      );
    });

    it("deve definir animação suave de abertura para dialogs abertos (chargeDialogFadeIn)", () => {
      expect(cssContent).toMatch(
        /dialog\.charge-dialog\[open\]\s*\{[^}]*animation:\s*chargeDialogFadeIn/,
      );
      expect(cssContent).toMatch(/@keyframes\s+chargeDialogFadeIn/);
    });

    it("deve definir a barra de topo .charge-dialog__top-bar com alinhamento flex e borda divisória", () => {
      expect(cssContent).toMatch(
        /\.charge-dialog__top-bar\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.charge-dialog__top-bar\s*\{[^}]*justify-content:\s*space-between/,
      );
      expect(cssContent).toMatch(
        /\.charge-dialog__top-bar\s*\{[^}]*border-bottom:/,
      );
    });

    it("deve estilizar o título .charge-dialog__title com tipografia destacada e alinhamento do ícone", () => {
      expect(cssContent).toMatch(
        /\.charge-dialog__title\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.charge-dialog__title\s*\{[^}]*align-items:\s*center/,
      );
      expect(cssContent).toMatch(
        /\.charge-dialog__title\s*\{[^}]*color:\s*var\(--color-text-primary/,
      );
    });

    it("deve definir o corpo .charge-dialog__body com preenchimento e rolagem contida", () => {
      expect(cssContent).toMatch(
        /\.charge-dialog__body\s*\{[^}]*display:\s*flex/,
      );
      expect(cssContent).toMatch(
        /\.charge-dialog__body\s*\{[^}]*flex-direction:\s*column/,
      );
    });

    it("deve estilizar o botão de conclusão/fechamento inferior .charge-dialog__dismiss-btn", () => {
      expect(cssContent).toMatch(
        /\.charge-dialog__dismiss-btn\s*\{[^}]*min-height:\s*48px/,
      );
      expect(cssContent).toMatch(
        /\.charge-dialog__dismiss-btn\s*\{[^}]*display:\s*inline-flex/,
      );
      expect(cssContent).toMatch(
        /\.charge-dialog__dismiss-btn\s*\{[^}]*justify-content:\s*center/,
      );
    });
  });

  describe("2. Acessibilidade (WCAG 2.2 AA) & Alvos de Toque (>= 44x44px)", () => {
    it("deve garantir alvo de toque mínimo >= 44x44px para o botão de fechamento (.charge-dialog__close-btn)", () => {
      expect(cssContent).toMatch(
        /\.charge-dialog__close-btn[^{]*\{[^}]*min-width:\s*44px/,
      );
      expect(cssContent).toMatch(
        /\.charge-dialog__close-btn[^{]*\{[^}]*min-height:\s*44px/,
      );
    });

    it("deve garantir altura mínima >= 44px para o botão inferior (.charge-dialog__dismiss-btn)", () => {
      expect(cssContent).toMatch(
        /\.charge-dialog__dismiss-btn[^{]*\{[^}]*min-height:\s*(?:44|48)px/,
      );
    });

    it("deve definir anéis de foco visíveis :focus-visible para navegação por teclado", () => {
      expect(cssContent).toMatch(
        /\.charge-dialog__close-btn:focus-visible[^{]*\{[^}]*outline:/,
      );
      expect(cssContent).toMatch(
        /\.charge-dialog__dismiss-btn:focus-visible[^{]*\{[^}]*outline:/,
      );
    });

    it("deve respeitar a preferência por redução de movimento (prefers-reduced-motion)", () => {
      expect(cssContent).toMatch(
        /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/,
      );
    });

    it("deve conter regras responsivas para telas compactas (max-width: 480px)", () => {
      expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*480px\s*\)/);
    });
  });
});
