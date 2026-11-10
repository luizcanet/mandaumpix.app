import { describe, expect, it } from "vitest";
import {
  DEFAULT_SECURITY_BANNER_ARIA_LABEL,
  DEFAULT_SECURITY_BANNER_DISMISS_LABEL,
  DEFAULT_SECURITY_BANNER_LINK_LABEL,
  DEFAULT_SECURITY_BANNER_MESSAGE,
  DEFAULT_SECURITY_BANNER_OFFICIAL_DOMAIN,
  DEFAULT_SECURITY_BANNER_OFFICIAL_URL,
  DEFAULT_SECURITY_BANNER_TITLE,
  SECURITY_BANNER_CLASSES,
  SECURITY_BANNER_EVENTS,
  SECURITY_BANNER_ICONS,
} from "./security-banner.constants.js";
import {
  CANONICAL_PRODUCTION_ORIGIN,
  OFFICIAL_DOMAIN,
  SECURITY_ALERT_MESSAGE,
} from "../../../domain/security/origin-validator.js";

describe("security-banner.constants.js — Constantes de UX Defensiva (TASK-08.2.2)", () => {
  it("deve alinhar mensagens padrão com o validador de domínio oficial", () => {
    expect(DEFAULT_SECURITY_BANNER_MESSAGE).toBe(SECURITY_ALERT_MESSAGE);
    expect(DEFAULT_SECURITY_BANNER_OFFICIAL_URL).toBe(
      CANONICAL_PRODUCTION_ORIGIN,
    );
    expect(DEFAULT_SECURITY_BANNER_OFFICIAL_DOMAIN).toBe(OFFICIAL_DOMAIN);
  });

  it("deve exportar textos e rótulos acessíveis coerentes para WCAG", () => {
    expect(DEFAULT_SECURITY_BANNER_LINK_LABEL).toBe(
      "Acesse com segurança em mandaumpix.app",
    );
    expect(DEFAULT_SECURITY_BANNER_DISMISS_LABEL).toBe(
      "Fechar alerta de segurança",
    );
    expect(DEFAULT_SECURITY_BANNER_ARIA_LABEL).toBe(
      "Alerta de autenticidade de origem",
    );
    expect(DEFAULT_SECURITY_BANNER_TITLE).toBe("Atenção: Endereço Não Oficial");
  });

  it("deve exportar classes BEM imutáveis incluindo .security-warning-banner (INV-02)", () => {
    expect(Object.isFrozen(SECURITY_BANNER_CLASSES)).toBe(true);
    expect(SECURITY_BANNER_CLASSES.BLOCK).toBe("security-warning-banner");
    expect(SECURITY_BANNER_CLASSES.HOST_TAG).toBe("security-banner");
    expect(SECURITY_BANNER_CLASSES.WRAPPER).toBe(
      "security-warning-banner__wrapper",
    );
    expect(SECURITY_BANNER_CLASSES.ICON).toBe("security-warning-banner__icon");
    expect(SECURITY_BANNER_CLASSES.CONTENT).toBe(
      "security-warning-banner__content",
    );
    expect(SECURITY_BANNER_CLASSES.TITLE).toBe(
      "security-warning-banner__title",
    );
    expect(SECURITY_BANNER_CLASSES.MESSAGE).toBe(
      "security-warning-banner__message",
    );
    expect(SECURITY_BANNER_CLASSES.LINK).toBe("security-warning-banner__link");
    expect(SECURITY_BANNER_CLASSES.DISMISS_BTN).toBe(
      "security-warning-banner__dismiss",
    );
    expect(SECURITY_BANNER_CLASSES.MODIFIER_HIDDEN).toBe(
      "security-warning-banner--hidden",
    );
    expect(SECURITY_BANNER_CLASSES.MODIFIER_VISIBLE).toBe(
      "security-warning-banner--visible",
    );
  });

  it("deve exportar ícones vetoriais congelados existentes no SVG sprite", () => {
    expect(Object.isFrozen(SECURITY_BANNER_ICONS)).toBe(true);
    expect(SECURITY_BANNER_ICONS.WARNING).toBe("triangle-exclamation");
    expect(SECURITY_BANNER_ICONS.DISMISS).toBe("xmark");
  });

  it("deve exportar eventos customizados congelados", () => {
    expect(Object.isFrozen(SECURITY_BANNER_EVENTS)).toBe(true);
    expect(SECURITY_BANNER_EVENTS.DISMISS).toBe("security-banner-dismiss");
    expect(SECURITY_BANNER_EVENTS.ORIGIN_CHECKED).toBe(
      "security-banner-origin-checked",
    );
  });
});
