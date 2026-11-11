import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  pixChargeDialogDismissBtnTemplate,
  pixChargeDialogTemplate,
  pixChargeDialogTitleTemplate,
} from "./pix-charge-dialog.template.js";
import {
  CHARGE_DIALOG_CLASSES,
  DEFAULT_CHARGE_DIALOG_TITLE_ID,
} from "./pix-charge-dialog.constants.js";

describe("PixChargeDialogTemplate", () => {
  it("deve escapar caracteres HTML", () => {
    expect(escapeHtml("<dialog>")).toBe("&lt;dialog&gt;");
    expect(escapeHtml(null)).toBe("");
  });

  it("deve renderizar o template de título corretamente", () => {
    const html = pixChargeDialogTitleTemplate("Cobrança Concluída");
    expect(html).toContain('id="' + DEFAULT_CHARGE_DIALOG_TITLE_ID + '"');
    expect(html).toContain("Cobrança Concluída");
  });

  it("deve renderizar o template do botão dismiss corretamente", () => {
    const html = pixChargeDialogDismissBtnTemplate("Fechar e voltar");
    expect(html).toContain(CHARGE_DIALOG_CLASSES.DISMISS_BTN);
    expect(html).toContain("Fechar e voltar");
  });

  it("deve renderizar a estrutura modal padrão completa", () => {
    const html = pixChargeDialogTemplate({
      titleText: "PIX Gerado",
      closeTitle: "Fechar janela",
      dismissBtnLabel: "Concluir",
    });

    expect(html).toContain("<dialog");
    expect(html).toContain(CHARGE_DIALOG_CLASSES.ROOT);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(CHARGE_DIALOG_CLASSES.TOP_BAR);
    expect(html).toContain("PIX Gerado");
    expect(html).toContain('title="Fechar janela"');
    expect(html).toContain("<pix-charge-result></pix-charge-result>");
    expect(html).toContain("Concluir");
  });
});
