import { describe, expect, it } from "vitest";
import {
  aboutPageTemplate,
  generateSupportQrSvg,
} from "./about-page.template.js";
import {
  ABOUT_AUTHOR,
  ABOUT_NAVIGATION,
  ABOUT_PROJECT,
  ABOUT_SHARE,
  ABOUT_SUPPORT_PIX,
} from "./about-page.constants.js";

describe("AboutPageTemplate", () => {
  it("deve gerar SVG de apoio voluntário", () => {
    const svg = generateSupportQrSvg();
    expect(svg).toContain("<svg");
    expect(svg).toContain("about-page__qr-svg");
  });

  it("deve renderizar o template institucional padrão", () => {
    const html = aboutPageTemplate();
    expect(html).toContain(ABOUT_NAVIGATION.title);
    expect(html).toContain(ABOUT_PROJECT.versionLabel);
    expect(html).toContain(ABOUT_AUTHOR.name);
    expect(html).toContain(ABOUT_SUPPORT_PIX.key);
    expect(html).toContain(ABOUT_SHARE.title);
    expect(html).toContain('<vector-icon name="copy"></vector-icon>');
  });

  it("deve renderizar estado de copiado quando isCopied for true", () => {
    const html = aboutPageTemplate({ isCopied: true });
    expect(html).toContain('<vector-icon name="check"></vector-icon>');
    expect(html).toContain(ABOUT_SUPPORT_PIX.copiedButtonText);
    expect(html).toContain(ABOUT_SUPPORT_PIX.copiedFeedbackMessage);
  });
});

