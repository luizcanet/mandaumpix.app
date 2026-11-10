import { describe, expect, it } from "vitest";
import { vectorIconTemplate } from "./vector-icon.template.js";

describe("VectorIconTemplate", () => {
  it("deve renderizar o elemento svg com classe .icon e focusable=false", () => {
    const html = vectorIconTemplate();
    expect(html).toContain('<svg class="icon" focusable="false">');
    expect(html).toContain(
      '<use href="" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></use>',
    );
  });

  it("deve compor o href com spritePath e name quando fornecidos", () => {
    const html = vectorIconTemplate({
      name: "qrcode",
      spritePath: "/icons/icon.svg",
    });
    expect(html).toContain('href="/icons/icon.svg#qrcode"');
    expect(html).toContain('xlink:href="/icons/icon.svg#qrcode"');
  });

  it("deve manter href vazio se name for omitido ou vazio", () => {
    const html = vectorIconTemplate({
      name: "",
      spritePath: "/icons/icon.svg",
    });
    expect(html).toContain('href=""');
  });
});
