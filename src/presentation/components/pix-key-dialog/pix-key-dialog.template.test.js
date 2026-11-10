import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  pixKeyDialogTemplate,
  pixKeyDialogTypesTemplate,
} from "./pix-key-dialog.template.js";
import {
  KEY_DIALOG_CLASSES,
  DEFAULT_KEY_DIALOG_TITLE_ID,
} from "./pix-key-dialog.constants.js";

describe("PixKeyDialogTemplate", () => {
  it("deve escapar caracteres HTML", () => {
    expect(escapeHtml("<input>")).toBe("&lt;input&gt;");
    expect(escapeHtml(null)).toBe("");
  });

  it("deve renderizar os tipos de chave marcando o tipo ativo", () => {
    const html = pixKeyDialogTypesTemplate("EMAIL");
    expect(html).toContain('data-type="EMAIL"');
    expect(html).toContain(KEY_DIALOG_CLASSES.TYPE_BTN_ACTIVE);
    expect(html).toContain('aria-pressed="true"');
  });

  it("deve renderizar modal com campos padrão e valores vazios", () => {
    const html = pixKeyDialogTemplate();
    expect(html).toContain("<dialog");
    expect(html).toContain('id="' + DEFAULT_KEY_DIALOG_TITLE_ID + '"');
    expect(html).toContain('name="valor_chave"');
    expect(html).toContain('name="rotulo"');
    expect(html).toContain('name="nome_recebedor"');
    expect(html).toContain('name="cidade_recebedor"');
  });

  it("deve renderizar erro e destacar campo quando houver erro", () => {
    const html = pixKeyDialogTemplate({
      errorMessage: "Chave inválida",
      errorField: "valor_chave",
    });

    expect(html).toContain(KEY_DIALOG_CLASSES.ALERT);
    expect(html).toContain("Chave inválida");
    expect(html).toContain(KEY_DIALOG_CLASSES.INPUT_ERROR);
  });
});

