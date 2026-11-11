import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  pixChargeFormTemplate,
  pixChargePresetsTemplate,
} from "./pix-charge-form.template.js";
import {
  CHARGE_FORM_CLASSES,
  parseChargeAmount,
} from "./pix-charge-form.constants.js";

describe("PixChargeFormTemplate", () => {
  it("deve escapar caracteres HTML", () => {
    expect(escapeHtml("<svg onload=alert(1)>")).toBe(
      "&lt;svg onload=alert(1)&gt;",
    );
    expect(escapeHtml(null)).toBe("");
  });

  it("deve renderizar botões de presets marcando o ativo", () => {
    const parsedAmount = parseChargeAmount("25,00");
    const html = pixChargePresetsTemplate("25,00", parsedAmount);
    expect(html).toContain(CHARGE_FORM_CLASSES.PRESET_ACTIVE);
    expect(html).toContain('data-preset="25"');
  });

  it("deve renderizar botão CTA desabilitado quando selectedKey não for definida", () => {
    const html = pixChargeFormTemplate({
      selectedKey: null,
      ctaText: "Manda um PIX",
    });

    expect(html).toContain(CHARGE_FORM_CLASSES.CTA_DISABLED);
    expect(html).toContain('disabled aria-disabled="true"');
  });

  it("deve renderizar botão CTA habilitado quando selectedKey estiver presente", () => {
    const html = pixChargeFormTemplate({
      selectedKey: { id: "key-1" },
      ctaText: "Manda um PIX",
      amount: "25,00",
    });

    expect(html).not.toContain(CHARGE_FORM_CLASSES.CTA_DISABLED);
    expect(html).toContain('aria-disabled="false"');
    expect(html).toContain('value="25,00"');
  });

  it("deve renderizar mensagem de alerta de erro quando fornecida", () => {
    const html = pixChargeFormTemplate({
      errorMessage: "Erro de validação no valor",
    });

    expect(html).toContain(CHARGE_FORM_CLASSES.ALERT);
    expect(html).toContain("Erro de validação no valor");
  });
});
