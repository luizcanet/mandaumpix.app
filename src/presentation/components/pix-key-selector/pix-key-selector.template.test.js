import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  pixKeyCardTemplate,
  pixKeySelectorTemplate,
} from "./pix-key-selector.template.js";
import {
  DEFAULT_KEY_SELECTOR_TITLE_ID,
  KEY_SELECTOR_CLASSES,
} from "./pix-key-selector.constants.js";

describe("PixKeySelectorTemplate", () => {
  const sampleKey = {
    id: "key-1",
    rotulo: "Banco Principal",
    tipo_chave: "CPF",
    valor_chave: "123.456.789-00",
  };

  it("deve escapar corretamente caracteres HTML", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
    );
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("deve renderizar o card de chave desmarcado por padrão", () => {
    const html = pixKeyCardTemplate(sampleKey, {
      selectedKeyId: "other-id",
      deleteTitle: "Excluir chave",
    });

    expect(html).toContain('role="radio"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('tabindex="-1"');
    expect(html).not.toContain(KEY_SELECTOR_CLASSES.ITEM_SELECTED);
    expect(html).not.toContain(KEY_SELECTOR_CLASSES.RADIO_DOT);
    expect(html).toContain("Banco Principal");
    expect(html).toContain("CPF");
    expect(html).toContain("123.456.789-00");
  });

  it("deve renderizar o card de chave marcado quando o id for o selecionado", () => {
    const html = pixKeyCardTemplate(sampleKey, {
      selectedKeyId: "key-1",
      deleteTitle: "Excluir chave",
    });

    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain(KEY_SELECTOR_CLASSES.ITEM_SELECTED);
    expect(html).toContain(KEY_SELECTOR_CLASSES.RADIO_DOT);
  });

  it("deve renderizar a estrutura completa do seletor com lista de chaves", () => {
    const html = pixKeySelectorTemplate({
      keys: [sampleKey],
      selectedKeyId: "key-1",
      stepText: "Passo 1",
      titleText: "Selecione a Chave",
      addBtnLabel: "Nova Chave",
      listLabel: "Lista de chaves cadastradas",
      deleteTitle: "Excluir chave",
    });

    expect(html).toContain('id="' + DEFAULT_KEY_SELECTOR_TITLE_ID + '"');
    expect(html).toContain("Passo 1");
    expect(html).toContain("Selecione a Chave");
    expect(html).toContain("Nova Chave");
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain("Lista de chaves cadastradas");
    expect(html).toContain("Banco Principal");
  });

  it("deve renderizar lista vazia quando keys não for fornecido", () => {
    const html = pixKeySelectorTemplate();
    expect(html).toContain('role="radiogroup"');
  });
});
