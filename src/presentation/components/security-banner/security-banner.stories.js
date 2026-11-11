import "../vector-icon/vector-icon.component.js";
import "../vector-icon/vector-icon.css";
import "./security-banner.component.js";
import "./security-banner.css";
import "../../pages/about-page/about-page.css";
import "../../styles/app-shell.css";
import {
  DEFAULT_SECURITY_BANNER_DISMISS_LABEL,
  DEFAULT_SECURITY_BANNER_LINK_LABEL,
  DEFAULT_SECURITY_BANNER_MESSAGE,
  DEFAULT_SECURITY_BANNER_OFFICIAL_URL,
  DEFAULT_SECURITY_BANNER_TITLE,
  SECURITY_BANNER_CLASSES,
} from "./security-banner.constants.js";
import { ABOUT_SECURITY } from "../../pages/about-page/about-page.constants.js";

/** @type { import('@storybook/html-vite').Meta } */
export default {
  title: "Components/SecurityBanner",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Web Component `<security-banner>` de UX Defensiva construído sobre `@modnes/custom-element`. Ativado automaticamente sob origens não autorizadas (`RN07`, `RN08`, `INV-02`) para alertar o usuário contra cópias fraudulentas, phishing e desvios de dados. Implementa semântica acessível (`role="alert"`, `aria-live="assertive"`, WCAG AAA) com contraste estrito e permite descarte interativo via teclado ou clique.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
          {
            id: "button-name",
            enabled: true,
          },
          {
            id: "target-size",
            enabled: true,
          },
        ],
      },
    },
  },
  argTypes: {
    targetOrigin: {
      control: { type: "text" },
      description:
        "Origem de execução para validação canônica (ex.: domínio não autorizado ou clone fraudulento).",
      table: { defaultValue: { summary: "https://manda-um-pix.online" } },
    },
    titleText: {
      control: { type: "text" },
      description: "Título de advertência do banner.",
      table: { defaultValue: { summary: DEFAULT_SECURITY_BANNER_TITLE } },
    },
    messageText: {
      control: { type: "text" },
      description: "Mensagem detalhada de alerta de autenticidade.",
      table: { defaultValue: { summary: DEFAULT_SECURITY_BANNER_MESSAGE } },
    },
    officialUrl: {
      control: { type: "text" },
      description: "URL canônica segura da aplicação oficial.",
      table: {
        defaultValue: { summary: DEFAULT_SECURITY_BANNER_OFFICIAL_URL },
      },
    },
    linkLabel: {
      control: { type: "text" },
      description: "Rótulo do link de redirecionamento para o domínio oficial.",
      table: { defaultValue: { summary: DEFAULT_SECURITY_BANNER_LINK_LABEL } },
    },
    dismissLabel: {
      control: { type: "text" },
      description: "Rótulo acessível do botão de descarte do banner.",
      table: {
        defaultValue: { summary: DEFAULT_SECURITY_BANNER_DISMISS_LABEL },
      },
    },
    autoCheck: {
      control: { type: "boolean" },
      description: "Habilita a validação automática de origem ao conectar.",
      table: { defaultValue: { summary: "true" } },
    },
  },
  args: {
    targetOrigin: "https://manda-um-pix.online",
    titleText: DEFAULT_SECURITY_BANNER_TITLE,
    messageText: DEFAULT_SECURITY_BANNER_MESSAGE,
    officialUrl: DEFAULT_SECURITY_BANNER_OFFICIAL_URL,
    linkLabel: DEFAULT_SECURITY_BANNER_LINK_LABEL,
    dismissLabel: DEFAULT_SECURITY_BANNER_DISMISS_LABEL,
    autoCheck: true,
  },
  render: ({
    titleText,
    messageText,
    officialUrl,
    linkLabel,
    dismissLabel,
    targetOrigin,
    autoCheck,
  }) => {
    const banner = document.createElement("security-banner");
    if (titleText) banner.setAttribute("title-text", titleText);
    if (messageText) banner.setAttribute("message-text", messageText);
    if (officialUrl) banner.setAttribute("official-url", officialUrl);
    if (linkLabel) banner.setAttribute("link-label", linkLabel);
    if (dismissLabel) banner.setAttribute("dismiss-label", dismissLabel);
    if (targetOrigin) banner.setAttribute("target-origin", targetOrigin);
    if (typeof autoCheck !== "undefined") {
      banner.setAttribute("auto-check", String(autoCheck));
    }
    return banner;
  },
};

