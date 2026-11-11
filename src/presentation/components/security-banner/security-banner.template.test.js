import { describe, expect, it } from "vitest";
import { securityBannerTemplate } from "./security-banner.template.js";
import {
  DEFAULT_SECURITY_BANNER_DISMISS_LABEL,
  DEFAULT_SECURITY_BANNER_LINK_LABEL,
  DEFAULT_SECURITY_BANNER_MESSAGE,
  DEFAULT_SECURITY_BANNER_OFFICIAL_URL,
  DEFAULT_SECURITY_BANNER_TITLE,
  SECURITY_BANNER_ICONS,
} from "./security-banner.constants.js";

describe("security-banner.template.js — Renderização Semântica do Template BEM (TASK-08.2.2)", () => {
  it("deve renderizar o template padrão com todas as classes BEM e textos institucionais", () => {
    const markup = securityBannerTemplate();

    expect(markup).toContain('class="security-warning-banner__wrapper"');
    expect(markup).toContain('class="security-warning-banner__icon"');
    expect(markup).toContain(`name="${SECURITY_BANNER_ICONS.WARNING}"`);
    expect(markup).toContain('class="security-warning-banner__content"');
    expect(markup).toContain(DEFAULT_SECURITY_BANNER_TITLE);
    expect(markup).toContain(DEFAULT_SECURITY_BANNER_MESSAGE);
    expect(markup).toContain(`href="${DEFAULT_SECURITY_BANNER_OFFICIAL_URL}"`);
    expect(markup).toContain(DEFAULT_SECURITY_BANNER_LINK_LABEL);
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain('data-action="dismiss"');
    expect(markup).toContain(
      `aria-label="${DEFAULT_SECURITY_BANNER_DISMISS_LABEL}"`,
    );
    expect(markup).toContain(`name="${SECURITY_BANNER_ICONS.DISMISS}"`);
  });

  it("deve interpolar propriedades customizadas fornecidas no contexto", () => {
    const customContext = {
      titleText: "Aviso de Phishing",
      messageText: "Site não homologado.",
      officialUrl: "https://mandaumpix.app",
      linkLabel: "Ir para o oficial",
      dismissLabel: "Dispensar",
      iconName: "circle-exclamation",
      dismissIcon: "xmark",
    };

    const markup = securityBannerTemplate(customContext);

    expect(markup).toContain("Aviso de Phishing");
    expect(markup).toContain("Site não homologado.");
    expect(markup).toContain('href="https://mandaumpix.app"');
    expect(markup).toContain("Ir para o oficial");
    expect(markup).toContain('aria-label="Dispensar"');
    expect(markup).toContain('name="circle-exclamation"');
  });
});
