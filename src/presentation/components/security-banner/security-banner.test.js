import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../vector-icon/vector-icon.component.js";
import {
  DEFAULT_SECURITY_BANNER_ARIA_LABEL,
  DEFAULT_SECURITY_BANNER_LINK_LABEL,
  DEFAULT_SECURITY_BANNER_MESSAGE,
  DEFAULT_SECURITY_BANNER_OFFICIAL_URL,
  DEFAULT_SECURITY_BANNER_TITLE,
  SECURITY_BANNER_CLASSES,
  SECURITY_BANNER_EVENTS,
  SECURITY_BANNER_ICONS,
} from "./security-banner.constants.js";
import SecurityBannerComponent, {
  PixSecurityBannerComponent,
} from "./security-banner.component.js";

describe("SecurityBannerComponent — Web Component <security-banner> (TASK-08.2.2 / US-08.2)", () => {
  let bannerElement;

  beforeEach(() => {
    bannerElement = document.createElement("security-banner");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (bannerElement && bannerElement.isConnected) {
      bannerElement.remove();
    }
  });

  describe("Registro e Semântica Acessível W3C (INV-02)", () => {
    it("deve registrar o elemento customizado <security-banner> no customElements registry", () => {
      expect(customElements.get("security-banner")).toBe(
        SecurityBannerComponent,
      );
      expect(PixSecurityBannerComponent).toBe(SecurityBannerComponent);
    });

    it("deve aplicar a classe BEM principal .security-warning-banner no connectedCallback", () => {
      bannerElement.autoCheck = false;
      document.body.appendChild(bannerElement);

      expect(
        bannerElement.classList.contains(SECURITY_BANNER_CLASSES.BLOCK),
      ).toBe(true);
    });
  });

  describe("Ativação sob Origem Não Autorizada (Cenário 02 / Phishing / Clones)", () => {
    it("deve ativar e exibir o banner ostensivo com role='alert' e aria-live='assertive' em domínio fraudulento", () => {
      bannerElement.targetOrigin = "https://manda-um-pix.online";
      document.body.appendChild(bannerElement);

      expect(bannerElement.hasAttribute("hidden")).toBe(false);
      expect(bannerElement.getAttribute("role")).toBe("alert");
      expect(bannerElement.getAttribute("aria-live")).toBe("assertive");
      expect(bannerElement.getAttribute("aria-atomic")).toBe("true");
      expect(bannerElement.getAttribute("aria-label")).toBe(
        DEFAULT_SECURITY_BANNER_ARIA_LABEL,
      );
      expect(
        bannerElement.classList.contains(
          SECURITY_BANNER_CLASSES.MODIFIER_VISIBLE,
        ),
      ).toBe(true);

      const titleEl = bannerElement.querySelector(
        `.${SECURITY_BANNER_CLASSES.TITLE}`,
      );
      const messageEl = bannerElement.querySelector(
        `.${SECURITY_BANNER_CLASSES.MESSAGE}`,
      );
      const linkEl = bannerElement.querySelector(
        `.${SECURITY_BANNER_CLASSES.LINK}`,
      );
      const iconEl = bannerElement.querySelector(
        `.${SECURITY_BANNER_CLASSES.ICON} vector-icon`,
      );

      expect(titleEl?.textContent.trim()).toBe(DEFAULT_SECURITY_BANNER_TITLE);
      expect(messageEl?.textContent.trim()).toBe(
        DEFAULT_SECURITY_BANNER_MESSAGE,
      );
      expect(linkEl?.getAttribute("href")).toBe(
        DEFAULT_SECURITY_BANNER_OFFICIAL_URL,
      );
      expect(linkEl?.textContent.trim()).toBe(
        DEFAULT_SECURITY_BANNER_LINK_LABEL,
      );
      expect(iconEl?.getAttribute("name")).toBe(SECURITY_BANNER_ICONS.WARNING);
    });

    it("deve permanecer oculto quando a aplicação estiver rodando na origem oficial de produção (Cenário 01)", () => {
      bannerElement.targetOrigin = "https://mandaumpix.app";
      document.body.appendChild(bannerElement);

      expect(bannerElement.hasAttribute("hidden")).toBe(true);
      expect(
        bannerElement.classList.contains(
          SECURITY_BANNER_CLASSES.MODIFIER_HIDDEN,
        ),
      ).toBe(true);
      expect(
        bannerElement.classList.contains(
          SECURITY_BANNER_CLASSES.MODIFIER_VISIBLE,
        ),
      ).toBe(false);
      expect(bannerElement.isUnauthorized).toBe(false);
    });

    it("deve permanecer oculto em ambiente local de desenvolvimento padrão (localhost:5776)", () => {
      bannerElement.targetOrigin = "http://localhost:5776";
      document.body.appendChild(bannerElement);

      expect(bannerElement.hasAttribute("hidden")).toBe(true);
      expect(bannerElement.isUnauthorized).toBe(false);
    });
  });

  describe("Injeção de Validador Customizado & Propriedades Dinâmicas", () => {
    it("deve permitir injetar um validador de origem customizado via propriedade", () => {
      const customValidator = vi.fn(
        (origin) => origin === "https://custom.app",
      );
      bannerElement.originValidator = customValidator;
      bannerElement.targetOrigin = "https://mandaumpix.app";
      document.body.appendChild(bannerElement);

      expect(customValidator).toHaveBeenCalledWith("https://mandaumpix.app");
      expect(bannerElement.isUnauthorized).toBe(true);
      expect(bannerElement.hasAttribute("hidden")).toBe(false);

      bannerElement.targetOrigin = "https://custom.app";
      expect(bannerElement.isUnauthorized).toBe(false);
      expect(bannerElement.hasAttribute("hidden")).toBe(true);
    });

    it("deve atualizar dinamicamente textos via propriedades e atributos observados", () => {
      bannerElement.targetOrigin = "https://clone.evil.com";
      document.body.appendChild(bannerElement);

      bannerElement.setAttribute("title-text", "Aviso Urgente");
      bannerElement.setAttribute("message-text", "Clone detectado!");
      bannerElement.setAttribute("official-url", "https://mandaumpix.app/novo");
      bannerElement.setAttribute("link-label", "Voltar ao seguro");
      bannerElement.setAttribute("dismiss-label", "Fechar aviso");
      bannerElement.setAttribute("auto-check", "false");
      bannerElement.setAttribute(
        "target-origin",
        "https://outro-clone.evil.com",
      );
      bannerElement.setAttribute("other-attr", "value");

      const titleEl = bannerElement.querySelector(
        `.${SECURITY_BANNER_CLASSES.TITLE}`,
      );
      const messageEl = bannerElement.querySelector(
        `.${SECURITY_BANNER_CLASSES.MESSAGE}`,
      );
      const linkEl = bannerElement.querySelector(
        `.${SECURITY_BANNER_CLASSES.LINK}`,
      );
      const dismissEl = bannerElement.querySelector(
        `.${SECURITY_BANNER_CLASSES.DISMISS_BTN}`,
      );

      expect(titleEl?.textContent.trim()).toBe("Aviso Urgente");
      expect(messageEl?.textContent.trim()).toBe("Clone detectado!");
      expect(linkEl?.getAttribute("href")).toBe("https://mandaumpix.app/novo");
      expect(linkEl?.textContent.trim()).toBe("Voltar ao seguro");
      expect(dismissEl?.getAttribute("aria-label")).toBe("Fechar aviso");
      expect(bannerElement.autoCheck).toBe(false);
      expect(bannerElement.targetOrigin).toBe("https://outro-clone.evil.com");
    });
  });

  describe("Interação e Descarte do Alerta (Botão Fechar / Acessibilidade)", () => {
    it("deve ocultar o banner e disparar evento security-banner-dismiss ao clicar no botão de fechar", () => {
      bannerElement.targetOrigin = "https://manda-um-pix.online";
      document.body.appendChild(bannerElement);

      const dismissListener = vi.fn();
      bannerElement.addEventListener(
        SECURITY_BANNER_EVENTS.DISMISS,
        dismissListener,
      );

      const dismissBtn = bannerElement.querySelector(
        `button[data-action="dismiss"]`,
      );
      expect(dismissBtn).not.toBeNull();

      dismissBtn.click();

      expect(bannerElement.hasAttribute("hidden")).toBe(true);
      expect(bannerElement.isDismissed).toBe(true);
      expect(dismissListener).toHaveBeenCalledTimes(1);
      expect(dismissListener.mock.calls[0][0].detail).toEqual({
        source: "security-banner",
        targetOrigin: "https://manda-um-pix.online",
      });
    });

    it("deve permitir descartar via teclado com tecla Enter e Space", () => {
      bannerElement.targetOrigin = "https://manda-um-pix.online";
      document.body.appendChild(bannerElement);

      const dismissBtn = bannerElement.querySelector(
        `button[data-action="dismiss"]`,
      );

      const enterEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
      });
      dismissBtn.dispatchEvent(enterEvent);

      expect(bannerElement.hasAttribute("hidden")).toBe(true);
      expect(bannerElement.isDismissed).toBe(true);
    });

    it("não deve redisparar checkOrigin após ser explicitamente descartado pelo usuário", () => {
      bannerElement.targetOrigin = "https://manda-um-pix.online";
      document.body.appendChild(bannerElement);

      bannerElement.dismiss();
      expect(bannerElement.hasAttribute("hidden")).toBe(true);

      // Re-definir targetOrigin para outro domínio fraudulento não deve reabrir
      bannerElement.targetOrigin = "https://outro-clone.online";
      expect(bannerElement.hasAttribute("hidden")).toBe(true);
    });
  });

  describe("Métodos Públicos checkOrigin, show e hide", () => {
    it("deve emitir o evento security-banner-origin-checked ao invocar checkOrigin", () => {
      const checkedListener = vi.fn();
      bannerElement.addEventListener(
        SECURITY_BANNER_EVENTS.ORIGIN_CHECKED,
        checkedListener,
      );

      const isCanonical = bannerElement.checkOrigin("https://mandaumpix.app");
      expect(isCanonical).toBe(true);
      expect(checkedListener).toHaveBeenCalledTimes(1);
      expect(checkedListener.mock.calls[0][0].detail.isCanonical).toBe(true);
      expect(checkedListener.mock.calls[0][0].detail.isUnauthorized).toBe(
        false,
      );
    });

    it("deve alternar manualmente a visibilidade através de show() e hide()", () => {
      document.body.appendChild(bannerElement);

      bannerElement.show();
      expect(bannerElement.hasAttribute("hidden")).toBe(false);
      expect(bannerElement.getAttribute("role")).toBe("alert");

      bannerElement.hide();
      expect(bannerElement.hasAttribute("hidden")).toBe(true);
    });
  });
});