/**
 * Visualização padrão exibida quando o aplicativo é executado sob um domínio não autorizado
 * (ex.: clone fraudulento `https://manda-um-pix.online`).
 * O banner é ativado de forma ostensiva (`role="alert"`, `aria-live="assertive"`) com fundo de alto contraste.
 */
export const UnauthorizedOriginAlert = {
  name: "Alerta de Clone / Origem Não Autorizada (US-08.2 / INV-02)",
  args: {
    targetOrigin: "https://manda-um-pix.online",
  },
};

/**
 * Visualização demonstrando mensagens e URLs de redirecionamento customizadas
 * para ambientes de homologação ou campanhas de proteção de marca.
 */
export const CustomAlertContent = {
  name: "Mensagem e URL Customizadas",
  args: {
    targetOrigin: "https://pix-clone-golpe.com",
    titleText: "Atenção Crítica: Cópia Fraudulenta Detectada",
    messageText:
      "Este ambiente não possui autorização para operar o Manda um PIX. Suas chaves locais podem estar em risco.",
    officialUrl: "https://mandaumpix.app",
    linkLabel: "Ir para mandaumpix.app Oficial",
  },
};

/**
 * Visualização interativa demonstrando o botão de descarte e a navegação por teclado.
 */
export const InteractiveDismiss = {
  name: "Interação de Descarte (Botão Fechar & Foco)",
  args: {
    targetOrigin: "https://manda-um-pix.online",
  },
  play: async ({ canvasElement }) => {
    const dismissBtn = canvasElement.querySelector(
      `button[data-action="dismiss"], .${SECURITY_BANNER_CLASSES.DISMISS_BTN}`,
    );
    if (dismissBtn) {
      dismissBtn.focus();
    }
  },
};

/**
 * Visualização demonstrando o comportamento defensivo sob origem oficial (`https://mandaumpix.app`):
 * O componente valida a origem canônica com sucesso e permanece oculto (`hidden="true"`), sem impacto visual.
 */
export const CanonicalOriginHidden = {
  name: "Origem Canônica (Oculto — Não Exibido no Domínio Oficial)",
  args: {
    targetOrigin: "https://mandaumpix.app",
  },
};

/**
 * Visualização do Selo de Autenticidade Canônica Oficial (`INV-03`, `RN08`),
 * exibido na página "Sobre" e no rodapé quando o aplicativo é executado no domínio canônico verificado.
 */
export const AuthenticityBadge = {
  name: "Selo de Autenticidade Oficial (Página Sobre e Rodapé — INV-03, RN08)",
  render: () => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "2rem";
    wrapper.style.padding = "2rem";
    wrapper.style.maxWidth = "640px";
    wrapper.style.fontFamily = "var(--font-sans, system-ui, sans-serif)";

    wrapper.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <span style="font-size: 0.8125rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
          1. Selo na Página "Sobre" (/sobre)
        </span>
        <div
          class="about-page__security-badge"
          role="status"
          aria-label="${ABOUT_SECURITY.badgeAriaLabel}"
        >
          <vector-icon name="${ABOUT_SECURITY.securityIcon}" class="about-page__security-badge-icon"></vector-icon>
          <span class="about-page__security-badge-text">${ABOUT_SECURITY.badgeLabel}</span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <span style="font-size: 0.8125rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
          2. Selo e Aviso Zero-Credential no Rodapé Global (index.html)
        </span>
        <div
          class="app-footer__security"
          role="region"
          aria-label="Autenticidade e Segurança"
        >
          <span class="app-footer__security-badge">
            <vector-icon name="check" class="app-footer__security-badge-icon" aria-hidden="true"></vector-icon>
            <span>${ABOUT_SECURITY.badgeLabel}</span>
          </span>
          <span class="app-footer__security-separator" aria-hidden="true">•</span>
          <span class="app-footer__zero-credential">${ABOUT_SECURITY.zeroCredentialNotice}</span>
        </div>
      </div>
    `;

    return wrapper;
  },
};
